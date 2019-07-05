import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { Geolocation } from '@ionic-native/geolocation';
import { Storage } from '@ionic/storage';
import { User } from 'firebase/app';
import { AuthService, WalmartService, LoaderService, ToastService } from './../../providers';
import { InStoreItem } from './../../models/instoreItem';
import { ProductItem } from './../../models/productItem';
import { ShoppingMode } from './../../models/shoppingMode';
import { CurbSideItem } from './../../models/curbsideItem';
import { ShoppingModeItem } from './../../models/ShoppingModeItem';
import { MasterItem } from '../../models/masterItem';
import { ProductItemNP } from './../../models/productItemNP';

@IonicPage()
@Component({
  selector: 'page-shopping-mode',
  templateUrl: 'shopping-mode.html'
})
export class ShoppingModePage {

  private authenticatedUser: User;
  private curbsideListener;
  private shoppingModeListener;
  private inStoreListener;
  private shoppingModeListObserver;

  private partnerStore: boolean = false;
  private cartItemExist: boolean = false;
  private isSModeActive: boolean = false;
  private isSModeListEmpty: boolean = true;
  private isInStore: boolean = false;
  private isTab: boolean = true;

  private cartCount: number = 0;
  private curbsideCount: number = 0;
  private instoreCount: number = 0;
  private latitude: number;
  private longitude: number;
  private primaryColor: string;
  private secondaryColor: string;

  private storeId: string;
  private storeName: string;
  private defaultThumbnail: string = 'assets/imgs/noimagethumbnail.jpg';

  private curbsideListCol: AngularFirestoreCollection<CurbSideItem>;
  private shoppingModeListCol: AngularFirestoreCollection<ShoppingMode>;
  private instoreListCol: AngularFirestoreCollection<InStoreItem>;
  private productListCol: AngularFirestoreCollection<ProductItem>;
  private masterListCol: AngularFirestoreCollection<MasterItem>;
  private productListNPcol: AngularFirestoreCollection<ProductItemNP>;

