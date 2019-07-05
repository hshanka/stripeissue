import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController, AlertController, ActionSheetController } from 'ionic-angular';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { Storage } from '@ionic/storage';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { User } from 'firebase/app';
import { AuthService, LoaderService, ToastService } from './../../providers';
import { orderListItem } from './../../models/orderListItem';

@IonicPage()
@Component({
  selector: 'page-store-orders',
  templateUrl: 'store-orders.html'
})
export class StoreOrdersPage {

  private status: any;
  private authenticatedUser: User;
  private authenticatedUser$: Subscription;
  private orderListListener;

  private partnerStore: boolean = false;
  private isLoggedIn: boolean = false;

  private storeId: string;
  private primaryColor: string;
  private storeName: string;

  private instoreCount: number;
  private orderListCol: AngularFirestoreCollection<orderListItem>;

  private orderListArray: Array<any> = [];
  private orderListFilterArray: Array<any> = [];

  constructor(
    public navCtrl: NavController,
    private modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public actionSheetCtrl: ActionSheetController,
    private afs: AngularFirestore,
    private storage: Storage,
    private authService: AuthService,
    private loaderService: LoaderService,
    private toastService: ToastService
  ) { }

  ionViewWillEnter() {
    this.loaderService.show();
    this.initLoggedUser();

  }

  ionViewWillLeave() {
    this.resetFields();
  }

  resetFields() {
    // this.authenticatedUser$.unsubscribe();
    this.orderListArray = [];
    this.orderListFilterArray = [];
    if (this.isLoggedIn) {
      this.orderListListener();
    }
  }

  initLoggedUser() {
    try {
      this.storage.get('profile').then((data) => {
        if (data != null) {
          this.authenticatedUser = data;
          this.initializeStoreHome();
          this.isLoggedIn = true;
        } else {
          this.loaderService.hide();
        }
      });
    } catch (e) { }
  }

  initializeStoreHome() {
    this.orderListCol = this.afs.collection<orderListItem>("orders");
    this.storage.get('store').then((data) => {
      if (data != null) {
        this.storeId = data.key;
        this.storeName = data.name;
        this.primaryColor = data.primaryColor;
        if (data.partner == 'Y') {
          this.partnerStore = true;
        }
        this.fetchOrderrList();
      }
    });
  }

  fetchOrderrList() {
    var self = this;
    this.orderListListener = this.afs.collection<orderListItem>("orders").ref
    .where('userId', '==', this.authenticatedUser.uid).orderBy('createdDateTime', "desc")
    .onSnapshot(querySnapshot => {
      // self.orderListListener();
      // this.shoppingItemList = [];
      if (querySnapshot.size > 0) {
        self.instoreCount = querySnapshot.size;
        querySnapshot.forEach(function (doc) {
          let documentId = doc.id;
          let item = { documentId, ...doc.data() };
          self.ckItemExistInList(item);
        });
      } else {
        self.loaderService.hide();
      }
    }, err => {
      console.error(`Encountered error SO : ${err}`);
      self.loaderService.hide();
    });
  }

  async ckItemExistInList(item) {
    let isExist = false;
    await this.orderListArray.forEach(el => {
      if (el.orderList.orderId == item.orderId && el.orderList.storeId == item.storeId) {
        isExist = true;
      }
    })
    if (!isExist) {
      this.addItemsToTheList(item, this.orderListArray);
    } else {
      this.updateItemInList(item);
      this.loaderService.hide();
    }
  }

  updateItemInList(item) {
    this.orderListArray.forEach(el => {
      if (el.orderList.orderId == item.orderId && el.orderList.storeId == item.storeId) {
        el.orderList.status = item.status;
        el.orderList.amount = item.amount;
        el.orderList.numberOfItems = item.numberOfItems;
      }
    })
  }

  async addItemsToTheList(item, listRef) {
    let storeDetails = await this.getStoreDetails(item);
    let productDetails = item;
    let ccc = {
      'store': storeDetails,
      'orderList': productDetails
    };
    listRef.push(ccc);
    if (this.instoreCount == listRef.length) {
      listRef.sort((a, b) => Number(b.orderList.createdDateTime) - Number(a.orderList.createdDateTime));
      this.loaderService.hide();
      // this.groupTheLIstByStore(listRef);//is removed for now as there is no more grouping of stores
    }
  }

  async getStoreDetails(item) {
    let storeDt;
    await this.afs.collection("stores").doc(item.storeId).ref.get()
      .then(doc => {
        if (!doc.exists) { } else {
          storeDt = {
            'storeId': item.storeId,
            'storeName': doc.data().name,
            'logo': doc.data().logo,
            'storeCustomNote': item.customNotes,
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
        console.error(`Encountered error SO : ${err}`);
      });
    return storeDt;
  }

  groupTheLIstByStore(listRef) {
    let storeListRef;
    storeListRef = this.orderListFilterArray;
    listRef.forEach(item => {
      if (this.ckIfStoreExist(item, storeListRef)) {
        this.addItemToExistingStoreList(item, storeListRef);
      } else {
        this.addNewStoreToTheList(item, storeListRef);
      }
    })
  }

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
    let tmpArr = {
      'store': item.store,
      'orderList': [item.orderList]
    }
    storeListRef.push(tmpArr);
  }

  addItemToExistingStoreList(item, storeListRef) {
    storeListRef.forEach(el => {
      if (el.store.storeId == item.store.storeId) {
        el.orderList.push(item.orderList);
      }
    })
  }

  getStatus(status) {
    if (status == 0) {
      return "Pending";
    } else if (status == 1) {
      return "In Progress";
    } else if (status == 2) {
      //FIXME: changed out for the RP release
      // return "Confirmation Pending";
      return "Ready for PickUp";
    } else if (status == 3) {
      return "Confirmed, Not Paid";
    } else if (status == 4) {
      return "Receipt, Pending Verification";
    } else if (status == 5) {
      return "Receipt, On-Arrival";
    } else if (status == 6) {
      return "Confirmed, On-Arrival";
    } else if (status == 7) {
      return "Cancelled";
    }
    return "-"
  }

  orderItem(item, storeItem) {
    this.navCtrl.push("StoreOrderDetailPage", {
      orderId: item.orderId, storeId: item.storeId, item: item, storeItem: storeItem
    })
  }

  doPayment() {
  }

  notifyStore(orderListItem) {
    const alert = this.alertCtrl.create({
      title: 'Notify',
      message: 'Do you want to Notify the Store?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => { }
        },
        {
          text: 'Yes',
          handler: () => {
            this.updateOrderStatus(orderListItem);
          }
        }
      ]
    });
    alert.present();
  }

  updateOrderStatus(orderListItem) {
    this.orderListCol.doc(orderListItem.documentId).update({
      "status": orderListItem.status == 3 ? 6 : 5,
    }).catch(err => {
      console.error(`Encountered error SO : ${err}`);
    })
  }

  openItemCustomNotes(item) {
    this.modalCtrl.create("CustomNotesPage", { customNote: item.store.storeCustomNote, isEditable: "N" }).present();
  }

  attachPrescription(item) {
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Select your action',
      buttons: [
        {
          text: 'View',
          handler: () => {
            this.viewAttachment(item.orderList.attachment);
          }
        }, {
          text: 'Cancel',
          role: 'cancel',
          handler: () => { }
        }
      ]
    });
    actionSheet.present();
  }

  viewAttachment(attachment) {
    if (attachment == "") {
      this.toastService._showToast('No attachment selected', 3000);
    } else {
      this.modalCtrl.create("AttachmentViewPage", { attachment: attachment }).present();
    }
  }

}