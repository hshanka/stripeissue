import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, Content } from 'ionic-angular';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { Geolocation } from '@ionic-native/geolocation';
import { Storage } from '@ionic/storage';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { User } from 'firebase/app';
import { AuthService, UserService, AlgoliaService, WalmartService, BestRxService, LoaderService, ToastService } from './../../providers';
import { CurbSideItem } from './../../models/curbsideItem';
import { ShoppingMode } from './../../models/shoppingMode';
import { MasterItem } from './../../models/masterItem';
import { HomeProductItem } from './../../models/homeProductItem';
import { ProductItem } from './../../models/productItem';
import { ProductItemNP } from './../../models/productItemNP';
import { InStoreItem } from './../../models/instoreItem';

@IonicPage()
@Component({
    selector: 'page-store-search',
    templateUrl: 'store-search.html'
})
export class StoreSearchPage {

    @ViewChild(Content) content: Content;

    private userUUID: any;
    private authenticatedUser: User;
    private authenticatedUser$: Subscription;
    private curbsideListener;
    private shoppingModeListener;
    private inStoreListener;
    private infiniteScroll;
    private searchForm: FormGroup;

    private searchSuccess: boolean = false;
    private partnerStore: boolean = false;
    private storeCurbEnabled: boolean = false;
    private storeInStoreEnabled: boolean = false;
    private cartItemExist: boolean = false;
    private isInfiniteEnable: boolean = true;
    private isInStore: boolean = false;

    private limit: number = 10;
    private cartCount: number = 0;
    private curbsideCount: number = 0;
    private instoreCount: number = 0;
    private pageNumber = 0;
    private latitude: number;
    private longitude: number;

    private keyPagination: string = '';
    private searchValue: string = '';
    private storeId: string;
    private storeName: string;
    private primaryColor: string;
    private secondaryColor: string;
    private storeLogo: string;
    private backgroundImage: string;
    private defaultThumbnail: string = 'assets/imgs/noimagethumbnail.jpg';

    private productListcol: AngularFirestoreCollection<ProductItem>;
    private productListNPcol: AngularFirestoreCollection<ProductItemNP>;
    private curbsideListCol: AngularFirestoreCollection<CurbSideItem>;
    private instoreListCol: AngularFirestoreCollection<InStoreItem>;
    private shoppingModeListCol: AngularFirestoreCollection<ShoppingMode>;
    private masterListCol: AngularFirestoreCollection<MasterItem>;

    private searchHistory: Array<string> = [];
    private searchResults: Observable<any[]>;
    private curbsideList: Observable<any[]>;
    private productList: Array<HomeProductItem> = [];
    private lastProductItem: HomeProductItem;

    constructor(public navCtrl: NavController,
        public navParams: NavParams,
        private formBuilder: FormBuilder,
        private afs: AngularFirestore,
        private geolocation: Geolocation,
        private storage: Storage,
        private authService: AuthService,
        private userService: UserService,
        private bestRxService: BestRxService,
        private walmartService: WalmartService,      
        private algoliaService: AlgoliaService,
        public loaderService: LoaderService,
        public toastService: ToastService
    ) {
        this.searchForm = formBuilder.group({
            searchValuess: ['']
        });
    }

    ionViewWillEnter() {
        this.initLoggedUser();
        this.getSearchHistory();
    }

    ionViewWillLeave() {
        this.resetFields();
    }

    initLoggedUser() {
        try {
            this.userService.getUUID().then(data => {
                if (data != null) {
                    this.userUUID = data;
                    this.initializeStoreSearch();
                    this.getGeolocation();
                }
            })
            // this.storage.get('profile').then((data) => {
            //   if (data != null) {
            //     this.authenticatedUser = data;
            //     this.initializeStoreSearch();
            //     this.getGeolocation();
            //   }
            // });
        } catch (e) { }
    }

    getGeolocation() {
        this.geolocation.getCurrentPosition().then((resp) => {
            this.latitude = resp.coords.latitude;
            this.longitude = resp.coords.longitude;
        }).catch((error) => {
            this.toastService._showToast('Filed to locate you! Please enable gps.', 3000);
        });
    }

    resetFields() {
        this.searchValue = '';
        this.productList = [];
        this.curbsideListener();
        //this.shoppingModeListener();
        if (this.isInStore) {
            this.inStoreListener();
        }
        //this.inStoreListener();
        this.cartItemExist = false;
        this.searchSuccess = false;
        this.cartCount = 0;
        // this.authenticatedUser$.unsubscribe();
    }

