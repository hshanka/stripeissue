import { Component } from '@angular/core';
import { IonicPage, Platform, NavController, ModalController, AlertController, ActionSheetController } from 'ionic-angular';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { Geolocation } from '@ionic-native/geolocation';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { Storage } from '@ionic/storage';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { User } from 'firebase/app';
import { AuthService, UserService, BestRxService, FirebaseSnapService, LoaderService, ToastService } from './../../providers';
import { InStoreItem } from './../../models/instoreItem';
import { ProductItem } from './../../models/productItem';
import { CurbSideItem } from './../../models/curbsideItem';

@IonicPage()
@Component({
  selector: 'page-personal-cart',
  templateUrl: 'personal-cart.html'
})
export class PersonalCartPage {

  private authenticatedUser: User;
  private authenticatedUser$: Subscription;
  private userUUID: any;
  private curbSideListener;
  private instoreListener;
  private attachment = "";

  private partnerStore: boolean = false;
  private isInstore: boolean = false;
  private isCurbside: boolean = true;
  private isCheckout: boolean = false;
  private isInStore: boolean = false;
  private isTab: boolean = true;
  private isLoggedIn: boolean = false;

  private curbsideCount: number = 0;
  private instoreCount: number = 0;
  private latitude: number;
  private longitude: number;

  private storeId: string;
  private primaryColor: string;
  private secondaryColor: string;
  private storeName: string;
  private defaultThumbnail: string = 'assets/imgs/noimagethumbnail.jpg';
  private pageTitle: string = 'Curbside Shopping Cart';

  private curbsideListCol: AngularFirestoreCollection<CurbSideItem>;
  private instoreListCol: AngularFirestoreCollection<InStoreItem>;
  private productListCol: AngularFirestoreCollection<ProductItem>;
  private curbSideItemList: Array<any> = [];
  private curbSideItemStoreList: Array<any> = [];
  private instoreItemList: Array<any> = [];
  private instoreItemStoreList: Array<any> = [];
  private curbsideMainArr: Array<any> = [];

  constructor(
    public navCtrl: NavController,
    private platform: Platform,
    public alertCtrl: AlertController,
    public modalCtrl: ModalController,
    public actionSheetCtrl: ActionSheetController,
    private afs: AngularFirestore,
    private geolocation: Geolocation,
    private camera: Camera,
    private storage: Storage,
    private authService: AuthService,
    private userService: UserService,
    private bestRxService: BestRxService,
    private firebaseSnapService: FirebaseSnapService,
    private loaderService: LoaderService,
    private toastService: ToastService, 
  ) { }

  ionViewWillEnter() {
    this.initLoggedUser();
    this.curbSideItemStoreList = [];
    //FIXME: commented out for the RP release
    // this.instoreItemStoreList; = [];
    this.loaderService.hide();
  }

  ionViewWillLeave() {
    this.resetFields();
    if (this.isTab) {
      this.navCtrl.popToRoot();
    }
  }

  resetFields() {
    this.curbSideListener();
    // this.authenticatedUser$.unsubscribe();
  }

  goBack() {
    this.isLoggedIn = false;
    this.isTab = false;
    this.navCtrl.pop();
  }

  initLoggedUser() {
    try {
      this.storage.get('profile').then((data) => {
        if (data != null) {
          this.authenticatedUser = data;
          this.isLoggedIn = true;
        }
      });
      this.userService.getUUID().then(data => {
        if (data != null) {
          this.userUUID = data;
          this.initializePersonalCart();
          this.getGeolocation();
        }
      })
    } catch (e) { }
  }

  getGeolocation() {
    this.geolocation.getCurrentPosition().then((resp) => {
      this.latitude = resp.coords.latitude;
      this.longitude = resp.coords.longitude;
    }).catch((error) => {
      this.showToast('Filed to locate you! Please enable gps.', 3000);
    });
  }

  initializePersonalCart() {
    this.instoreListCol = this.afs.collection<InStoreItem>("instore");
    this.curbsideListCol = this.afs.collection<CurbSideItem>("curbside");
    this.productListCol = this.afs.collection<ProductItem>("productList");
    this.storage.get('store').then((data) => {
      if (data != null) {
        this.storeName = data.name;
        this.storeId = data.key;
        this.primaryColor = data.primaryColor;
        this.secondaryColor = data.secondaryColor;
        if (data.partner == 'Y') {
          this.partnerStore = true;
        }
        this.fetchCurbSideList();
        //FIXME: commented out for the RP release
        // this.fetchInStoreList();
        // this.checkUserRadious(data);
      } else {
        this.isTab = false;
        this.navCtrl.push('StoreListHomePage');
      }
    });
  }