  private shoppingItemList: Array<ShoppingModeItem> = [];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public alertCtrl: AlertController,
    private afs: AngularFirestore,
    private barcodeScanner: BarcodeScanner,
    private geolocation: Geolocation,
    private storage: Storage,
    private authService: AuthService,
    private walmartService: WalmartService,
    private loaderService: LoaderService,
    private toastService: ToastService
  ) { }

  ionViewWillEnter() {
    this.initLoggedUser();
  }

  ionViewWillLeave() {
    this.resetFields();
    if (this.isTab) {
      this.navCtrl.popToRoot();
    }
  }

  resetFields() {
    this.shoppingItemList = [];
    this.curbsideListener();
    //this.shoppingModeListener();
    //this.inStoreListener();
    if (this.isInStore) {
      this.inStoreListener();
    }
    this.shoppingModeListObserver();
    this.cartItemExist = false;
    this.cartCount = 0;
  }

  goBack() {
    this.isTab = false;
    this.navCtrl.pop();
  }

  initLoggedUser() {
    try {
      this.storage.get('profile').then((data) => {
        if (data != null) {
          this.authenticatedUser = data;
          this.initializeStoreHome();
          this.getGeolocation();
        }
      });
    } catch (e) { }
  }

  getGeolocation() {
    this.geolocation.getCurrentPosition().then((resp) => {
      this.latitude = resp.coords.latitude;
      this.longitude = resp.coords.longitude;
    }).catch((error) => {
      console.error('Error getting location SM', error);
      this.toastService.custom('Filed to locate you! Please enable gps.');
    });
  }

  initializeStoreHome() {
    this.shoppingModeListCol = this.afs.collection<ShoppingMode>("shoppingMode");
    this.instoreListCol = this.afs.collection<InStoreItem>("instore");
    this.curbsideListCol = this.afs.collection<CurbSideItem>("curbside");
    this.productListCol = this.afs.collection<ProductItem>("productList");
    this.masterListCol = this.afs.collection<MasterItem>("masterList");
    this.productListNPcol = this.afs.collection<ProductItemNP>("productListNP");
    this.storage.get('store').then((data) => {
      if (data != null) {
        this.storeName = data.name;
        this.storeId = data.key;
        this.primaryColor = data.primaryColor;
        this.secondaryColor = data.secondaryColor;
        if (data.partner == 'Y') {
          this.partnerStore = true;
        }
        this.fetchShoppingModeList();
        this.getCountOfCartItems();
        this.checkUserRadious(data);
      } else {
        this.isTab = false;
        this.navCtrl.push('StoreListHomePage');
      }
    });
  }

  getCountOfCartItems() {
    let self = this;
    this.curbsideListener = this.curbsideListCol.ref
      .where('userId', '==', this.authenticatedUser.uid)
      .onSnapshot(querySnapshot => {
        self.curbsideCount = querySnapshot.size;
        self.addCartCount();
      }, err => {
        console.error(`Encountered error SM : ${err}`);
      });
    if (this.isInStore) {
      this.inStoreListener = this.instoreListCol.ref
        .where('userId', '==', this.authenticatedUser.uid)
        .where('storeId', '==', this.storeId)
        .onSnapshot(querySnapshot => {
          self.instoreCount = querySnapshot.size;
          self.addCartCount();
        }, err => {
          console.error(`Encountered error SM : ${err}`);
        });
    }
  }

  addCartCount() {
    this.cartCount = this.curbsideCount + this.instoreCount;
    if (this.cartCount) {
      this.cartItemExist = true;
    }
  }

  checkUserRadious(data) {
    if (this.getDistanceFromLatLonInKm(data.location.latitude, data.location.longitude)) {
      this.isInStore = true;
    } else {
      this.isInStore = false;
    }
  }

  navigateToCart() {
    this.isTab = false;
    this.navCtrl.push('PersonalCartPage');
  }

  fetchShoppingModeList() {
    var self = this;
    let isExist = false;
    // let isSaved;
    this.loaderService.show();
    this.shoppingModeListObserver = this.shoppingModeListCol.ref
      .where('storeId', '==', this.storeId)
      .where('userId', '==', this.authenticatedUser.uid)
      .onSnapshot(querySnapshot => {
        // this.shoppingItemList = [];
        if (querySnapshot.size > 0) {
          self.isSModeListEmpty = false;
          querySnapshot.forEach(function (doc) {
            let documentId = doc.id;
            if (self.shoppingItemList.length > 0) {
              if (self.shoppingItemList.filter(e => e.documentId === documentId).length == 0) {
                self.getProductDetails({ documentId, ...doc.data() });
              }
            } else {
              self.getProductDetails({ documentId, ...doc.data() });
            }
          });
          self.loaderService.hide();
        } else {
          self.toastService.custom('Shopping Mode is Empty');
          self.loaderService.hide();
          self.isSModeListEmpty = true;
        }
      }, err => {
        self.loaderService.hide();
        console.error(`Encountered error SM : ${err}`);
      });
    self.loaderService.hide();
  }

  getProductDetails(item) {
    let self = this;
    let pdtList;
    if (this.partnerStore) {
      pdtList = this.afs.collection<ProductItem>(`productList`).doc(item.materialId);
    } else {
      pdtList = this.afs.collection<ProductItem>(`productListNP`).doc(item.materialId);
    }
    // let pdtList = this.productListCol.doc(item.materialId);
    var getDoc = pdtList.ref.get()
      .then(doc => {
        if (!doc.exists) { } else {
          let productItem = { ...item, ...doc.data() };
          this.shoppingItemList.push(<ShoppingModeItem>productItem);
        }
      })
      .catch(err => {
        console.error(`Encountered error SM : ${err}`);
      });
  }

  deleteItemsFromShoppingMode(shoppingItem) {
    let self = this;
    this.shoppingModeListCol.doc(shoppingItem.documentId).delete().then(doc => {
      // this.loaderService.hide();
      self.removeItemFromArray(shoppingItem);
    }).catch(err => {
      console.error(`Encountered error SM : ${err}`);
    })
  }

  removeItemFromArray(shoppingItem) {
    this.shoppingItemList = this.shoppingItemList.filter(value => value.documentId != shoppingItem.documentId);
  }

  reduceItemQty(item) {
    if (item.pickedQuantity == 1) {
      this.toastService.custom('remove item from the list');
      this.showAlertForDeletion(item);
    } else {
      let qty;
      if (item.pickedQuantity == 0) {
        qty = item.quantity - 1;
      } else {
        qty = item.pickedQuantity - 1;
      }
      this.shoppingModeListCol.doc(item.documentId).set({
        'storeId': this.storeId,
        'userId': this.authenticatedUser.uid,
        'addedToCart': item.addedToCart,
        'materialId': item.materialId,
        'quantity': item.quantity,
        'pickedQuantity': qty
      }).then(doc => {
        item.pickedQuantity = qty;
        // this.loaderService.hide();
      }).catch(err => {
        console.error(`Encountered error SM : ${err}`);
      })
    }
  }

  addItemQty(item) {
    let qty;
    if (item.pickedQuantity == 0) {
      qty = item.quantity + 1;
    } else {
      qty = item.pickedQuantity + 1;
    }
    this.shoppingModeListCol.doc(item.documentId).set({
      'storeId': this.storeId,
      'userId': this.authenticatedUser.uid,
      'addedToCart': item.addedToCart,
      'materialId': item.materialId,
      'quantity': item.quantity,
      'pickedQuantity': qty
    }).then(doc => {
      item.pickedQuantity = qty;
      // this.loaderService.hide();
    }).catch(err => {
      console.error(`Encountered error SM : ${err}`);
    })
  }

  moveToPickedItem(item) {
    let qty, status;
    if (item.addedToCart == 'N') {
      status = 'Y';
    } else {
      status = 'N'
    }
    if (item.pickedQuantity == 0) {
      qty = item.quantity;
    } else {
      qty = item.pickedQuantity;
    }
    this.shoppingModeListCol.doc(item.documentId).set({
      'storeId': this.storeId,
      'userId': this.authenticatedUser.uid,
      'addedToCart': status,
      'materialId': item.materialId,
      'quantity': item.quantity,
      'pickedQuantity': qty
    }).then(doc => {
      item.pickedQuantity = qty;
      item.addedToCart = status;
      // this.loaderService.hide();
    }).catch(err => {
      console.error(`Encountered error SM : ${err}`);
    })
  }

  showAlertForDeletion(item) {
    const alert = this.alertCtrl.create({
      title: 'Remove Item',
      message: 'Do you want to remove the item from the shopping Mode list ?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => { }
        },
        {
          text: 'Yes',
          handler: () => {
            this.deleteItemsFromShoppingMode(item);
          }
        }
      ]
    });
    alert.present();
  }

  finishShopping() {
    // if (this.isInStore) {
    let intExt = '';
    let self = this;
    if (this.partnerStore) {
      intExt = 'I';
    } else {
      intExt = 'E';
    }
    let shoppingListSave = this.shoppingItemList.filter(snap => snap.addedToCart == 'Y');
    if (shoppingListSave.length > 0) {
      shoppingListSave.forEach(el => {
        self.addItemToInStore(el, intExt);
      })
    } else {
      this.toastService.custom('Please select atleast one item before moving to the cart');
    }
    // } 
    // else {
    //   this.toastService.custom('You are outside the store.');
    // }
  }

  addItemToInStore(item, intExt) {
    let self = this;
    this.instoreListCol.add({
      'storeId': this.storeId,
      'userId': this.authenticatedUser.uid,
      'intExt': intExt,
      'materialId': item.materialId,
      'quantity': item.pickedQuantity
    }).then(doc => {
      self.removeAllItemInShoppingMode();
      // this.loaderService.hide();
    }).catch(err => {
      console.error(`Encountered error SM : ${err}`);
    })
  }

  removeAllItemInShoppingMode() {
    this.shoppingItemList.forEach(el => {
      this.deleteItemsFromShoppingMode(el);
    })
  }

  /* call barcode plugin to scan the barcode */
  scanWalmartCode() {
    if (this.isInStore) {
      this.barcodeScanner.scan().then((barcodeData) => {
        this.ckBarcodeItemExist(barcodeData.text);
      }, (err) => {
        this.toastService.custom('Item not found, please type in the item.');
        console.error(`Encountered error SM : ${err}`);
      });
    } else {
      this.toastService.custom('You are outside the store.');
    }
  }

  /* get item detail from product List using UPC */
  ckBarcodeItemExist(itemUPC) {
    let productExistRef = this.shoppingItemList.filter(value => value.productUPC == itemUPC);
    if (productExistRef.length > 0) {
      this.moveToPickedItem(productExistRef[0]);
    } else {
      if (!this.partnerStore) {
        this.addNewItemToSMode(itemUPC);
      } else {
        this.addNewItemToSModeWalmart(itemUPC);
      }
    }
  }

  addNewItemToSMode(itemUPC) {
    let self = this;
    this.productListCol.ref.where('productUPC', '==', itemUPC)
      .where('storeId', '==', this.storeId)
      .limit(1)
      .onSnapshot(querySnapshot => {
        querySnapshot.forEach(doc => {
          doc.data();
          self.saveItemShoppingModeFB(doc.id);
        })
      }, err => {
        console.error(`Encountered error SM : ${err}`);
      });
  }

  addNewItemToSModeWalmart(itemUPC) {
    let self = this;
    let observer = this.productListNPcol.ref.where('productUPC', '==', itemUPC)
      .where('storeId', '==', this.storeId)
      .limit(1)
      .onSnapshot(querySnapshot => {
        observer();
        if (querySnapshot.size > 0) {
          querySnapshot.forEach(doc => {
            doc.data();
            self.saveItemShoppingModeFB(doc.id);
          })
        } else {
          self.getProductListWalmartByUPC(itemUPC);
        }
      }, err => {
        console.error(`Encountered error SM : ${err}`);
      });
  }

  getProductListWalmartByUPC(itemUPC) {
    let self = this;
    this.walmartService.getProductDetaisByUPC(itemUPC).subscribe(
      data => {
        // self.searchResults = [];
        data.items.forEach(element => {
          let pdtItemNp = {
            productUPC: element.upc,
            productName: element.name,
            productImg: element.thumbnailImage,
            productSalesPrice: element.salePrice
          }
          self.addItemToProductMasterNP(pdtItemNp);
        });
      }, err => {
        this.toastService.custom('Item not found, please type in the item.');
      },
      () => { }
    );
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
      self.saveItemShoppingModeFB(documentId);
    }).catch(err => {
      console.error(`Encountered error SM : ${err}`);
    })
  }

  saveItemShoppingModeFB(documentId) {
    let self = this;
    this.shoppingModeListCol.add({
      'storeId': this.storeId,
      'userId': this.authenticatedUser.uid,
      'addedToCart': 'Y',
      'materialId': documentId,
      'quantity': 1,
      'pickedQuantity': 0
    }).then(doc => {
      self.addShoppingItemToMasterList(documentId);
      // this.loaderService.hide();
    }).catch(err => {
      console.error(`Encountered error SM : ${err}`);
    })
  }

  /* check whether the item name exist in masterlist, 
     if not save the value */
  addShoppingItemToMasterList(documentId) {
    var self = this;
    let isExist = false;
    var masterListListener = this.masterListCol.ref.where('storeId', '==', this.storeId)
      .where('userId', '==', this.authenticatedUser.uid)
      .where('materialId', '==', documentId)
      .onSnapshot(querySnapshot => {
        masterListListener();
        let count = querySnapshot.size;
        if (count > 0) {
          // self.toastService.custom('Item already exists in Master List');
          // self.loaderService.hide();
        } else {
          self.saveMasterListFB(documentId);
        }
      }, err => {
        console.error(`Encountered error SM : ${err}`);
      });
  }

  saveMasterListFB(documentId) {
    this.masterListCol.add({
      'storeId': this.storeId,
      'userId': this.authenticatedUser.uid,
      'materialId': documentId
    }).catch(err => {
      console.error(`Encountered error SM : ${err}`);
    })
  }

  calculateItemAmt(item) {
    let qty = item.pickedQuantity == 0 ? item.quantity : item.pickedQuantity;
    let rate = Number(item.productSalesPrice);
    return Number((qty * rate).toFixed(2));
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

  clearShoppingMode() {
    const alert = this.alertCtrl.create({
      title: 'Clear Shopping Mode',
      message: 'Do you want to remove all items from the shopping Mode list ?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => { }
        },
        {
          text: 'Yes',
          handler: () => {
            this.removeAllItemInShoppingMode();
          }
        }
      ]
    });
    alert.present();
  }

  resetShoppingMode() {
    const alert = this.alertCtrl.create({
      title: 'Reset Shopping Mode',
      message: 'Do you want to reset all items in the shopping Mode list ?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => { }
        },
        {
          text: 'Yes',
          handler: () => {
            this.loaderService.show();
            this.shoppingItemList.forEach(el => {
              this.resetItemQuantity(el);
            })
            this.loaderService.hide();
          }
        }
      ]
    });
    alert.present();
  }

  resetItemQuantity(item) {
    let status = 'N';
    this.shoppingModeListCol.doc(item.documentId).set({
      'storeId': this.storeId,
      'userId': this.authenticatedUser.uid,
      'addedToCart': status,
      'materialId': item.materialId,
      'quantity': item.quantity,
      'pickedQuantity': item.quantity
    }).then(doc => {
      item.pickedQuantity = item.quantity;
      item.addedToCart = status;
      // this.loaderService.hide();
    }).catch(err => {
      console.error(`Encountered error SM : ${err}`);
    })
  }

}