    initializeStoreSearch() {
        this.storage.get('store').then((data) => {
            if (data != null) {
                if (data.partner == 'Y') {
                    this.partnerStore = true;
                } else {
                    this.partnerStore = false;
                }
                if (data.curbside == 'Y') {
                    this.storeCurbEnabled = true;
                } else {
                    this.storeCurbEnabled = false;
                }
                if (data.inStore == 'Y') {
                    this.storeInStoreEnabled = true;
                } else {
                    this.storeInStoreEnabled = false;
                }
                this.storeId = data.key;
                this.storeName = data.name;
                this.primaryColor = data.primaryColor;
                this.secondaryColor = data.secondaryColor;
                this.getCountOfCartItems();
                this.checkUserRadious(data);
            }
        });
    }

    getCountOfCartItems() {
        let self = this;
        this.masterListCol = this.afs.collection<MasterItem>('masterList');
        this.productListcol = this.afs.collection<ProductItem>('productList');
        this.productListNPcol = this.afs.collection<ProductItem>('productListNP');
        this.curbsideListCol = this.afs.collection<CurbSideItem>("curbside");
        this.instoreListCol = this.afs.collection<InStoreItem>("instore");
        this.shoppingModeListCol = this.afs.collection<ShoppingMode>("shoppingMode");
        this.curbsideListener = this.curbsideListCol.ref
            .where('userId', '==', this.userUUID)
            .onSnapshot(querySnapshot => {
                self.curbsideCount = querySnapshot.size;
                self.addCartCount();
            }, err => {
                console.error(`Encountered error SS : ${err}`);
            });
        if (this.isInStore) {
            this.inStoreListener = this.instoreListCol.ref
                .where('userId', '==', this.userUUID)
                .where('storeId', '==', this.storeId)
                .onSnapshot(querySnapshot => {
                    self.instoreCount = querySnapshot.size;
                    self.addCartCount();
                }, err => {
                    console.error(`Encountered error SS : ${err}`);
                });
        }
    }

    addCartCount() {
        this.cartCount = this.curbsideCount + this.instoreCount;
        if (this.cartCount) {
            this.cartItemExist = true;
        }
    }

    searchProduct(value) {
        
        this.searchValue = value;
        this.content.scrollToTop(1000);
        if (this.searchValue != '') {
            if (this.partnerStore) {
                this.getProductList();
            } else {
                this.getProductListWalmartAPI();
            }
            this.searchSuccess = true;
        } else {
            this.toastService._showToast('Please Type a Value', 3000);
        }
    }

    getProductList() {
        
        let self = this;
        this.loaderService.show();
        this.pageNumber = 0;
        try {
            this.algoliaService.getProductList(this.storeId, this.searchValue, this.pageNumber).then(result => {
                //let data = result.data;
                let data = JSON.parse(result._body);
                // if (!(result.core && result.core != '')) {
                //     data = JSON.parse(data);
                // }
                this.productList = [];
                this.isInfiniteEnable = true;
                if (data.length > 0) {
                    data.forEach(element => {
                        let homePdtItem = {
                            shoppingModeEnabled: false,
                            curbsideEnabled: false,
                            curbsideQty: 0,
                            shoppingModeQty: 0
                        }
                        let productItem = <HomeProductItem>{ ...element, ...homePdtItem };
                        this.productList.push(<HomeProductItem>productItem);
                        if (data.length < 10) {
                            self.isInfiniteEnable = false;
                        } else {
                            this.pageNumber = this.pageNumber + 1;
                        }
                        self.loaderService.hide();
                    });
                } else {
                    self.loaderService.hide();
                    self.isInfiniteEnable = false;
                    self.toastService._showToast('Item does not exist for this store', 3000);
                }
            }).catch(err => {
                self.loaderService.hide();
                console.error(`Encountered error SS : ${err}`);
            })
            this.saveSearchHistory();
        } catch (err) {
            self.loaderService.hide();
            console.error(`Encountered error SS : ${err}`);
        }
    }

    getDiscountPricein(item) {
        var discount = Number(item.productRegularPrice) - Number(item.productSalesPrice)
        return discount == 0 ? 0 : (discount) / 100
    }