  fetchCurbSideList() {
    var self = this;
    let curbsideTmpArr: Array<any> = [];
    this.curbsideMainArr = [];
    this.curbSideListener = this.afs.collection<CurbSideItem>("curbside").ref
      .where('userId', '==', this.userUUID)
      .onSnapshot(querySnapshot => {
        // self.curbSideListener();
        self.curbSideItemList = [];
        // this.shoppingItemList = [];
        if (querySnapshot.size > 0) {
          let curbsideCount = querySnapshot.size;
          querySnapshot.forEach(function (doc) {
            let documentId = doc.id;
            let item = { documentId, ...doc.data() };
            curbsideTmpArr.push(item);
            // self.addItemsToTheList('CS', curbsideCount, item, self.curbSideItemList);
          });
          self.curbsideMainArr = self.firebaseSnapService.getFilteredArrays(curbsideTmpArr, self.curbsideMainArr, 'documentId');
          self._addItemsToTheList('CS', curbsideCount, self.curbsideMainArr, self.curbSideItemList);
        } else {
          self.loaderService.hide();
        }
      }, err => {
        console.error(`Encountered error PK: ${err}`);
        self.loaderService.hide();
      });
  }

  checkUserRadious(data) {
    if (this.getDistanceFromLatLonInKm(data.location.latitude, data.location.longitude)) {
      this.isInStore = true;
    } else {
      this.isInStore = false;
    }
  }

  fetchInStoreList() {
    var self = this;
    this.instoreListener = this.instoreListCol.ref
      .where('userId', '==', this.userUUID)
      .where('storeId', '==', this.storeId)
      .onSnapshot(querySnapshot => {
        self.instoreListener();
        self.instoreItemList = [];
        // this.shoppingItemList = [];
        if (querySnapshot.size > 0) {
          let instoreCount = querySnapshot.size;
          querySnapshot.forEach(function (doc) {
            let documentId = doc.id;
            let item = { documentId, ...doc.data() };
            self.addItemsToTheList('IS', instoreCount, item, self.instoreItemList);
          });
        } 
      }, err => {
        console.error(`Encountered error PK : ${err}`);
      });
  }

  _addItemsToTheList(type, count, loopArr, listRef) {
    loopArr.forEach(item => {
      this.addItemsToTheList('CS', count, item, listRef);
    });
  }

  async addItemsToTheList(type, count, item, listRef) {
    let storeDetails = await this.getStoreDetails(item);
    let productDetails = await this.getProductDetails(item);
    let ccc = {
      'store': storeDetails,
      'productList': productDetails
    }
    listRef.push(ccc);
    if (count == listRef.length) {
      this.groupTheLIstByStore(type, listRef);
    }
  }

  async getStoreDetails(item) {
    let storeDt;
    await this.afs.collection<InStoreItem>("stores").doc(item.storeId).ref.get()
      .then(doc => {
        if (!doc.exists) { } else {
          storeDt = {
            'storeId': item.storeId,
            'storeName': doc.data().name,
            'logo': doc.data().logo,
            'storeCustomNote': '',
            'storeSelected': false,
            'storeTotalAmount': 0,
            'intExt': item.intExt,
            'primaryColor': doc.data().primaryColor,
            'secondaryColor': doc.data().secondaryColor,
            'storeCode': doc.data().storeCode,
            'onlinePayment': doc.data().onlinePayment,
            'counterPayment': doc.data().counterPayment
          }
        }
      })
      .catch(err => {
        console.error(`Encountered error PK : ${err}`);
      });
    return storeDt;
  }

  async getProductDetails(item) {
    let productDt;
    await this.afs.collection<InStoreItem>("productList").doc(item.materialId).ref.get()
      .then(doc => {
        if (!doc.exists) { } else {
          productDt = {
            'cartDocId': item.documentId,
            'intExt': item.intExt,
            'storeId': item.storeId,
            'materialId': item.materialId,
            'productImg': doc.data().productImg,
            'productName': doc.data().productName,
            'productSalesPrice': doc.data().productSalesPrice,
            'productUPC': doc.data().productUPC,
            'productQty': item.quantity,
            'productAmount': (Number(item.quantity) * Number(doc.data().productSalesPrice)).toFixed(2),
            'productCustomNote': ''
          }
        }
      })
      .catch(err => {
        console.error(`Encountered error PK : ${err}`);
      });
    return productDt;
  }

