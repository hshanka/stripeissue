import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { Storage } from '@ionic/storage';
import { Subscription } from 'rxjs/Subscription';
import { User } from 'firebase/app';
import { AuthService, UserService, LoaderService, ToastService } from './../../providers';
import { MasterItem } from './../../models/masterItem';
import { ProductItem } from './../../models/productItem';
import { HomeProductItem } from './../../models/homeProductItem';
import { CurbSideItem } from './../../models/curbsideItem';
import { ProductItemNP } from './../../models/productItemNP';
import { ShoppingMode } from './../../models/shoppingMode';
import { InStoreItem } from './../../models/instoreItem';

@IonicPage()
@Component({
  selector: 'page-store-master-list',
  templateUrl: 'store-master-list.html'
})
export class StoreMasterListPage {
  
  private partnerStore: boolean = false;
  private storeCurbEnabled: boolean = false;
  private storeInStoreEnabled: boolean = false;
  private isTab: boolean = true;
  private isInStore: boolean = false;
  private cartItemExist: boolean = false;

  private masterListObserver: any;
  private curbsideListener;
  private inStoreListener;
  private authenticatedUser: User;
  private userUUID: any;
  private masterListCol: AngularFirestoreCollection<MasterItem>;
  private productList: Array<HomeProductItem> = [];

  private curbsideListCol: AngularFirestoreCollection<CurbSideItem>;
  private productListNPcol: AngularFirestoreCollection<ProductItemNP>;
  private shoppingModeListCol: AngularFirestoreCollection<ShoppingMode>;
  private instoreListCol: AngularFirestoreCollection<InStoreItem>;

  private storeId: string;
  private primaryColor: string;
  private secondaryColor: string;
  private storeName: string;
  private storeLogo: string;
  private backgroundImage: string;
  private defaultThumbnail: string = 'assets/imgs/noimagethumbnail.jpg';

