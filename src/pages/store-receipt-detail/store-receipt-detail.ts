import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, Platform, ModalController } from 'ionic-angular';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { Storage } from '@ionic/storage';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { User } from 'firebase/app';
import { AuthService, LoaderService, ToastService } from './../../providers';
import { orderDetailList } from './../../models/orderDetailList';
import { ProductItem } from './../../models/productItem';
import { orderProductListItem } from './../../models/orderProductListItem';

@IonicPage()
@Component({
  selector: 'page-store-receipt-detail',
  templateUrl: 'store-receipt-detail.html'
})
export class StoreReceiptDetailPage {

  private orderItem;
  private authenticatedUser: User;
  private authenticatedUser$: Subscription;

  private isPayable: boolean = false;
  private isTotalCalculated: boolean = false;
  private isTab: boolean = true;

  private initialCount: number;
  private finalAmount: number;
  private receiptId: number;
  private receiptStatus: number;

  private storeId: string;
  private storeName: string;
  private primaryColor: string;
  private status: string;
  private defaultThumbnail: string = 'assets/imgs/noimagethumbnail.jpg';

  private receiptListDetailCol: AngularFirestoreCollection<orderDetailList>;
  private productList: Array<any> = [];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private viewCtrl: ViewController,
    private platform: Platform,
    private afs: AngularFirestore,
    private storage: Storage,
    private authService: AuthService,
    private loaderService: LoaderService
  ) {
    this.receiptId = navParams.get('receiptsId');
    this.storeId = navParams.get('storeId');
    this.status = navParams.get('status');
  }

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
    this.productList = [];
    // this.authenticatedUser$.unsubscribe();
  }

  goBack() {
    this.isTab = false;
    if (this.status == "payment") {
      this.navCtrl.push('StoreReceiptsPage');
    } else {
      this.navCtrl.pop();
    }
  }

  initLoggedUser() {
    try {
      this.storage.get('profile').then((data) => {
        if (data != null) {
          this.authenticatedUser = data;
          this.initializeStoreSearch();
        }
      });
    } catch (e) { }
  }

  initializeStoreSearch() {
    this.storage.get('store').then((data) => {
      if (data != null) {
        // this.storeId = data.key;
        this.storeName = data.name;
        this.primaryColor = data.primaryColor;
        this.initializeOrderDetailPage();
      }
    });
  }

  initializeOrderDetailPage() {
    let self = this;
    this.afs.collection('receipt', ref => ref
    .where('receiptsId', '==', this.receiptId)
    .where('storeId', '==', this.storeId)).valueChanges().subscribe(el => {
      self.finalAmount = el[0]['amount'];
      self.receiptStatus = el[0]['status'];
    })
    this.afs.collection('receiptList', ref => ref
    .where('receiptsId', '==', this.receiptId)
    .where('storeId', '==', this.storeId)).valueChanges().forEach(value => {
      if (value.length > 0) {
        value.forEach(el => {
          self.getProductDetails(el);
          self.initialCount = value.length;
        })
      } else {
        self.loaderService.hide();
      }
    })
  }

  getProductDetails(item) {
    let pdtList = this.afs.collection<ProductItem>(`productList`).doc(item.materialId);
    var getDoc = pdtList.ref.get()
    .then(doc => {
      if (!doc.exists) { } else {
        let itemStatus = item.status;
        let itemAmt = Number(doc.data().productSalesPrice) * Number(item.qty);
        let productItem = { itemAmt, itemStatus, ...item, ...doc.data() };
        this.ckItemExistInList(productItem);
      }
    })
    .catch(err => {
      console.error(`Encountered error SRD : ${err}`);
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
      if (this.receiptStatus == 2) {
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
    }
    return "-"
  }

  chatBox() {
  }
  
}