    /* search for a product with keyword*/
    getProductListWalmartAPI() {
        this.loaderService.show();
        let self = this;
        /* search activates only if the letter typed exceeds one*/
        if (this.searchValue.length > 1) {
            this.walmartService.getProductDetaisByKeyword(this.searchValue).subscribe(
                data => {
                    // self.searchResults = [];
                    self.isInfiniteEnable = true;
                    data.items.forEach(element => {
                        let homePdtItem = {
                            productUPC: element.upc,
                            productName: element.name,
                            productImg: element.thumbnailImage,
                            productSalesPrice: element.salePrice,
                            shoppingModeEnabled: false,
                            shoppingModeQty: 0
                        }
                        let productItem = { ...homePdtItem };
                        self.productList.push(<HomeProductItem>productItem);
                        //  self.searchResults.push({ 'product_upc': element.upc, 'product_name': element.name, 'product_img': element.thumbnailImage, 'product_sales_price': '' });
                    });
                    self.loaderService.hide();
                },
                err => {
                    self.loaderService.hide();
                    console.error(`Encountered error SS : ${err}`);
                },
                () => { }
            );
        }
        this.saveSearchHistory();
    }

    saveSearchHistory() {
        if (this.searchHistory.filter(el => el == this.searchValue).length > 0) {
            this.searchHistory = this.searchHistory.filter(el => el != this.searchValue);
        } else {
            if (this.searchHistory.length > 9) {
                this.searchHistory.shift();
            }
        }
        this.searchHistory.push(this.searchValue);
        this.storage.ready().then(() => {
            this.storage.set('searchHis', this.searchHistory);
        });
    }

    getSearchHistory() {
        this.storage.get('searchHis').then((data) => {
            if (data != null) {
                this.searchHistory = data;
            }
        });
    }

    addItemCurbSide(item) {
        if (this.storeCurbEnabled) {
            this.loaderService.show();
            if (item['QtyOnHand'] && item['QtyOnHand'] != '') {
                this.addShoppingItemToCurbSide(item);
            } else {
                this.checkItemCountExist(item);
            }
        }
    }


    checkItemCountExist(item) {
        item['QtyOnHand'] = 100;
        this.addShoppingItemToCurbSide(item);
    }
    //todo
    //uncomment the below code
    //user: faizal

    // checkItemCountExist(item) {
    //     this.bestRxService.checkProductCount([item.productUPC]).then((response) => {
    //         if (!response['core']) {
    //             let responseJSON = JSON.parse(response['data']);
    //             if (responseJSON['Data'][0]['QtyOnHand'] > 0) {
    //                 item['QtyOnHand'] = responseJSON['Data'][0]['QtyOnHand'];
    //                 this.addShoppingItemToCurbSide(item);
    //             } else {
    //                 this.loaderService.hide();
    //                 this.toastService._showToast('The Item is currently OUT OF STOCK', 3000);
    //             }
    //         } else {
    //             this.loaderService.hide();
    //         }
    //     }).catch((err) => {
    //         this.loaderService.hide();
    //         console.error(`Encountered error SS : ${err}`);
    //     });
    // }

    addShoppingItemToCurbSide(item) {
        var self = this;
        let isCurbSideExist = false;
        let intExt = '';
        let isSaved;
        if (this.partnerStore) {
            intExt = 'I';
        } else {
            intExt = 'E';
        }
        var observer = this.curbsideListCol.ref.where('storeId', '==', this.storeId)
            .where('userId', '==', this.userUUID)
            .where('materialId', '==', item.documentId)
            .onSnapshot(querySnapshot => {
                observer();
                let count = querySnapshot.size;
                if (count > 0) {
                    querySnapshot.forEach(function(doc) {
                        self.updateItemInCurbSideFB(item, doc, true);
                    });
                } else {
                    self.saveItemInCurbSideFB(item, intExt, true);
                }
            }, err => {
                this.loaderService.hide();
                console.error(`Encountered error SS : ${err}`);
            });
    }

    saveItemInCurbSideFB(item, intExt, loading) {
        if (item.QtyOnHand > 0) {
            let self = this;
            this.curbsideListCol.add({
                'storeId': this.storeId,
                'userId': this.userUUID,
                'intExt': intExt,
                'materialId': item.documentId,
                'quantity': 1
            }).then(doc => {
                self.addShoppingItemToMasterList(item);
                self.updateAddedBolToProductList(item, 1, 'CS');
            }).catch(err => {
                this.loaderService.hide();
                console.error(`Encountered error SS : ${err}`);
            })
        } else {
            this.loaderService.hide();
            this.toastService._showToast('The Item is currently OUT OF STOCK', 3000);
        }
    }

