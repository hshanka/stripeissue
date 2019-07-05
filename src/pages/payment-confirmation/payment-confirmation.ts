import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController, ModalOptions } from 'ionic-angular';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { Storage } from '@ionic/storage';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { User } from 'firebase/app';
import { AuthService, LoaderService, ToastService } from './../../providers';
import { orderDetailList } from './../../models/orderDetailList';
import { storeCoupons } from './../../models/storeCoupons';
import { orderListItem } from './../../models/orderListItem';
import { ProductItem } from './../../models/productItem';
import { orderProductListItem } from './../../models/orderProductListItem';
import { receiptsListItem } from './../../models/receiptsListItem';

@IonicPage()
@Component({
  selector: 'page-payment-confirmation',
  templateUrl: 'payment-confirmation.html'
})
export class PaymentConfirmationPage {

  private orderItem;
  private storeItem;
  private authenticatedUser: User;
  private authenticatedUser$: Subscription;

  private isPayable: boolean = false;
  private isTotalCalculated: boolean = false;
  private isTab: boolean = true;

  private initialCount: number;
  private finalAmount: number;
  private totalAmount: number;
  private orderId: number;
  private orderStatus: number;
  private productCount: number;

  private type: string = '';
  private coupon: string = '';
  private couponApplied: string = 'No Applied Coupon';
  private couponAppliedStatus: boolean = false;
  private storeId: string;
  private orderDocId: string;
  private storeName: string;
  private primaryColor: string;
  private defaultThumbnail: string = 'assets/imgs/noimagethumbnail.jpg';

  private orderListCol: AngularFirestoreCollection<orderListItem>;
  private orderListDetailCol: AngularFirestoreCollection<any>;
  private receiptListDetailCol: AngularFirestoreCollection<any>;
  private inStoreListCol: AngularFirestoreCollection<any>;
  private receiptListCol: AngularFirestoreCollection<any>;

  private productList: Array<any> = [];
  private storeSelectedList: Array<any> = [];

