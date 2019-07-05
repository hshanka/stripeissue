import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { Storage } from '@ionic/storage';
import { User } from 'firebase/app';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
// import { Geofence } from '@ionic-native/geofence';
import { Geolocation } from '@ionic-native/geolocation';

import { AuthService, UserService, FirebaseSnapService, LoaderService, ToastService } from './../../providers';
import { fcmService } from "./../../providers/utils/fcm-service/fcm.service";

import { MasterItem } from './../../models/masterItem';
import { ProductItem } from './../../models/productItem';
import { HomeProductItem } from './../../models/homeProductItem';
import { ShoppingMode } from './../../models/shoppingMode';
import { CurbSideItem } from './../../models/curbsideItem';
import { InStoreItem } from './../../models/instoreItem';

@IonicPage()
@Component({
  selector: 'page-store-home',
  templateUrl: 'store-home.html'
})
export class StoreHomePage {

  private loading;
  private authenticatedUser: any;
  private authenticatedUser$: Subscription;
  private userUUID: any;
  private curbsideListener;
  private shoppingModeListener;
  private inStoreListener;

  private partnerStore: boolean = false;
  private storeCurbEnabled: boolean = false;
  private storeInStoreEnabled: boolean = false;
  private cartItemExist: boolean = false;
  private isInStore: boolean = false;

  private cartCount: number = 0;
  private curbsideCount: number = 0;
  private instoreCount: number = 0;
  private latitude: number;
  private longitude: number;

  private storeId: string;
  private primaryColor: string;
  private secondaryColor: string;
  private storeName: string;
  private storeLogo: string;
  private backgroundImage: string;
  private defaultThumbnail: string = 'assets/imgs/noimagethumbnail.jpg';

  private masterListCol: AngularFirestoreCollection<MasterItem>;
  private curbsideListCol: AngularFirestoreCollection<CurbSideItem>;
  private instoreListCol: AngularFirestoreCollection<InStoreItem>;
  private shoppingModeListCol: AngularFirestoreCollection<ShoppingMode>;