    updateItemInCurbSideFB(item, doc, loading) {
        let qty = doc.data().quantity + 1;
        if (qty > item.QtyOnHand) {
            this.loaderService.hide();
            this.toastService._showToast('Sorry, the quantity exceeds available stock', 3000);
        } else {
            let self = this;
            this.curbsideListCol.doc(doc.id).set({
                'storeId': this.storeId,
                'userId': this.userUUID,
                'intExt': doc.data().intExt,
                'materialId': doc.data().materialId,
                'quantity': qty
            }).then(doc => {
                self.updateAddedBolToProductList(item, qty, 'CS');
                this.loaderService.hide();
            }).catch(err => {
                console.error(`Encountered error SS : ${err}`);
                this.loaderService.hide();
            })
        }
    }

    addItemShoppingMode(item) {
        /* currently commented to launch for the raleigh pharmacy and need to implement later */
        // if (this.storeInStoreEnabled)
        //   this.addShoppingItemToShoppingMode(item);
        this.toastService._showToast('Store Self Checkout Coming Soon!', 3000);
    }

    ckItemExistProductListNP(item) {//TODO: check whether the item exist or not and add or fetch the id
        let self = this;
        // this.loading = this.loadingCtrl.create({
        //   content: 'Please wait...'
        // });
        // this.loading.present();
        var productSearchListener = this.productListNPcol.ref
            .where('productUPC', '==', item.productUPC)
            .where('storeId', '==', this.storeId)
            .limit(1)
            .onSnapshot(querySnapshot => {
                productSearchListener();
                if (querySnapshot.size > 0) {
                    querySnapshot.forEach(function(doc) {
                        let documentId = doc.id;
                        let homePdtItem = {
                            shoppingModeEnabled: false,
                            curbsideEnabled: false,
                            curbsideQty: 0,
                            shoppingModeQty: 0
                        }
                        self.addShoppingItemToShoppingMode({ documentId, ...item, ...homePdtItem })
                    });
                } else {
                    self.addItemToProductMasterNP(item);
                }
            }, err => {
                console.error(`Encountered error SS : ${err}`);
            });
    }

    addItemToProductMasterNP(item) {
        let self = this;
        this.productListNPcol.add({
            'storeId': this.storeId,
            'productUPC': item.productUPC,
            'productName': item.productName,
            'productImg': item.productImg,
            'productSalesPrice': item.productSalesPrice,
        }).then(doc => {
            let documentId = doc.id;
            let homePdtItem = {
                shoppingModeEnabled: false,
                shoppingModeQty: 0
            }
            self.addShoppingItemToShoppingMode({ documentId, ...item, ...homePdtItem })
            // loading.dismiss();
        }).catch(err => {
            console.error(`Encountered error SS : ${err}`);
        })
    }

    addShoppingItemToShoppingMode(item) {
        var self = this;
        let isCurbSideExist = false;
        this.loaderService.show();
        var observer = this.shoppingModeListCol.ref.where('storeId', '==', this.storeId)
            .where('userId', '==', this.userUUID)
            .where('materialId', '==', item.documentId)
            .onSnapshot(querySnapshot => {
                observer();
                let count = querySnapshot.size;
                if (count > 0) {
                    querySnapshot.forEach(function(doc) {
                        self.updateItemShoppingModeFB(item, doc, true);
                    });
                    self.loaderService.hide();
                } else {
                    self.saveItemShoppingModeFB(item, true);
                }
            }, err => {
                console.error(`Encountered error SS : ${err}`);
            });
    }

    saveItemShoppingModeFB(item, loading) {
        let self = this;
        this.shoppingModeListCol.add({
            'storeId': this.storeId,
            'userId': this.userUUID,
            'addedToCart': 'N',
            'materialId': item.documentId,
            'quantity': 1,
            'pickedQuantity': 0
        }).then(doc => {
            self.addShoppingItemToMasterList(item);
            self.updateAddedBolToProductList(item, 1, 'IS');
            // loading.dismiss();
        }).catch(err => {
            console.error(`Encountered error SS : ${err}`);
        })
    }