  groupTheLIstByStore(type, listRef) {
    let storeListRef;
    if (type == 'CS') {
      storeListRef = this.curbSideItemStoreList;
    } else {
      storeListRef = this.instoreItemStoreList;
    }
    listRef.forEach(item => {
      if (this.ckIfStoreExist(item, storeListRef)) {
        this.addItemToExistingStoreList(item, storeListRef);
      } else {
        this.addNewStoreToTheList(item, storeListRef);
      }
    })
    this.isCheckout = true;
    this.checkItemCountExist(storeListRef);
  }

 
   checkItemCountExist(storeListRef) {
     var responseJSON = [];
    storeListRef.forEach(element => {
      let upcArray: Array<any> = [];
      element['productList'].forEach(el => {
        upcArray.push(el['productUPC'])
      });
     this._checkItemCountExist(storeListRef, responseJSON, element);
    });
  }

    //todo
    //uncomment the below code
    //user: faizal

  // checkItemCountExist(storeListRef) {
  //   storeListRef.forEach(element => {
  //     let upcArray: Array<any> = [];
  //     element['productList'].forEach(el => {
  //       upcArray.push(el['productUPC'])
  //     });
  //     this.bestRxService.checkProductCount(upcArray).then((response) => {
  //       if (!response['core']) {
  //         let responseJSON = JSON.parse(response['data']);
  //         this._checkItemCountExist(storeListRef, responseJSON['Data'], element);
  //       } else {
  //         this.loaderService.hide();
  //       }
  //     }).catch((err) => {
  //       this.loaderService.hide();
  //       console.error(`Encountered error SS : ${err}`);
  //     });
  //   });
  // }

  
  _checkItemCountExist(storeListRef, reponseData, element) {
    element['productList'].forEach(el => {
          el['QtyOnHand'] = 100;
    });
    this.loaderService.hide();
  }

  //todo
  // uncomment the below line of code
  // user: faizal

  
  // _checkItemCountExist(storeListRef, reponseData, element) {
  //   element['productList'].forEach(el => {
  //     reponseData.forEach(resEl => {
  //       if (el['productUPC'] == resEl['SKU']) {
  //         el['QtyOnHand'] = resEl['QtyOnHand'];
  //       }
  //     });
  //   });
  //   this.loaderService.hide();
  // }

  ckIfStoreExist(item, storeListRef) {
    let isExist = false;
    storeListRef.forEach(element => {
      if (element.store.storeId == item.store.storeId) {
        isExist = true;
      }
    });
    return isExist;
  }

  addNewStoreToTheList(item, storeListRef) {
    item.store.storeTotalAmount = Number(item.store.storeTotalAmount) + Number(item.productList.productAmount);
    let tmpArr = {
      'store': item.store,
      'productList': [item.productList]
    }
    storeListRef.push(tmpArr);
  }

  addItemToExistingStoreList(item, storeListRef) {
    storeListRef.forEach(el => {
      if (el.store.storeId == item.store.storeId) {
        if (!(this._ckProductAlreadyExist(el.productList, item.productList, 'cartDocId'))) {
          el.productList.push(item.productList);
        }
      }
    })
    this._calculateCartAmount(storeListRef);
  }

  _ckProductAlreadyExist(array, item, Keyword) {
    let isExist: boolean = false;
    array.forEach(element => {
      if (element[Keyword] == item[Keyword]) {
        isExist = true;
        element = item;
      }
    });
    return isExist;
  }

  _calculateCartAmount(listRef) {
    listRef.forEach(el => {
      let amt: number = 0;

      el.productList.forEach(element => {
        amt = amt + Number(Number(element.productAmount).toFixed(2));
      });
      el.store.storeTotalAmount = Number(amt).toFixed(2);
    });
  }

  showInstoreCart() {
    // if (this.isInStore) {
    this.isInstore = true;
    this.isCurbside = false;
    this.pageTitle = 'In-Store';
    // } else {
    //   this.showToast('You are outside the store.', 3000);
    // }
  }

