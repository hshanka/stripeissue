import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, Slides, Events } from 'ionic-angular';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { Geolocation } from '@ionic-native/geolocation';
import { Storage } from '@ionic/storage';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { User } from 'firebase/app';
import { LoaderService, ToastService } from './../../providers';

@IonicPage()
@Component({
  selector: 'page-store-list-home',
  templateUrl: 'store-list-home.html'
})
export class StoreListHomePage {

  @ViewChild(Slides) slides: Slides;

  // partnerStore: any ='PartnerStoreListPage';
  // preferredStore: any = 'PreferredStoreListPage';
  private authenticatedUser: User;
  private authenticatedUser$: Subscription;

  private patnerSelected: boolean;

  private latitude: number;
  private longitude: number;

  private storeSegment: string = 'patnerStore';

  private partnerStoreListCol: AngularFirestoreCollection<any>;
  private preferredStoreListCol: AngularFirestoreCollection<any>;

  private partnerStoreList: Observable<any[]>;
  private patnerStoreListFilterred: Observable<any>;
  private preferredStoreList: Observable<any[]>;

  constructor(
    public navCtrl: NavController,
    private afs: AngularFirestore,
    public events: Events,
    private storage: Storage,
    private geolocation: Geolocation,
    private loaderService: LoaderService,
    private toastService: ToastService
  ) { }

  ionViewWillEnter() {
    this.loaderService.show();
    try {
      this.initPatnerStore();
      this.initLoggedUser();
    }
    catch (e) { }
  }

  ionViewWillLeave() {
    this.resetFields();
  }

  resetFields() {
    // this.authenticatedUser$.unsubscribe();
  }

  initLoggedUser() {
    try {
      this.storage.get('profile').then((data) => {
        if (data != null) {
          this.authenticatedUser = data;
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
      console.error('Error getting location SLH', error);
      this.toastService.custom('Filed to locate you! Please enable gps.');
    });
  }

  initPatnerStore() {
    let self = this;
    let distance: number;
    this.partnerStoreListCol = this.afs.collection(`stores`);
    this.patnerStoreListFilterred = this.partnerStoreListCol.snapshotChanges().map(actions => {
      return actions.map(a => {
        const data = a.payload.doc.data();
        const key = a.payload.doc.id;
        const partner = 'Y';
        if (this.getDistanceFromLatLonInKm(data.location.latitude, data.location.longitude)) {
          return { key, partner, ...data };
        }
      });
    });
    this.loaderService.hide();
    // distance = self.getDistanceFromLatLonInKm(12,14,12,16);
    // Hari: Commenting out since we might remove the preferred store concept
    // self.initPreferredStore();
  }

  initPreferredStore() {
    let self = this;
    this.preferredStoreListCol = this.afs.collection(`preferredStores`, ref => ref
      .where('userId', '==', this.authenticatedUser.uid));
    this.preferredStoreList = this.preferredStoreListCol.snapshotChanges().map(actions => {
      return actions.map(a => {
        const data = a.payload.doc.data();
        const key = a.payload.doc.id;
        const partner = 'N';
        return { key, partner, ...data };
      });
    });
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
    if (d <= 50) {
      return true;
    } else {
      return true;
    }
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180)
  }

  selectStore(item) {
    this.storage.ready().then(() => {
      this.storage.set('store', item).then(() => {
        this.navCtrl.popToRoot();
        this.events.publish('store:changed', event, Date.now());
      });
    });
  }

  goBack() {
    this.navCtrl.pop();
  }

  navigateToPrefferedStore() {
    this.navCtrl.push('AddPreferredStorePage', { storeStatus: "addStore" });
  }

  segmentChanged(event) {
    if (event._value == "patnerStore") {
      this.patnerSelected = true;
      this.slides.slideTo(0);
    } else {
      this.patnerSelected = false;
      this.slides.slideTo(1);
    }
  }

  slideChanged() {
    let currentIndex = this.slides.getActiveIndex();
    if (currentIndex == 0) {
      this.storeSegment = 'patnerStore';
      this.slides.lockSwipeToPrev(true);
      this.slides.lockSwipeToNext(false);
    } else if (currentIndex == 1) {
      this.storeSegment = 'preferredStore';
      this.slides.lockSwipeToNext(true);
      this.slides.lockSwipeToPrev(false);
    }
  }

}