    updateItemShoppingModeFB(item, doc, loading) {
        let self = this;
        let qty = doc.data().quantity + 1;
        this.shoppingModeListCol.doc(doc.id).set({
            'storeId': this.storeId,
            'userId': this.userUUID,
            'addedToCart': 'N',
            'materialId': doc.data().materialId,
            'quantity': qty,
            'pickedQuantity': 0
        }).then(doc => {
            self.updateAddedBolToProductList(item, qty, 'IS');
            // loading.dismiss();
        }).catch(err => {
            console.error(`Encountered error SS : ${err}`);
        })
    }

    updateAddedBolToProductList(item, qty, type) {
        this.productList.forEach(el => {
            if (type == 'CS') {
                if (el.productUPC == item.productUPC) {
                    el.curbsideEnabled = true;
                    el.curbsideQty = qty;
                }
            } else {
                if (el.productUPC == item.productUPC) {
                    el.shoppingModeEnabled = true;
                    el.shoppingModeQty = qty;
                }
            }
        })
    }

    /* check whether the item name exist in masterlist, 
      if not save the value */
    addShoppingItemToMasterList(item) {
        var self = this;
        let isExist = false;
        let isSaved;
        var masterListListener = this.masterListCol.ref.where('storeId', '==', this.storeId)
            .where('userId', '==', this.userUUID)
            .where('materialId', '==', item.documentId)
            .onSnapshot(querySnapshot => {
                masterListListener();
                let count = querySnapshot.size;
                if (count > 0) {
                    this.loaderService.hide();
                } else {
                    self.saveMasterListFB(item);
                }
            }, err => {
                console.error(`Encountered error SS : ${err}`);
            });
    }

    saveMasterListFB(item) {
        // let qty = doc.data().quantity + 1;
        this.masterListCol.add({
            'storeId': this.storeId,
            'userId': this.userUUID,
            'materialId': item.documentId
        }).then(doc => {
            this.loaderService.hide();
        }).catch(err => {
            console.error(`Encountered error SS : ${err}`);
        })
    }

    navigateToCart() {
        this.navCtrl.push('PersonalCartPage');
    }

    addLoadMoreProduct(iScroll) {
        this.infiniteScroll = iScroll;
        try {
            this.algoliaService.getProductList(this.storeId, this.searchValue, this.pageNumber).then(result => {
                let data = result.data;
                if (!(result.core && result.core != '')) {
                    data = JSON.parse(data);
                }
                if (data.length > 0) {
                    data.forEach(element => {
                        let homePdtItem = {
                            shoppingModeEnabled: false,
                            curbsideEnabled: false,
                            curbsideQty: 0,
                            shoppingModeQty: 0
                        }
                        let productItem = <HomeProductItem>{ ...element, ...homePdtItem };
                        this.productList.push(<HomeProductItem>productItem);
                        if (data.length < 10) {
                            this.isInfiniteEnable = false;
                        } else {
                            this.pageNumber = this.pageNumber + 1;
                        }
                        this.loaderService.hide();
                        this.infiniteScroll.complete();
                    });
                } else {
                    this.loaderService.hide();
                    this.isInfiniteEnable = false;
                    this.infiniteScroll.complete();
                }
            }).catch(err => {
                console.error(`Encountered error SS : ${err}`);
            })
        } catch (err) {
            this.loaderService.hide();
            console.error(`Encountered error SS : ${err}`);
            this.infiniteScroll.complete();
        }
    }

    checkUserRadious(data) {
        if (this.getDistanceFromLatLonInKm(data.location.latitude, data.location.longitude)) {
            this.isInStore = true;
        } else {
            this.isInStore = false;
        }
    }

    getDistanceFromLatLonInKm(lat2, lon2) {
        var R = 6371; // Radius of the earth in km
        var dLat = this.deg2rad(lat2 - this.latitude);  // deg2rad below
        var dLon = this.deg2rad(lon2 - this.longitude);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(this.deg2rad(this.latitude)) * Math.cos(this.deg2rad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in km
        if (d <= 1) {
            return true;
        } else {
            return false;
        }
    }
    
    deg2rad(deg) {
        return deg * (Math.PI / 180)
    }

    logForm() {
        this.searchValue = this.searchForm.controls['searchValuess'].value;
        this.content.scrollToTop(1000);
        if (this.searchValue != '') {
            if (this.partnerStore) {
                this.getProductList();
            } else {
                this.getProductListWalmartAPI();
            }
            this.searchSuccess = true;
        } else {
            this.toastService._showToast('Please Type a Value', 3000);
        }
    }

}
