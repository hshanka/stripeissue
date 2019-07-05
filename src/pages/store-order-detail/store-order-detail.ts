import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, ModalOptions, Platform, ModalController, AlertController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { User } from 'firebase/app';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { AuthService, LoaderService, ToastService } from './../../providers';
import { orderDetailList } from './../../models/orderDetailList';
import { ProductItem } from './../../models/productItem';
import { orderProductListItem } from './../../models/orderProductListItem';
import { ShoppingMode } from './../../models/shoppingMode';

@IonicPage()
@Component({
  selector: 'page-store-order-detail',
  templateUrl: 'store-order-detail.html'
})
export class StoreOrderDetailPage {

  private orderItem;
  private authenticatedUser: User;
  private authenticatedUser$: Subscription;
  private orderObserver;
  private storeItem;

  private isPayable: boolean = false;
  private isTotalCalculated: boolean = false;
  private isTab: boolean = true;
  // private unAvail:boolean = false;

  private initialCount: number;
  private finalAmount: number;
  private orderId: number;
  private orderStatus: number;

  private storeId: string;
  private storeName: string;
  private primaryColor: string;
  private defaultThumbnail: string = 'assets/imgs/noimagethumbnail.jpg';

  private orderListDetailCol: AngularFirestoreCollection<orderDetailList>;
  private shoppingModeListCol: AngularFirestoreCollection<ShoppingMode>;