  private masterList: Observable<MasterItem[]>;
  private productList: Array<HomeProductItem> = [];
  public storeListArray: Array<any> = [];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    // private geofence: Geofence,
    private storage: Storage,
    private afs: AngularFirestore,
    public events: Events,
    private geolocation: Geolocation,
    private authService: AuthService,
    private userService: UserService,
    private firebaseSnapService: FirebaseSnapService,
    private fcmService: fcmService,
    private loaderService: LoaderService,
    private toastService: ToastService
  ) {
    events.subscribe('store:logout', (event, time) => {
      // user and time are the same arguments passed in `events.publish(user, time)`
      // this.geofence.removeAll();
      // this.navCtrl.setRoot('StoreHomePage');
    });
  }

  ionViewWillEnter() {
    this.loaderService.show();
    this.initLoggedUser();
    // this.navCtrl.setRoot('StoreHomePage').then(() =>{
    //   this.navCtrl.popToRoot();
    // })
  }

  ionViewWillLeave() {
    this.resetFields();
  }

  resetFields() {
    this.productList = [];
    if (this.storeId) {
      this.curbsideListener();
      //this.shoppingModeListener();  
    }
    if (this.isInStore) {
      this.inStoreListener();
    }

    this.cartItemExist = false;
    this.cartCount = 0;
    this.backgroundImage = '';
    // this.authenticatedUser$.unsubscribe();
  }

  initLoggedUser() {
    try {
      // this.storage.get('profile').then((data) => {
      //   if (data != null) {

      //     this.authenticatedUser = data;
      //     this.initializeStoreHome();
      //     this.getPatnerStoreList();
      //   }
      // });
      this.userService.getUUID().then(data => {
        if (data != null) {
          this.userUUID = data;
          this._initialise();
          // this.getPatnerStoreList();
        }
      })
    } catch (e) { }
  }
  
  getGeolocation() {
    this.geolocation.getCurrentPosition().then((resp) => {
      this.latitude = resp.coords.latitude;
      this.longitude = resp.coords.longitude;
    }).catch((error) => {
      console.error('Error getting location SH', error);
      this.toastService._showToast('Filed to locate you! Please enable gps.', 3000);
    });
  }

  //FIXME: need to be removed and make it dynamic
  _initialise() {
    
    this.afs.collection('stores')
    // .ref.doc('HTk8pXaT4wVXZbOmbfKE')
    .ref.doc('TenIDwt5pK98xnfSHYF6')
    .onSnapshot(snap => {
      const data = snap.data();
      const key = snap.id;
      const partner = 'Y';
      this.storage.ready().then(() => {
        this.storage.set('store', { key, partner, ...data }).then(() => {
          this.initializeStoreHome();
        });
      });
    })
  }

  initializeStoreHome() {
    this.masterListCol = this.afs.collection<MasterItem>('masterList');
    this.curbsideListCol = this.afs.collection<CurbSideItem>("curbside");
    this.instoreListCol = this.afs.collection<InStoreItem>("instore");
    this.shoppingModeListCol = this.afs.collection<ShoppingMode>("shoppingMode");
    this.storage.get('store').then((data) => {
      if (data != null) {
        this.storeName = data.name;
        this.storeId = data.key;
        this.primaryColor = data.primaryColor;
        this.secondaryColor = data.secondaryColor;
        this.storeLogo = data.logo;
        if (data.backgroundImage) {
          this.backgroundImage = data.backgroundImage;
        } else {
          this.backgroundImage = 'assets/imgs/bg.jpg'
        }
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
        this.getCountOfCartItems();
        this.checkUserRadious(data);
      } else {
        // this.navCtrl.push('StoreListHomePage');
      }
    });
  }

  getCountOfCartItems() {
    let self = this;
    this.curbsideListener = this.curbsideListCol.ref
      .where('userId', '==', this.userUUID)
      .onSnapshot(querySnapshot => {
        self.curbsideCount = querySnapshot.size;
        self.addCartCount();
      }, err => {
        console.error(`Encountered error SH : ${err}`);
      });

    if (this.isInStore) {
      this.inStoreListener = this.instoreListCol.ref
        .where('userId', '==', this.userUUID)
        .where('storeId', '==', this.storeId)
        .onSnapshot(querySnapshot => {
          self.instoreCount = querySnapshot.size;
          self.addCartCount();
        }, err => {
          console.error(`Encountered error SH : ${err}`);
        });
    }
  }

  addCartCount() {
    this.cartCount = this.curbsideCount + this.instoreCount;
    if (this.cartCount) {
      this.cartItemExist = true;
    }
  }

  getPatnerStoreList() {
    let count = 0;
    this.afs.collection('stores').valueChanges().take(1).forEach(value => {
      if (value.length > 0) {
        this.storeListArray = [];
        value.forEach(el => {
          this.pushToArray(el, count);
          count++;
        })
      } 
    })
    // initialize the plugin
    // this.geofence.initialize().then(
    //   // resolved promise does not return a value
    //   () => {

    //     this.geofence.removeAll();
    //     this.addGeofence();
    //     console.log('Geofence Plugin Ready Always');
    //   },
    //   (err) => console.log(err)
    // )
  }

  pushToArray(data, count) {
    this.storeListArray.push({
      id: this.fcmService.generateUUID(), //any unique ID
      latitude: data.location.latitude, //center of geofence radius
      longitude: data.location.longitude,
      radius: 1000, //radius to edge of geofence in meters
      transitionType: 1, //see 'Transition Types' below
      notification: { //notification settings
        id: count + 1, //any unique ID
        title: 'Start Shopping', //notification title
        text: 'You are near the -' + data.name, //notification body
        openAppOnClick: true //open app when notification is tapped
      }
    });
  }

  private addGeofence() {
    //options describing geofence
    // let fence = {
    //   id: '69ca1b88-6fbe-4e80-a4d4-ff4d3748acdb', //any unique ID
    //   latitude: 8.484778, //center of geofence radius
    //   longitude:  76.931649,
    //   radius: 100, //radius to edge of geofence in meters
    //   transitionType: 3, //see 'Transition Types' below
    //   notification: { //notification settings
    //     id: 1, //any unique ID
    //     title: 'You crossed a fence', //notification title
    //     text: 'You just arrived to Gliwice city center.', //notification body
    //     openAppOnClick: true //open app when notification is tapped
    //   }
    // }
    // this.geofence.addOrUpdate(this.storeListArray).then(
    //   () => console.log('Geofence added'),
    //   (err) => console.log('Geofence failed to add')
    // );

    // this.geofence.onNotificationClicked().subscribe((notificationData) => {
    //   console.log(notificationData);
    //   //notificationData.notification.text
    // });

  }

  fetchMasterList() {

    var self = this;
    let isExist = false;
    // let isSaved;

    // this.masterListCol = this.afs.collection<MasterItem>(`masterList`, ref => ref
    //   .where('storeId', '==', this.storeId)
    //   .where('userId', '==', this.authenticatedUser.uid)
    //   .limit(5)
    // );
    // this.masterList = this.masterListCol.valueChanges();
    // // console.log(this.masterList);
    // this.masterList.forEach(value => {

    //   value.forEach(el => {
    //     // console.log(el);
    //     self.getProductDetails(el.materialId);
    //   })
    // })
    // this.loading.dismiss();

    var masterListObserver = this.masterListCol.ref
      .where('storeId', '==', this.storeId)
      .where('userId', '==', this.userUUID)
      .limit(5)
      .onSnapshot(querySnapshot => {
        // masterListObserver();
        if (querySnapshot.size > 0) {
          querySnapshot.forEach(function (doc) {
            self.getProductDetails(doc.data().materialId);
          });
          self.loaderService.hide();
        } else {
          self.loaderService.hide();
        }
      }, err => {
        self.loaderService.hide();
        console.error(`Encountered error SH : ${err}`);
      });
  }

  getProductDetails(documentId) {
    let self = this;
    let pdtList;
    let tmpArray: Array<any> = [];
    if (this.partnerStore) {
      pdtList = this.afs.collection<ProductItem>(`productList`).doc(documentId);
    } else {
      pdtList = this.afs.collection<ProductItem>(`productListNP`).doc(documentId);
    }
    pdtList.ref.get()
      .then(doc => {
        if (!doc.exists) { } else {
          let homePdtItem = {
            shoppingModeEnabled: false,
            curbsideEnabled: false,
            curbsideQty: 0,
            shoppingModeQty: 0
          }
          let discount: number = this.getDiscountPricein(doc.data())
          let productItem = { documentId, ...doc.data(), ...homePdtItem, discount };
          tmpArray.push(<HomeProductItem>productItem);
          this.productList = this.firebaseSnapService.getFilteredArrays(tmpArray, this.productList, 'documentId');
        }
      })
      .catch(err => {
        console.error(`Encountered error SH : ${err}`);
      });
  }

  getDiscountPricein(item) {
    var discount = Number(item.productRegularPrice) - Number(item.productSalesPrice)
    return discount == 0 ? 0 : (discount) / 100
  }

  navigateStoreListPage() {
    // this.navCtrl.push('StoreListHomePage');
  }

  navigateSearchPage() {
    this.navCtrl.push('StoreSearchPage');
  }

  navigateToCart() {
    this.navCtrl.push('PersonalCartPage');
  }

  // navigateToUserProfile() {
  //   //this.navCtrl.push('UserProfilePage');
  //   this.navCtrl.push('ProfilePage');
  // }

  navigateToMasterList() {
    this.navCtrl.push('StoreMasterListPage');
  }

  addItemCurbSide(item) {
    
    if (this.storeCurbEnabled){
      this.addShoppingItemToCurbSide(item);
    }
      
  }

  addShoppingItemToCurbSide(item) {
    var self = this;
    let isCurbSideExist = false;
    let intExt = '';
    let isSaved;
    this.loaderService.show();
    // self.loading.present();
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
            self.updateItemInCurbSideFB(item, doc, self.loading);
          });
        } else {
          self.saveItemInCurbSideFB(item, intExt, self.loading);
        }
      }, err => {
        console.error(`Encountered error SH : ${err}`);
      });
  }

  saveItemInCurbSideFB(item, intExt, loading) {
    let self = this;
    this.curbsideListCol.add({
      'storeId': this.storeId,
      'userId': this.userUUID,
      'intExt': intExt,
      'materialId': item.documentId,
      'quantity': 1
    }).then(doc => {
      item.curbsideEnabled = true;
      item.curbsideQty = 1;
      self.addShoppingItemToMasterList(item);
      // loading.dismiss();
    }).catch(err => {
      console.error(`Encountered error SH : ${err}`);
    })
  }

  updateItemInCurbSideFB(item, doc, loading) {
    let qty = doc.data().quantity + 1;
    let self = this;
    this.curbsideListCol.doc(doc.id).set({
      'storeId': this.storeId,
      'userId': this.userUUID,
      'intExt': doc.data().intExt,
      'materialId': doc.data().materialId,
      'quantity': qty
    }).then(doc => {
      item.curbsideEnabled = true;
      item.curbsideQty = qty;
      self.loaderService.hide();
      // loading.dismiss();
    }).catch(err => {
      console.error(`Encountered error SH : ${err}`);
    })
  }

  addItemShoppingMode(item) {
    /* currently commented to launch for the raleigh pharmacy and need to implement later */
    // if(this.storeInStoreEnabled)
    //   this.addShoppingItemToShoppingMode(item); 
    this.toastService._showToast('Store Self Checkout Coming Soon!', 3000);
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
          querySnapshot.forEach(function (doc) {
            self.updateItemShoppingModeFB(item, doc, self.loading);
          });
          self.loading.dismiss();
        } else {
          self.saveItemShoppingModeFB(item, self.loading);
        }
      }, err => {
        console.error(`Encountered error SH : ${err}`);
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
      item.shoppingModeEnabled = true;
      item.shoppingModeQty = 1;
      self.addShoppingItemToMasterList(item);
      // loading.dismiss();
    }).catch(err => {
      console.error(`Encountered error SH : ${err}`);
    })
  }

  updateItemShoppingModeFB(item, doc, loading) {
    let qty = doc.data().quantity + 1;
    this.shoppingModeListCol.doc(doc.id).set({
      'storeId': this.storeId,
      'userId': this.userUUID,
      'addedToCart': 'N',
      'materialId': doc.data().materialId,
      'quantity': qty,
      'pickedQuantity': 0
    }).then(doc => {
      item.shoppingModeEnabled = true;
      item.shoppingModeQty = qty;
      // loading.dismiss();
    }).catch(err => {
      console.error(`Encountered error SH : ${err}`);
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
          self.loaderService.hide();
        } else {
          self.saveMasterListFB(item);
        }
      }, err => {
        console.error(`Encountered error SH : ${err}`);
      });
  }

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
      console.error(`Encountered error SH : ${err}`);
    })
  }

  //todo
  // uncomment the following line. this is commented to avoid cord

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

}