  showCurbSideCart() {
    this.isInstore = false;;
    this.isCurbside = true;
    this.pageTitle = 'Curbside Shopping Cart';
  }

  reduceItemQty(type, item) {
    let listRef;
    let self = this;
    if (type == 'CS') {
      listRef = this.curbsideListCol;
    } else {
      listRef = this.instoreListCol;
    }
    if (item.productQty == 1) {
      // this.showToast('remove item from the list', 3000);
      // this.showAlertForDeletion(item);
      this.deleteItemsFromCurbsideList(type, item);
    } else {
      let qty = item.productQty - 1;
      listRef.doc(item.cartDocId).set({
        'intExt': item.intExt,
        'materialId': item.materialId,
        'quantity': qty,
        'storeId': item.storeId,
        'userId': this.userUUID
      }).then(doc => {
        item.productQty = qty;
        item.productAmount = (Number(qty) * Number(item.productSalesPrice)).toFixed(2);
        self.verifyStoreAmt();
        // this.loaderService.hide();
      }).catch(err => {
        console.error(`Encountered error PK : ${err}`);
      })
    }
  }

  addItemQty(type, item) {
    let listRef;
    let qty = item.productQty + 1;
    if (qty > item.QtyOnHand) {
      this.toastService._showToast('Sorry, the quantity exceeds available stock', 3000);
    } else {
      let self = this;
      if (type == 'CS') {
        listRef = this.curbsideListCol;
      } else {
        listRef = this.instoreListCol;
      }
      listRef.doc(item.cartDocId).set({
        'intExt': item.intExt,
        'materialId': item.materialId,
        'quantity': qty,
        'storeId': item.storeId,
        'userId': this.userUUID
      }).then(doc => {
        item.productQty = qty;
        item.productAmount = (Number(qty) * Number(item.productSalesPrice)).toFixed(2);
        self.verifyStoreAmt();
        // this.loaderService.hide();
      }).catch(err => {
        console.error(`Encountered error PK : ${err}`);
      })
    }
  }

  deleteItemsFromCurbsideList(type, item) {
    let self = this;
    let listRef;
    if (type == 'CS') {
      listRef = this.curbsideListCol;
    } else {
      listRef = this.instoreListCol;
    }
    listRef.doc(item.cartDocId).delete().then(doc => {
      // this.loaderService.hide();
      self.removeItemFromArray(type, item);
    }).catch(err => {
      console.error(`Encountered error PK : ${err}`);
    })
  }

  removeItemFromArray(type, item) {
    let storeListRef;
    if (type == 'CS') {
      storeListRef = this.curbSideItemStoreList;
    } else {
      storeListRef = this.instoreItemStoreList;
    }
    storeListRef.forEach(ele => {
      if (ele.store.storeId == item.storeId) {
        if (ele.productList.length > 1) {
          ele.productList = ele.productList.filter(elItem => elItem.cartDocId != item.cartDocId)
          this.verifyStoreAmt();
        } else {
          this._removeItemFromArray(type, item);
        }
      }
    })
  }

  _removeItemFromArray(type, item) {
    if (type == 'CS') {
      this.curbSideItemStoreList = this.curbSideItemStoreList.filter(ele => ele.store.storeId != item.storeId)
    } else {
      this.instoreItemStoreList = this.instoreItemStoreList.filter(ele => ele.store.storeId != item.storeId)
    }
  }

  verifyStoreAmt() {
    const calcAmt = arr => {
      arr.forEach(element => {
        element.forEach(el => {
          let strAmt = 0;
          el.productList.forEach(item => {
            strAmt = Number(strAmt) + Number(item.productAmount);
          });
          el.store.storeTotalAmount = (strAmt).toFixed(2);
        });
      });
    }
    calcAmt([this.curbSideItemStoreList, this.instoreItemStoreList]);
  }

  openItemCustomNotes(type, item) {
    let message;
    if (type == 'S') {
      message = item.store.storeCustomNote;
    } else {
      message = item.productCustomNote;
    }
    let customNotes = this.modalCtrl.create("CustomNotesPage", { customNote: message, isEditable: "Y" });
    customNotes.onDidDismiss(data => {
      if (data != undefined) {
        if (type == 'S') {
          item.store.storeCustomNote = data;
        } else {
          item.productCustomNote = data;
        }
      }
    });
    customNotes.present();
  }

