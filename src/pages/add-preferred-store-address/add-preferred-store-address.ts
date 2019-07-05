import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, Events } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';
import { GoogleService, LoaderService } from './../../providers';

@IonicPage()
@Component({
  selector: 'page-add-preferred-store-address',
  templateUrl: 'add-preferred-store-address.html'
})
export class AddPreferredStoreAddressPage {

  autocompleteItems: any;
  private autocomplete: any;
  private autocompleted: any;
  private latitude: any;
  private longitude: any;
  private selectedStore: any;

  private isTab: boolean = true;

  constructor(public navCtrl: NavController, 
    public navParams: NavParams, 
    private events: Events, 
    private googleService: GoogleService,
    private viewCtrl: ViewController, 
    public geolocation: Geolocation,  
    private loaderService: LoaderService) {
    this.events.subscribe('location : name', (data) => {
      this.autocomplete = data['value'];
      this.searchPlace(this.latitude, this.longitude);
    })
  }

  ionViewWillEnter() {
    this.autocompleteItems = [];
    this.autocomplete = this.navParams.get('searchKey');
    this.getGeolocation();
  }

  ionViewWillLeave() {
    this.resetFields();
    // if (this.isTab) {
    //   this.navCtrl.popToRoot();
    // }
  }

  resetFields() {
    this.autocompleteItems = [];
  }

  goBack() {
    this.isTab = false;
    this.viewCtrl.dismiss();
  }

  getGeolocation() {
    this.geolocation.getCurrentPosition().then((resp) => {
      this.latitude = resp.coords.latitude;
      this.longitude = resp.coords.longitude;
      this.searchPlace(this.latitude, this.longitude);
    }).catch((error) => {
      console.error('Error getting location', error);
    });
  }

  searchPlace(lati, longi) {
    if (this.autocomplete.length > 1) {
      var temp = this.autocomplete.split(' ').join('+');
      this.autocompleteItems = [];
      this.googleService.getPlaceSearchDetailsByLocation(temp, lati, longi).subscribe(
        data => {
          if (data.results.length > 0) {
            this.autocompleteItems = data.results;
          } else {
            /* put a toast here showing no stores found */
          }
          this.loaderService.hide();
        },
        err => {
          console.error(err);
          this.loaderService.hide();
        },
        () => { }
      );
    }
  }

  chooseItem(item) {
    this.isTab = false;
    this.viewCtrl.dismiss(item);
  }

}