  private cartCount: number = 0;
  private curbsideCount: number = 0;
  private instoreCount: number = 0;
  private masterListCount: number = 0;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afs: AngularFirestore,
    private storage: Storage,
    private authService: AuthService,
    private userService: UserService,
    private loaderService: LoaderService,
    private toastService: ToastService
  ) { }

  ionViewWillEnter() {
    this.loaderService.show();
    this.initLoggedUser();
  }

  ionViewWillLeave() {
    this.resetFields();
    if (this.isTab) {
      this.navCtrl.popToRoot();
    }
  }

  resetFields() {
    this.curbsideListener();
    if (this.isInStore) {
      this.inStoreListener();
    }
    this.cartItemExist = false;
    this.cartCount = 0;
  }

  initLoggedUser() {
    try {
      this.userService.getUUID().then(data => {
        if (data != null) {
          this.userUUID = data;
          console.log('userServiceProvider userServiceProvider');
          console.log(this.userUUID);
          this.initializeStoreHome();
        }
      })
      // this.storage.get('profile').then((data) => {
      //   if (data != null) {
      //     this.authenticatedUser = data;
      //     this.initializeStoreHome();
      //   }
      // });
    } catch (e) { }
  }

  goBack() {
    this.isTab = false;
    this.navCtrl.pop();
  }

  initializeStoreHome() {
    this.storage.get('store').then((data) => {
      if (data != null) {
        this.storeName = data.name;
        this.storeId = data.key;
        this.primaryColor = data.primaryColor;
        this.secondaryColor = data.secondaryColor;
        this.storeLogo = data.logo;
        this.backgroundImage = data.backgroundImage;
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
        this.fetchMasterList();
      } else {
        this.isTab = false;
        this.navCtrl.push('Store Master List');
      }
    });
    this.getCountOfCartItems();
  }

  getCountOfCartItems() {
    let self = this;
    this.curbsideListCol = this.afs.collection<CurbSideItem>("curbside");
    this.instoreListCol = this.afs.collection<InStoreItem>("instore");
    this.masterListCol = this.afs.collection<MasterItem>('masterList');
    this.curbsideListener = this.curbsideListCol.ref
      .where('userId', '==', this.userUUID)
      .onSnapshot(querySnapshot => {
        self.curbsideCount = querySnapshot.size;
        self.addCartCount();
      }, err => {
        console.error(`Encountered error SML : ${err}`);
      });
    if (this.isInStore) {
      this.inStoreListener = this.instoreListCol.ref
        .where('userId', '==', this.userUUID)
        .where('storeId', '==', this.storeId)
        .onSnapshot(querySnapshot => {
          self.instoreCount = querySnapshot.size;
          self.addCartCount();
        }, err => {
          console.error(`Encountered error SML : ${err}`);
        });
    }
  }

  addCartCount() {
    this.cartCount = this.curbsideCount + this.instoreCount;
    if (this.cartCount) {
      this.cartItemExist = true;
    }
  }

  fetchMasterList() {
    var self = this;
    this.masterListObserver = this.masterListCol.ref
      .where('storeId', '==', this.storeId)
      .where('userId', '==', this.userUUID).get().then(querySnapshot => {
        if (querySnapshot.size > 0) {
          querySnapshot.forEach(function (doc) {
            self.getProductDetails(doc.data().materialId);
          });
        }
        self.loaderService.hide();
      }).catch(err => {
        self.loaderService.hide();
        console.error(`Encountered error SML : ${err}`);
      })
    // .onSnapshot(querySnapshot => {
    //   console.log(querySnapshot.size);
    //   if (querySnapshot.size > 0) {
    //     querySnapshot.forEach(function (doc) {
    //       console.log(doc.data());
    //       console.log('x2');
    //       self.getProductDetails(doc.data().materialId);
    //     });
    //   }
    //   // masterListObserver();
    //   self.loaderService.hide();
    // }, err => {
    //   self.loaderService.hide();
    //   console.error(`Encountered error SML : ${err}`);
    // });
    // this.masterListObserver = this.afs.collection('masterList').valueChanges().subscribe(el => {
    //   self.masterListCount = 0;
    //   if (el.length > 0) {
    //     el.forEach(function (doc) {
    //       self.getProductDetails(doc['materialId'], el.length);
    //     });
    //   }
    // });
  }
  
  getProductDetails(documentId) {
    let self = this;
    let pdtList;
    // pdtList = this.afs.collection<ProductItem>(`productList`).doc(documentId);
    if (this.partnerStore) {
      pdtList = this.afs.collection<ProductItem>(`productList`).doc(documentId);
    } else {
      pdtList = this.afs.collection<ProductItem>(`productListNP`).doc(documentId);
    }
    var getDoc = pdtList.ref.get()
      .then(doc => {
        self.masterListCount++;
        if (doc.exists) {
          let homePdtItem = {
            shoppingModeEnabled: false,
            curbsideEnabled: false,
            curbsideQty: 0,
            shoppingModeQty: 0
          }
          let productItem = { documentId, ...doc.data(), ...homePdtItem };
          this.productList.push(<HomeProductItem>productItem);
          // if (self.masterListCount == totLength) {
          //   console.log(self.masterListCount);
          //   console.log(totLength);
          self.loaderService.hide();
          // }
        }
      })
      .catch(err => {
        self.masterListCount++;
        console.error(`Encountered error SML : ${err}`);
        self.loaderService.hide();
      });
  }

  addItemCurbSide(item) {
    if (this.storeCurbEnabled)
      this.addShoppingItemToCurbSide(item);
  }

  addShoppingItemToCurbSide(item) {
    var self = this;
    let isCurbSideExist = false;
    let intExt = '';
    let isSaved;
    this.loaderService.show();
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
          querySnapshot.forEach(function (doc) {
            self.updateItemInCurbSideFB(item, doc);
          });
        } else {
          self.saveItemInCurbSideFB(item, intExt);
        }
      }, err => {
        console.error(`Encountered error SML : ${err}`);
      });
  }

  saveItemInCurbSideFB(item, intExt) {
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
      console.error(`Encountered error SML : ${err}`);
    })
  }

  updateItemInCurbSideFB(item, doc) {
    let qty = doc.data().quantity + 1;
    let self = this;
    this.curbsideListCol.doc(doc.id).set({
      'storeId': this.storeId,
      'userId': this.userUUID,
      'intExt': doc.data().intExt,
      'materialId': doc.data().materialId,
      'quantity': qty
    }).then(doc => {
      self.updateAddedBolToProductList(item, qty, 'CS');
      self.loaderService.hide();
    }).catch(err => {
      console.error(`Encountered error SML : ${err}`);
    })
  }
  //
  saveMasterListFB(item) {
    // let qty = doc.data().quantity + 1;
    let self = this;
    this.masterListCol.add({
      'storeId': this.storeId,
      'userId': this.userUUID,
      'materialId': item.documentId
    }).then(doc => {
      self.loaderService.hide();
    }).catch(err => {
      console.error(`Encountered error SML : ${err}`);
    })
  }
  
  addItemShoppingMode(item) {
    /* currently commented to launch for the raleigh pharmacy and need to implement later */
    // if(this.storeInStoreEnabled)
    //   this.addShoppingItemToShoppingMode(item);
    this.toastService._showToast('Store Self Checkout Coming Soon!', 3000);
  }

  //not used
  ckItemExistProductListNP(item) {//TODO: check whether the item exist or not and add or fetch the id
    this.productListNPcol = this.afs.collection<ProductItem>('productListNP');
    let self = this;
    var productSearchListener = this.productListNPcol.ref
      .where('productUPC', '==', item.productUPC)
      .where('storeId', '==', this.storeId)
      .limit(1)
      .onSnapshot(querySnapshot => {
        productSearchListener();
        if (querySnapshot.size > 0) {
          querySnapshot.forEach(function (doc) {
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
        console.error(`Encountered error SML : ${err}`);
      });
  }

  //not used
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
      self.addShoppingItemToShoppingMode({ documentId, ...item, ...homePdtItem });
    }).catch(err => {
      console.error(`Encountered error SML : ${err}`);
    })
  }

  addShoppingItemToShoppingMode(item) {
    this.shoppingModeListCol = this.afs.collection<ShoppingMode>("shoppingMode");
    var self = this;
    let isCurbSideExist = false;
    var observer = this.shoppingModeListCol.ref.where('storeId', '==', this.storeId)
      .where('userId', '==', this.userUUID)
      .where('materialId', '==', item.documentId)
      .onSnapshot(querySnapshot => {
        observer();
        let count = querySnapshot.size;
        if (count > 0) {
          querySnapshot.forEach(function (doc) {
            self.updateItemShoppingModeFB(item, doc);
          });
        } else {
          self.saveItemShoppingModeFB(item);
        }
      }, err => {
        console.error(`Encountered error SML : ${err}`);
      });
  }

  saveItemShoppingModeFB(item) {
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
    }).catch(err => {
      console.error(`Encountered error SML : ${err}`);
    })
  }

  updateItemShoppingModeFB(item, doc) {
    let qty = doc.data().quantity + 1;
    let self = this;
    this.shoppingModeListCol.doc(doc.id).set({
      'storeId': this.storeId,
      'userId': this.userUUID,
      'addedToCart': 'N',
      'materialId': doc.data().materialId,
      'quantity': qty,
      'pickedQuantity': 0
    }).then(doc => {
      self.updateAddedBolToProductList(item, qty, 'IS');
    }).catch(err => {
      console.error(`Encountered error SML : ${err}`);
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
          self.loaderService.hide();
        } else {
          self.saveMasterListFB(item);
        }
      }, err => {
        console.error(`Encountered error SML : ${err}`);
        self.loaderService.hide();
      });
  }

  navigateToCart() {
    this.isTab = false;
    this.navCtrl.push('PersonalCartPage');
  }
  
}