  selectStoreForCheckout(type, item) {
    item.storeSelected = !item.storeSelected;
    let storeListRef;
    if (type == 'CS') {
      storeListRef = this.curbSideItemStoreList;
    } else {
      storeListRef = this.instoreItemStoreList;
    }
    storeListRef = storeListRef.map(element => {
      if (element.store.storeId == item.store.storeId) {
        element.store.storeSelected = !element.store.storeSelected;
        return element;
      } else {
        return element;
      }
    });
    if (item.storeSelected) {
      this.showToast('Items are ready for checkout', 3000);
    } else {
      this.showToast('Items are removed from checkout', 3000);
    }
  }

  //todo
  // remove the comment in if condition and the if condition below the comment

  cartCheckout(type) {
    // if (!(this.platform.is('core') || this.platform.is('mobileweb'))) {
      if (true) {
        if (this.isLoggedIn) {
        let storeListRef;
        let destinationPage;
        if (type == 'CS') {
          storeListRef = this.curbSideItemStoreList;
          destinationPage = 'OrderConfirmationPage';
        } else {
          storeListRef = this.instoreItemStoreList;
          destinationPage = 'PaymentConfirmationPage';
        }
        let storeSelectedList = storeListRef.filter(el => el.storeSelected);
        if (storeSelectedList.length > 0) {
          if (this.checkIfItemsAreInStock(storeSelectedList)) {
            this.isTab = false;
            this.navCtrl.push(destinationPage, {
              'storeSelectedList': storeSelectedList,
              'type': type,
              'attachment': this.attachment
            });
          } else {
            this.showToast('One or more items are out of stock', 3000);
          }
        } else {
          this.showToast('Please select atleast one store for checkout', 3000);
        }
      } else {
        this.toastService._okAlertCtrl('Login/Register', 'Please Login/Register to Checkout', () => {
          this.navCtrl.parent.select(3);
        })
      }
    }
  }

  checkIfItemsAreInStock(list) {
    let isStock: boolean = true;
    list.forEach(element => {
      element['productList'].forEach(el => {
        if (el['QtyOnHand'] < el['productQty']) {
          isStock = false;
        }
      });
    });
    return isStock;
  }

  /* show toast message dynamically */
  showToast(message, time) {
    this.toastService.custom(message);
  }

  getDistanceFromLatLonInKm(lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = this.deg2rad(lat2 - this.latitude);  // deg2rad below
    var dLon = this.deg2rad(lon2 - this.longitude);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(this.latitude)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
      ;
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

  attachPrescription(type, item) {
    if (type == 'CS') {
      let actionSheet = this.actionSheetCtrl.create({
        title: 'Select your action',
        buttons: [{
          text: 'Capture',
          handler: () => {
            this.captureImage();
          }
        }, {
          text: 'Select',
          handler: () => {
            this.openFile();
          }
        }, {
          text: 'View',
          handler: () => {
            this.viewAttachment();
          }
        }, {
          text: 'Cancel',
          role: 'cancel',
          handler: () => { }
        }]
      });
      actionSheet.present();
    } else {
      this.showToast('Attachment option not available', 3000);
    }
  }

  captureImage() {
    const options: CameraOptions = {
      quality: 35,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE
    }
    this.camera.getPicture(options).then((imageData) => {
      // imageData is either a base64 encoded string or a file URI
      // If it's base64:
      let base64Image = 'data:image/jpeg;base64,' + imageData;
      this.attachment = base64Image;
    }, (err) => {
      // Handle error
    });
  }

  openFile() {
    const options: CameraOptions = {
      quality: 35,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      sourceType: this.camera.PictureSourceType.SAVEDPHOTOALBUM
    }
    this.camera.getPicture(options).then((imageData) => {
      // imageData is either a base64 encoded string or a file URI
      // If it's base64:
      let base64Image = 'data:image/jpeg;base64,' + imageData;
      this.attachment = base64Image;
    }, (err) => {
      // Handle error
    });
  }

  viewAttachment() {
    if (this.attachment == "") {
      this.showToast('No attachment selected', 3000);
    } else {
      let attachFile = this.modalCtrl.create("AttachmentViewPage", { attachment: this.attachment });
      attachFile.onDidDismiss(data => {
      });
      attachFile.present();
    }
  }

}
