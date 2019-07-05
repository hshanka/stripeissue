import { Component } from '@angular/core';
import { IonicPage, NavController, ModalController, Platform } from 'ionic-angular';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { Storage } from '@ionic/storage';
import { Subscription } from 'rxjs/Subscription';
import { User } from 'firebase/app';
import { AuthService, LoaderService, ToastService } from './../../providers';
import { receiptsListItem } from './../../models/receiptsListItem';

@IonicPage()
@Component({
  selector: 'page-store-receipts',
  templateUrl: 'store-receipts.html'
})
export class StoreReceiptsPage {

  private authenticatedUser: User;
  private authenticatedUser$: Subscription;
  private receiptListListener;

  private partnerStore: boolean = false;
  private isTab: boolean = true;

  private defaultThumbnail: string = 'assets/imgs/noimagethumbnail.jpg';
  private primaryColor: string;

  private receiptListDetailCol: AngularFirestoreCollection<any>;
  private receiptListCol: AngularFirestoreCollection<receiptsListItem>;
  private recieptListArray: Array<any> = [];
  private receiptListFilterArray: Array<any> = [];

  private receiptListDateFilterArray: Array<any> = [];
  private receiptListReciptIdFilterArray: Array<any> = [];

  private orderId: number;
  private storeId: string;

  constructor(
    public navCtrl: NavController,
    private platform: Platform,
    public modalCtrl: ModalController,
    private afs: AngularFirestore,
    private storage: Storage,
    private authService: AuthService,
    private loaderService: LoaderService,
    private toastService: ToastService
  ) { }

  ionViewWillEnter() {
    this.loaderService.show();
    this.initLoggedUser();
    this.setPlatformBackButton();
  }

  ionViewWillLeave() {
    this.resetFields();
    if (this.isTab) {
      this.navCtrl.popToRoot();
    }
  }

  setPlatformBackButton() {
    this.platform.registerBackButtonAction(() => {
      this.goBack();
    });
  }

  resetFields() {
    // this.authenticatedUser$.unsubscribe();
    this.receiptListListener();
  }

  goBack() {
    this.isTab = false;
    this.navCtrl.popToRoot();
  }

  initLoggedUser() {
    try {
      this.storage.get('profile').then((data) => {
        if (data != null) {
          this.authenticatedUser = data;
          this.initializeStoreHome();
        }
      });
    } catch (e) { }
  }

  initializeStoreHome() {
    this.receiptListCol = this.afs.collection<receiptsListItem>("receipt");
    this.storage.get('store').then((data) => {
      if (data != null) {
        this.storeId = data.key;
        this.primaryColor = data.primaryColor;
        if (data.partner == 'Y') {
          this.partnerStore = true;
        }
        this.fetchReceiptList();
      }
    });
  }

  fetchReceiptList() {
    var self = this;
    this.receiptListListener = this.receiptListCol.ref
      .where('userId', '==', this.authenticatedUser.uid)
      .onSnapshot(querySnapshot => {
        // this.shoppingItemList = [];
        if (querySnapshot.size > 0) {
          let instoreCount = querySnapshot.size;
          querySnapshot.forEach(function (doc) {
            let documentId = doc.id;
            let item = { documentId, ...doc.data() };
            self.addItemsToTheList(instoreCount, item, self.recieptListArray);
          });
        } else {
          self.loaderService.hide();
        }
      }, err => {
        console.error(`Encountered error SR : ${err}`);
        self.loaderService.hide();
      });
  }

