import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, ModalController } from 'ionic-angular';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { Storage } from '@ionic/storage';
import { User } from 'firebase/app';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { StripeService, LoaderService, DataService } from './../../providers';
import { orderListItem } from './../../models/orderListItem';
import { Store } from './../../models/store';
import { AlertController } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-order-confirmation',
  templateUrl: 'order-confirmation.html'
})
export class OrderConfirmationPage {

  private type: string;
  private productCount: number;
  private loading;
  public storeSelectedList;
  private authenticatedUser: User;
  private authenticatedUser$: Subscription;
  private attachment;

  private isTab: boolean = true;
  private isOrdered: boolean = false;

  private defaultThumbnail: string = 'assets/imgs/noimagethumbnail.jpg';

  private orderListDetailCol: AngularFirestoreCollection<any>;
  private orderListCol: AngularFirestoreCollection<orderListItem>;
  private curbsideListCol: AngularFirestoreCollection<any>;
  private inStoreListCol: AngularFirestoreCollection<any>;
  private storeListCol: AngularFirestoreCollection<Store>;
  private orderList: Observable<orderListItem[]>;
  private orderId;
  private orderAmount;
  savedCardsList = [];

  userProfile:any;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public modalCtrl: ModalController,
    private afs: AngularFirestore,
    private storage: Storage,
    private loaderService: LoaderService,
    public stripeService: StripeService,
    private alertCtrl: AlertController
  ) { 
    this.storeSelectedList = navParams.get('storeSelectedList');
    this.type = navParams.get('type');
    this.attachment = navParams.get('attachment');

    this.storage.ready().then(() => {
      this.storage.get('profile').then((result) => {
        this.stripeService.setStripeCustomerId(result);
          this.userProfile = result
          
        if (this.userProfile.platform_stripe_uid && this.userProfile.connected_stripe_uid) {
          this.getSavedCards();
        }
      })
    });
  }

  ionViewWillEnter() {
    
    this.isOrdered = true;
    this.initLoggedUser();
    //this.setupSavedCards();
  }

  setupSavedCards() {
    this.savedCardsList = [{"id":"src_1Eoqi2EowT6P7F4QR2gHmevQ","object":"source","amount":null,"card":{"exp_month":4,"exp_year":2024,"last4":"4242","country":"US","brand":"Visa","cvc_check":"pass","funding":"credit","fingerprint":"hZjKeUQHTpFxw0cR","three_d_secure":"optional","name":null,"address_line1_check":null,"address_zip_check":null,"tokenization_method":null,"dynamic_last4":null},"client_secret":"src_client_secret_FJTfRkIQV7V5kq3ynhsXqPkm","created":1561377102,"currency":null,"customer":"cus_FJTfvSTsoZq03B","flow":"none","livemode":false,"metadata":{},"owner":{"address":null,"email":null,"name":null,"phone":null,"verified_address":null,"verified_email":null,"verified_name":null,"verified_phone":null},"statement_descriptor":null,"status":"chargeable","type":"card","usage":"reusable"}];
  }


  getSavedCards() {
    let data = {
      "user": {
        "customerId": this.userProfile.platform_stripe_uid
      }
    }

    this.loaderService.show();
    this.stripeService.getSavedCards(data).then((result: any) => {
      this.loaderService.hide();
      console.log(result);
      this.savedCardsList = JSON.parse(result._body).resp.data;
    }).catch((err) => {
      this.loaderService.hide();
      console.log(err)
    });
  }

  //todo
  // comented because it is redirecte to route on leaving the page
  // user: faizal

 /*  ionViewWillLeave() {
    this.resetFields();
    if (this.isTab) {
      this.navCtrl.popToRoot();
    }
  } */

  resetFields() {
    // this.authenticatedUser$.unsubscribe();
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
          this.initializePaymentListPage();
        }
      });
    } catch (e) { }
  }

  initializePaymentListPage() {
    this.orderListCol = this.afs.collection('orders');
    this.orderListDetailCol = this.afs.collection('ordersList');
    this.curbsideListCol = this.afs.collection('curbside');
    this.inStoreListCol = this.afs.collection('instore');
    this.storeListCol = this.afs.collection('stores');
  }

  openItemCustomNotes(type, item) {
    let message;
    if (type == 'S') {
      message = item.store.storeCustomNote;
    } else {
      message = item.productCustomNote;
    }
    this.modalCtrl.create("CustomNotesPage", { customNote: message, isEditable: "N" }).present();
  }

  /**
   * name: showPaymentpage
   * @param : i
   */

  showPaymentPage(orderId, amount){

    this.navCtrl.push('StoreOrdersPage').then(()=>{
      this.navCtrl.remove(this.navCtrl.getPrevious().index);
    });

    //this.navCtrl.push("PaymentPage", {"cartInfo":{"orderId":orderId, "amount":amount}});
  } 

  showAddCardAlert(){
    this.alertCtrl.create({
      title: 'Add a card to proceed.',
      message: 'Do you want to proceed ?',
      buttons: [
        {
          text: 'Cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Ok',
          handler: () => {
            this.navCtrl.push('AddCardsPage');
            //console.log('Ok clicked');
          }
        }
      ]
    }).present();
  }


  


  async saveOrders(i) {
    
    if(!this.savedCardsList.length){
      this.showAddCardAlert();
    }else{
      if (this.isOrdered) {
        this.isOrdered = false;
        this.loaderService.show();
        let self = this;
        let order = {
          'customNotes': this.storeSelectedList[i].store.storeCustomNote,
          'amount': Number(this.storeSelectedList[i].store.storeTotalAmount),
          'numberOfItems': this.storeSelectedList[i].productList.length,
          'storeId': this.storeSelectedList[i].store.storeId,
          'intExt': this.storeSelectedList[i].store.intExt,
          'storeCode': this.storeSelectedList[i].store.storeCode,
          'attachment': this.attachment
        }
        await this.generateOrderId(order.storeCode).then(orderId => {
          this.orderId = orderId;
          this.orderAmount = order.amount;
          self.saveOrd(i, orderId, order);
        })
      }
    }
  }

  async saveOrd(i, ordId, order) {
    await this.saveOrderList(ordId, order).then(doc => {
      if (i + 1 < this.storeSelectedList.length) {
        this.saveOrders(i + 1);
      }
      this.saveOrderListDetails(ordId, order, i)
    }).catch(err => {
      console.error(`Encountered error OC : ${err}`);
    });
  }

  async saveOrderList(ordId, order) {
    let self = this;
    return await this.orderListCol.add({
      'orderId': ordId,
      'customNotes': order.customNotes,
      'intExt': order.intExt,
      'amount': order.amount,
      'numberOfItems': order.numberOfItems,
      'status': 0,
      'storeId': order.storeId,
      'userId': self.authenticatedUser.uid,
      'storeUserId': "",
      'createdDateTime': new Date().getTime(),
      'attachment': order.attachment
    })
  }

  async saveOrderListDetails(orderId, order, listSize) {
    let self = this;
    for (let i = 0; i < this.storeSelectedList[listSize].productList.length; i++) {
      await this.orderListDetailCol.add({
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
        console.error(`Encountered error OC : ${err}`);
      });
    }
  }

  async deleteProductItems(listSize) {
    for (let i = 0; i < this.storeSelectedList[listSize].productList.length; i++) {
      if (this.type == 'CS') {
        await this.curbsideListCol.doc(this.storeSelectedList[listSize].productList[i].cartDocId).delete().catch(err => {
          console.error(`Encountered error OC : ${err}`);
        })
      } else if (this.type == 'IS') {
        await this.inStoreListCol.doc(this.storeSelectedList[listSize].productList[i].cartDocId).delete().catch(err => {
          console.error(`Encountered error OC : ${err}`);
        })
      }
    }
    
    this.loaderService.hide();
    this.navCtrl.push('StoreOrdersPage').then(()=>{
      this.navCtrl.remove(this.navCtrl.getPrevious().index);
      this.navCtrl.remove(this.navCtrl.getPrevious().index - 1);
    });
   // this.showPaymentPage(this.orderId, this.orderAmount)
  }

  async generateOrderId(storeCode) {
    return await new Promise((resolve, reject) => {
      resolve(storeCode + "" + "-OI-" + this.getRandomInt(100, 999) + "-" + new Date().getTime());
    })
  }

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

}