  private storeCoupons: AngularFirestoreCollection<storeCoupons>;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams, 
    public modalCtrl: ModalController,
    private afs: AngularFirestore, 
    private storage: Storage,
    private authService: AuthService, 
    public loaderService: LoaderService, 
    private toastService: ToastService) {
    this.storeSelectedList = navParams.get('storeSelectedList');
    this.type = navParams.get('type');
    if (this.type == 'IS') {
      this.storeItem = this.storeSelectedList[0].store;
      this.productList = this.storeSelectedList[0].productList;
      this.finalAmount = this.storeSelectedList[0].store.storeTotalAmount;
    } else {
      this.orderItem = navParams.get('orderItem');
      this.orderDocId = this.orderItem.documentId;
      this.storeItem = navParams.get('storeItem');
      this.productList = navParams.get('productList');
      this.finalAmount = navParams.get('finalAmount');
    }
    this.storeId = this.storeItem.storeId;
  }

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
    this.productList = [];
  }

  goBack() {
    this.isTab = false;
    this.navCtrl.pop();
  }

  initLoggedUser() {
    this.orderListDetailCol = this.afs.collection('ordersList');
    this.orderListCol = this.afs.collection('orders');
    this.inStoreListCol = this.afs.collection('instore');
    try {
      this.storage.get('profile').then((data) => {
        if (data != null) {
          this.authenticatedUser = data;
        }
      });
    } catch (e) { }
  }

  chatBox() {
  }

  openPayOptionsModal() {
    const myModalOptions: ModalOptions = {
      enableBackdropDismiss: true,
      cssClass: 'pricebreakup'
    };
    let payOptions = this.modalCtrl.create("PayOptionsModalPage", {}, myModalOptions);
    payOptions.onDidDismiss(data => {
      if (data != undefined) {
        this.ckPrePageStatus(0, data);
      }
    });
    payOptions.present();
  }

  counterPaymentMode() { 
    this.ckPrePageStatus(0, 'C')
  }

  onlinePaymentMode() { 
    this.ckPrePageStatus(0, 'O')
  }

  ckPrePageStatus(i, data) {
    if (this.type == 'IS') {
      this.saveOrders(i, data);
    } else {
      this.updateOrderStatus(data);
    }
  }

  saveOrders(i, paymentType) {
    let self = this;
    let order = {
      'customNotes': this.storeSelectedList[i].store.storeCustomNote,
      'amount': this.storeSelectedList[i].store.storeTotalAmount,
      'numberOfItems': this.storeSelectedList[i].productList.length,
      'storeId': this.storeSelectedList[i].store.storeId,
      'intExt': this.storeSelectedList[i].store.intExt,
      'storeCode': this.storeSelectedList[i].store.storeCode,
    }
    this.generateOrderId(order.storeCode).then(orderId => {
      self._saveOrders(i, orderId, order, paymentType);
    })
  }

  _saveOrders(i, ordId, order, paymentType) {
    this.saveOrderList(ordId, order, paymentType).then(doc => {
      if (i + 1 < this.storeSelectedList.length) {
        this.saveOrders(i + 1, paymentType);
      }
      this.saveOrderListDetails(ordId, order, i)
    }).catch(err => {
      console.error(`Encountered error PC : ${err}`);
    });
  }

  saveOrderList(ordId, order, paymentType) {
    let self = this;
    return this.orderListCol.add({
      'orderId': ordId,
      'customNotes': order.customNotes,
      'intExt': order.intExt,
      'amount': order.amount,
      'numberOfItems': order.numberOfItems,
      'status': paymentType == 'C' ? 3 : 4,
      'storeId': order.storeId,
      'userId': self.authenticatedUser.uid,
      'storeUserId': "",
      'createdDateTime': new Date().getTime(),
      'attachment': ''
    })
  }

  saveOrderListDetails(orderId, order, listSize) {
    let self = this;
    for (let i = 0; i < this.storeSelectedList[listSize].productList.length; i++) {
      this.orderListDetailCol.add({
        'customeNotes': this.storeSelectedList[listSize].productList[i].productCustomNote,
        'materialId': this.storeSelectedList[listSize].productList[i].materialId,
        'orderId': orderId,
        'pickedQty': 0,
        'qty': this.storeSelectedList[listSize].productList[i].productQty,
        'status': 0,
        'storeId': order.storeId,
      }).then(doc => {
        self.productCount = 1;
        self.productCount = self.productCount + i;
        if (order.numberOfItems == self.productCount) {
          self.deleteProductItems(listSize);
        }
      }).catch(err => {
        console.error(`Encountered error PC : ${err}`);
      });
    }
  }

  async deleteProductItems(listSize) {
    for (let i = 0; i < this.storeSelectedList[listSize].productList.length; i++) {
      this.inStoreListCol.doc(this.storeSelectedList[listSize].productList[i].cartDocId).delete().catch(err => {
        console.error(`Encountered error PC : ${err}`);
      })
    }
    // this.navCtrl.pop();
    this.navCtrl.parent.select(3);
  }

  generateOrderId(storeCode) {
    return new Promise((resolve, reject) => {
      resolve(storeCode + "" + "-OI-"+ this.getRandomInt(100,999)+ "-" + new Date().getTime());
    })
  }

  updateOrderStatus(paymentType) {
    let self = this;
    this.orderListCol.doc(this.orderDocId).update({
      "status": paymentType == 'C' ? 3 : 4,
    }).then(succ => {
      self.navCtrl.pop();
    }).catch(err => {
      console.error(`Encountered error PC : ${err}`);
    })
  }


  doPayment() {
    this.loaderService.show();
    this.storeCoupons = this.afs.collection<storeCoupons>("storeCoupons");
    let self = this;
    if (this.coupon != null && this.coupon.length > 0) {
      var observer = this.storeCoupons.ref
        .where('couponCode', '==', this.coupon)
        .where('storeId', '==', this.storeId).onSnapshot(snap => {
          observer();
          snap.forEach(function (doc) {
            if (doc.data().couponCount > 0) {
              self.afs.collection<storeCoupons>("storeCoupons").doc(doc.id).set({
                "couponCode": doc.data().couponCode,
                "couponCount": doc.data().couponCount - 1,
                "discountType": doc.data().discountType,
                "endTimestamp": doc.data().endTimestamp,
                "maxAmount": doc.data().maxAmount,
                "minAmount": doc.data().minAmount,
                "percentDiscount": doc.data().percentDiscount,
                "rateDiscount": doc.data().rateDiscount,
                "startTimestamp": doc.data().startTimestamp,
                "storeId": doc.data().storeId
              })
              .then(doc => {
                self.loaderService.hide();
                // self.navCtrl.push('StoreOrderSuccessPage', {
                //   total: self.finalAmount
                // })
                // self.navCtrl.push('StoreReceiptsPage', {
                //   orderId: this.orderId, storeId: this.storeId
                // })
                // self.generateReceipts();
              }).catch(err => {
                console.error(`Encountered error PC : ${err}`);
              })
            }
          })
        })
    } else {
      this.loaderService.hide();
      // self.navCtrl.push('StoreOrderSuccessPage', {
      //   total: self.finalAmount
      // })
      // this.navCtrl.push('StoreReceiptsPage', {
      //   orderId: this.orderId, storeId: this.storeId
      // });
      // self.generateReceipts();
    }
  }

  checkcoupons() {
    let self = this;
    if (this.coupon.length > 0) {
      this.loaderService.show();
      this.afs.collection('storeCoupons', ref => ref
        .where('couponCode', '==', this.coupon))
        .valueChanges().subscribe(coupons => {
          if (coupons != null && coupons.length > 0) {
            self.discountCalculation(coupons)
          } else {
            this.deletecoupons()
            self.showToast('Invalid Coupon', 3000);
          }
        })
      this.loaderService.hide();
    } else {
      self.showToast('Please Enter a Coupon', 3000);
    }
  }

  discountCalculation(coupons) {
    let self = this;
    var timeNow = new Date().getTime();
    if (this.storeId != coupons[0]['storeId']) {
      this.deletecoupons()
      self.showToast('Coupon is not valid for this store', 3000);
    } else if (timeNow < coupons[0]['startTimestamp']) {
      this.deletecoupons()
      self.showToast('Coupon is not valid for this date', 3000);
    } else if (timeNow > coupons[0]['endTimestamp']) {
      this.deletecoupons()
      self.showToast('Coupon is not valid for this date', 3000);
    } else if (coupons[0]['couponCount'] <= 0) {
      this.deletecoupons()
      self.showToast('Coupon Expired', 3000);
    } else if (this.totalAmount < coupons[0]['minAmount']) {
      this.deletecoupons()
      self.showToast('Coupon can be applied only for a minium purchase of' + coupons[0]['minAmount'], 3000);
    } else if (this.totalAmount > coupons[0]['maxAmount']) {
      this.deletecoupons()
      self.showToast('Coupon can be applied only for a maximum purchase of' + coupons[0]['maxAmount'], 3000);
    } else {
      if (coupons[0]['discountType'] == "PERC") {
        this.finalAmount = ((100 - coupons[0]['percentDiscount']) / 100) * this.totalAmount
        this.finalAmount = Number(this.finalAmount.toFixed(2));
        this.couponApplied = coupons[0]['couponCode']
        this.couponAppliedStatus = true
        this.storeCoupons = coupons[0]
      } else if (coupons[0]['discountType'] == "RATE") {
        this.finalAmount = this.totalAmount - coupons[0]['rateDiscount']
        this.finalAmount = Number(this.finalAmount.toFixed(2));
        this.couponApplied = coupons[0]['couponCode']
        this.couponAppliedStatus = true
        self.showToast('Coupon Applied', 3000);
      }
    }
  }

  deletecoupons() {
    this.couponApplied = 'No Applied Coupon';
    this.couponAppliedStatus = false;
    this.finalAmount = this.totalAmount;
    this.coupon = "";
  }

  // generateReceipts() {
  //   this.receiptListCol = this.afs.collection('receipt');
  //   this.receiptListDetailCol = this.afs.collection('receiptList');
  //   this.saveReceipts(0);
  // }

  navigateToStoreReceiptDetail(receiptsId) {
    this.isTab = false;
    this.navCtrl.push('StoreReceiptDetailPage', {
      receiptsId: receiptsId, storeId: this.storeId, status: "payment"
    });
  }

  /* show toast message dynamically */
  showToast(message, time) {
    this.toastService.custom(message);
  }

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

}