  private productList: Array<any> = [];
  private count: number = 0;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private viewCtrl: ViewController,
    private platform: Platform,
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    private afs: AngularFirestore,
    private storage: Storage,
    private authService: AuthService,
    private loaderService: LoaderService,
    private toastService: ToastService
  ) {
    
    this.orderId = navParams.get('orderId');
    this.storeItem = navParams.get('storeItem');
    this.storeId = navParams.get('storeId');
    this.orderItem = navParams.get('item');
  }

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
    this.productList = [];
    // this.authenticatedUser$.unsubscribe();
    this.orderObserver();
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
          this.initializeOrderDetailPage();
        }
      });
    } catch (e) { }
  }

  initializeOrderDetailPage() {
    this.shoppingModeListCol = this.afs.collection<ShoppingMode>("shoppingMode");

    let self = this;
    var isLoadingDismiss = false

    this.orderObserver = this.afs.collection('orders').ref
      .where('orderId', '==', this.orderId)
      .where('storeId', '==', this.storeId).onSnapshot(querySnapshot => {
        
        querySnapshot.forEach(el => {
          self.orderStatus = el.data().status;
        })
        // self.orderStatus = el[0]['status'];
        self._ifEnableFooter();
      })

    let orderListObserver = this.afs.collection('ordersList').ref
      .where('orderId', '==', this.orderId)
      .where('storeId', '==', this.storeId).onSnapshot(querySnapshot => {
        
        querySnapshot.forEach(el => {
          self.initialCount = querySnapshot.size;
          let tmpItem = {
            'customeNotes': el.data().customeNotes,
            'materialId': el.data().materialId,
            'orderId': el.data().orderId,
            'pickedQty': el.data().pickedQty,
            'qty': el.data().qty,
            'status': el.data().status,
            'storeId': el.data().storeId,
            'documentId': el.id
          }
          self.getProductDetails(tmpItem);
        })
      });
    // this.afs.collection('ordersList', ref => ref
    //   .where('orderId', '==', this.orderId)
    //   .where('storeId', '==', this.storeId)).valueChanges().forEach(value => {
    //     console.log('value.forEac ordersDTList');
    //     console.log(`Received query snapshot of initializeOrderDetailPage orders list size` + value.length);
    //     if (value.length > 0) {
    //       value.forEach(el => {
    //         console.log(el);
    //         self.getProductDetails(el);
    //         self.initialCount = value.length;
    //       })
    //     } else {

    //     }
    //     if (isLoadingDismiss) {
    //       self.loading.dismiss();
    //     }
    //     isLoadingDismiss = true
    //   })
  }

  getProductDetails(item) {
    this.finalAmount = 0;
    let notAvail: number = 0;
    this.count = 0;
    this.afs.collection<ProductItem>(`productList`).doc(item.materialId).ref.get().then(doc => {
      if (!doc.exists) { } else {
        let itemStatus = item.status;
        if (itemStatus == 2) {
          this.count = this.count + 1;
        }
        let qty: number;
        if (itemStatus <= 1) {
          qty = item.pickedQty != 0 ? item.pickedQty : item.qty;
        } else {
          qty = 0;
        }
        let itemAmt = Number(doc.data().productSalesPrice) * qty;

        this.finalAmount += itemAmt;
        this.finalAmount = Number(this.finalAmount.toFixed(2));
        let productItem = { itemAmt, itemStatus, ...item, ...doc.data() };
        // this.productList.push(productItem);
        this.ckItemExistInList(productItem);
      }
    })
    .catch(err => {
      console.error(`Encountered error SOD : ${err}`);
    });
  }

  ckItemExistInList(item) {
    let isExist = false;
    this.productList.forEach(el => {
      if (el.productUPC == item.productUPC) {
        isExist = true;
      }
    })
    if (!isExist) {
      this.productList.push(item);
    } else {
      this.updateItemInPdtList(item);
    }
    this._ifEnableFooter();
  }

  _ifEnableFooter() {
    if (this.productList.length == this.initialCount) {
      if (this.orderStatus == 2) {
        this.isPayable = true;
      } else {
        this.isPayable = false;
      }
      this.loaderService.hide();
      this.isTotalCalculated = true;
    }
  }

  updateItemInPdtList(item) {
    this.productList = this.productList.map(el => {
      if (el.productUPC == item.productUPC) {
        return item;
      } else {
        return el;
      }
    })
  }

  getStatus(status) {
    if (status == 0) {
      return "Pending";
    } else if (status == 1) {
      return "Done";
    } else if (status == 2) {
      return "Not Available";
    } else if (status == 3) {
      return "Added to SMode";
    }
    return "-"
  }

  saveUnavailableItemsInShoppingMode() {
    const alert = this.alertCtrl.create({
      title: 'Add to Shopping Mode',
      message: 'Do you want to add the items to shopping Mode list ?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => { }
        },
        {
          text: 'Yes',
          handler: () => {
            this._saveUnavailableItemsInShoppingMode();
          }
        }
      ]
    });
    alert.present();
  }

  _saveUnavailableItemsInShoppingMode() {
    this.productList.forEach(el => {
      let self = this;
      if (el.itemStatus == 2) {
        this.afs.collection<ShoppingMode>("shoppingMode").add({
          'storeId': this.storeId,
          'userId': this.authenticatedUser.uid,
          'addedToCart': 'N',
          'materialId': el.materialId,
          'quantity': el.qty,
          'pickedQuantity': 0
        }).then(doc => {
          // loaderService.hide();
          self.deleteOrderLineItem(el);
        }).catch(err => {
          console.error(`Encountered error SOD : ${err}`);
        })
      }
    })
  }

  deleteOrderLineItem(el) {
    this.afs.collection('ordersList').doc(el.documentId).update({
      "status": 3,
    }).then(succ => {
      el.status = 3;
    }).catch(err => {
      console.error(`Encountered error SOD : ${err}`);
    })
  }

  chatBox() { }

  doPayment() {
    this.isTab = false;
    this.navCtrl.push('PaymentConfirmationPage', {
      orderItem: this.orderItem, storeItem: this.storeItem, productList: this.productList.filter(el => el.itemStatus == 1), finalAmount: this.finalAmount, type: 'CS'
    })
  }

  openItemCustomNotes(item) {
    const myModalOptions: ModalOptions = {
      enableBackdropDismiss: true,
      cssClass: 'pricebreakup'
    };
    this.modalCtrl.create("CustomNotesPage", { customNote: item.customeNotes, isEditable: "N" }, myModalOptions).present();
  }

}