  async addItemsToTheList(count, item, listRef) {
    let storeDetails = await this.getStoreDetails(item);
    let productDetails = item;
    let tmpItem = {
      'store': storeDetails,
      'receiptList': productDetails
    };
    if (listRef.filter(el => el.receiptList.documentId == tmpItem.receiptList.documentId).length > 0) {
      listRef = listRef.map((el, index, arr) => {
        if(el.receiptList.documentId == tmpItem.receiptList.documentId)
          return tmpItem;
        else
          return el;
      })
    } else {
      listRef.push(tmpItem);
    }
    if (count == listRef.length) {
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
            'storeCustomNote': '',
            'storeSelected': false,
            'storeTotalAmount': 0,
            'intExt': item.intExt,
            'primaryColor': doc.data().primaryColor,
            'secondaryColor': doc.data().secondaryColor
          }
        }
      })
      .catch(err => {
        console.error(`Encountered error SR : ${err}`);
      });
    return storeDt;
  }

  groupTheLIstByStore(listRef) {
    let storeListRef;
    storeListRef = this.receiptListFilterArray;
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
    // item.store.storeTotalAmount = item.store.storeTotalAmount + item.productList.productAmount;
    let tmpArr = {
      'store': item.store,
      'receiptList': [item.receiptList]
    }
    storeListRef.push(tmpArr);
  }
  
  addItemToExistingStoreList(item, storeListRef) {
    storeListRef.forEach(el => {
      if (el.store.storeId == item.store.storeId) {
        // el.store.storeTotalAmount = parseFloat(el.store.storeTotalAmount + item.productList.productAmount).toFixed(2);
        el.receiptList.push(item.receiptList);
      }
    })
  }

  getStatus(status) {
    if (status == 0) {
      return "Pending";
    } else if (status == 1) {
      return "In Progress";
    } else if (status == 2) {
      return "Done";
    }
    return "-"
  }

  navigateToRecieptPage(item) {
    this.isTab = false;
    this.navCtrl.push("StoreReceiptDetailPage", {
      receiptsId: item.receiptList.receiptsId, storeId: item.store.storeId, status: "receipt"
    })
  }

  search() {
    let tmVal;
    let modal = this.modalCtrl.create("StoreReceiptsFilterPage");
    modal.onDidDismiss(data => {
      if (data.dt == null) {
        data.dt = new Date().getTime();
      }
      if (data.st != null && data.dt != null) {
        this.filterArrayByDate(data.st, data.dt);
      }
      if (data.resId != null) {
        this.filterArrayByReciptId(data.resId);
      } else if (data.resetId == 1) {
        // need to check
        this.receiptListFilterArray = this.receiptListDateFilterArray;
      }
    });
    modal.present();
  }

  filterArrayByDate(startTime, endTime) {
    if (this.ckfFilteredValExist(startTime, endTime)) {
      this.receiptListDateFilterArray = this.receiptListFilterArray;
      this.receiptListFilterArray[0].receiptList = this.receiptListFilterArray[0].receiptList.filter(el => {
        if (Number(startTime) < Number(el.createdDateTime) && Number(el.createdDateTime) < Number(endTime)) {
          return el;
        }
      })
    } else {
      this.toastService.custom('no values exist for this search range');
      // toast => no values exist for this search range.
    }
  }
  
  ckfFilteredValExist(startTime, endTime) {
    let isExist = false;  
    this.receiptListFilterArray[0].receiptList.forEach(el => {
      if (Number(startTime) < Number(el.createdDateTime) && Number(el.createdDateTime) < Number(endTime)) {
        isExist = true;
      }
    })
    return isExist;
  }
  
  filterArrayByReciptId(reciptId) {
    if (this.ckfFilteredReciptIdValExist(reciptId)) {
      this.receiptListReciptIdFilterArray = this.receiptListFilterArray;
      this.receiptListFilterArray[0].receiptList = this.receiptListFilterArray[0].receiptList.filter(el => {
        if (reciptId == el.receiptsId) {
          return el;
        }
      })
    } else {
      this.toastService.custom('no values exist for this receipts Id ');
    }
  }
  
  ckfFilteredReciptIdValExist(reciptId) {
    let isExist = false;
    this.receiptListFilterArray[0].receiptList.forEach(el => {
      if (reciptId == el.receiptsId) {
        isExist = true;
      }
    })
    return isExist;
  }

}
