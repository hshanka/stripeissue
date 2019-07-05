import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { Geolocation } from '@ionic-native/geolocation';
import { Storage } from '@ionic/storage';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { User } from 'firebase/app';
import { AuthService, LoaderService, ToastService } from './../../providers';

@IonicPage()
@Component({
  selector: 'page-partner-store-list',
  templateUrl: 'partner-store-list.html'
})
export class PartnerStoreListPage {

  private authenticatedUser: User;
  private authenticatedUser$: Subscription;

  private latitude: number;
  private longitude: number;

  private partnerStoreListCol: AngularFirestoreCollection<any>;

  private partnerStoreList: Observable<any[]>;
  private patnerStoreListFilterred: Observable<any>;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams, 
     public events: Events,
    private afs: AngularFirestore,
    private geolocation: Geolocation,
    private storage: Storage, 
    private authService: AuthService, 
    public loaderService: LoaderService, 
    private toastService: ToastService) {
      try {    
        this.authenticatedUser$ = this.authService.getAuthenticatedUser().subscribe((user: User) => {
          this.authenticatedUser = user;  
        })
      } catch (e) { }
  }

  ionViewDidLoad() {
    this.getGeolocation();
  }

  ionViewWillEnter() {
    this.loaderService.show();
    try {
      this.initPatnerStore();
    }
    catch (e) { }
  }

  getGeolocation() {
    this.geolocation.getCurrentPosition().then((resp) => {
      this.latitude = resp.coords.latitude;
      this.longitude = resp.coords.longitude;
    }).catch((error) => {
      console.error('Error getting location', error);
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
        if(this.getDistanceFromLatLonInKm(data.location.latitude, data.location.longitude)){
          return { key,  partner, ...data };
        }
      });
    });
    self.loaderService.hide();
    // distance = self.getDistanceFromLatLonInKm(12,14,12,16);
  }

  getDistanceFromLatLonInKm(lat2,lon2) {
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
      this.storage.set('store', item);
      this.storeSelected('selectStore');
    });
  }

  storeSelected(event) {
    this.events.publish('store:selected', event, Date.now());
  }

}
