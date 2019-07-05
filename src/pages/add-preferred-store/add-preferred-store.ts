import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalOptions, ModalController, Events } from 'ionic-angular';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';
import { Storage } from '@ionic/storage';
import { Geolocation } from '@ionic-native/geolocation';
import { Network } from '@ionic-native/network';
import { Subscription } from 'rxjs/Subscription';
import { User } from 'firebase/app';
import firebase from 'firebase';
import { AuthService, GoogleService, LoaderService, ToastService } from './../../providers';
declare var google;

@IonicPage()
@Component({
  selector: 'page-add-preferred-store',
  templateUrl: 'add-preferred-store.html'
})
export class AddPreferredStorePage {

  @ViewChild('map') mapElement: ElementRef;

  map: any;
  autocompleteItems: any;
  autocomplete: any;
  acService: any;
  private latitude: any;
  private longitude: any;
  private selectedStore: any;

  mapInitialised: boolean = false;
  online: boolean;
  public isStorexists: boolean;
  public isStoreselected: boolean;
  private isAddstore: boolean;
  private isTab: boolean = true;
  private isModalOpen: boolean = false;

  searchAddress: string = "";
  private userId: string;
  private storeStatus: string;
  private selectedCountry: string;
  private storeNumber: string;

  places: Array<any>;
  public storeListArray: Array<any> = [];
  preferredStoresList: AngularFirestoreCollection<any>;

  private authenticatedUser: User;
  private authenticatedUser$: Subscription;

  private selectedStoreId: any;

  constructor(public navCtrl: NavController, 
    public navParams: NavParams, 
    public events: Events, 
    public modalCtrl: ModalController, 
    private afs: AngularFirestore,
    private db: AngularFireDatabase, 
    public geolocation: Geolocation, 
    private network: Network, 
    private storage: Storage,
    private auth: AuthService, 
    private googleService: GoogleService, 
    private toastService: ToastService, 
    private loaderService: LoaderService) {

    this.network.onConnect().subscribe(res => {
      this.online = true;
      return this.online;
    });

    this.network.onDisconnect().subscribe(res => {
      this.online = false;
      return this.online;
    });
  }

  ionViewDidLoad() {
    this.storeStatus = this.navParams.get('storeStatus');
    this.isStoreselected = false;
    this.checkBuddyStatus();
    this.initLoggedUser();
  }

  ionViewWillLeave() {
    this.resetFields();
    if (this.isTab) {
      this.navCtrl.popToRoot();
    }
  }

  goBack() {
    this.isTab = false;
    if (this.storeStatus == 'profile') {
      this.navCtrl.setRoot('TabsHomePage');
    } else {
      this.navCtrl.pop();
    }
  }

  resetFields() {
    // this.authenticatedUser$.unsubscribe();
  }

  checkBuddyStatus() {
    if (this.storeStatus == "addStore") {
      this.isAddstore = true;
    } else {
      this.isAddstore = false;
    }
  }

  ngOnInit() {
    this.autocompleteItems = [];
    this.autocomplete = {
      query: ''
    };
  }

  initLoggedUser() {
    try {
      this.storage.get('profile').then((data) => {
        if (data != null) {
          this.authenticatedUser = data;
          this.userId = this.authenticatedUser.uid;
          this.getGeolocation();
        }
      });
    } catch (e) { }
  }

  getGeolocation() {
    this.geolocation.getCurrentPosition().then((resp) => {
      this.latitude = resp.coords.latitude;
      this.longitude = resp.coords.longitude;
      var locationName = "My Location";
      this.loadMap(this.latitude, this.longitude, locationName);
    }).catch((error) => {
      this.toastService.custom('Failed to locate you! Please enable gps.');
    });
    this.autocomplete.query = "";
    this.isStoreselected = false;
  }

  loadMap(lat, long, locationName) {
    let latLng = new google.maps.LatLng(lat, long);
    let mapOptions = {
      center: latLng,
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    }
    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
    this.addMarker(locationName);
  }

  addMarker(locationName) {
    let marker = new google.maps.Marker({
      map: this.map,
      animation: google.maps.Animation.DROP,
      position: this.map.getCenter()
    });
    let content = "<h4>" + locationName + "</h4>";
    this.addInfoWindow(marker, content);
  }

  addInfoWindow(marker, content) {
    let infoWindow = new google.maps.InfoWindow({
      content: content
    });
    google.maps.event.addListener(marker, 'click', () => {
      infoWindow.open(this.map, marker);
    });
  }

  updateSearch() {
    this.loaderService.show();
    this.events.publish('location : name', { 'value': this.autocomplete.query });
    if (!this.isModalOpen) {
      this.isModalOpen = true;
      const myModalOptions: ModalOptions = {
        enableBackdropDismiss: true,
        cssClass: 'store-map-list-modal'
      };

      let modal = this.modalCtrl.create("AddPreferredStoreAddressPage", { 
        searchKey: this.autocomplete.query 
      }, myModalOptions);

      modal.onDidDismiss(data => {
        if (data) {
          this.selectedStoreId = data.place_id;
          this.loadMapData(data.geometry.location.lat, data.geometry.location.lng, data.name);
        }
        this.isModalOpen = false;
      });
      modal.present();
      this.isStoreselected = false;
    }
  }
  
  loadMapData(lati, longi, name) {
    this.autocompleteItems = [];
    this.isStoreselected = true;
    this.loadMap(lati, longi, name);
  }

  // not using
  chooseItem(item) {
    this.autocomplete.query = item.name + ' - ' + item.formatted_address;
    this.selectedStore = item;
    this.autocompleteItems = [];
    this.isStoreselected = true;
    this.loadMap(item.geometry.location.lat, item.geometry.location.lng, item.name);
  }

  addToPreferredStore() {
    this.toastService._confirmAlertCtrl('Add Store', 'Do you want to add this store to your preferred list', () => {
      this.getPlaceDetails();
    })
  }

  getPlaceDetails() {
    this.googleService.getPlaceDetails(this.selectedStoreId).subscribe(
      data => {
        if (data.result.international_phone_number != undefined) {
          this.storeNumber = data.result.international_phone_number;
        } else {
          this.storeNumber = "null";
        }
        data.result.address_components.forEach(add => {
          if (add.types[0] == "country") {
            this.selectedCountry = add.long_name;
          }
          return false;
        });
        this.addItemToPreferredStorelist(data.result);
      },
      err => {
        console.error(`Encountered error APS: ${err}`);
      },
      () => { }
    );
  }

  addItemToPreferredStorelist(item) {
    var self = this;
    self.preferredStoresList = self.afs.collection(`preferredStores`);
    let location = new firebase.firestore.GeoPoint(item.geometry.location.lat, item.geometry.location.lng);
    var observer = this.preferredStoresList.ref.where('userId', '==', self.userId)
      .where('location', '==', location)
      .onSnapshot(querySnapshot => {
        observer();

        let count = querySnapshot.size;
        if (count > 0) {
          self.isStorexists = true;
        } else {
          self.isStorexists = false;
        }

        if (!self.isStorexists) {
          let isSaved;
          isSaved = self.afs.collection('preferredStores').add({
            'address': item.formatted_address.split('.').join(' '),
            'backgroundImage': "",
            'country': self.selectedCountry,
            'curbside': "N",
            'customNotes': "N",
            'description': item.types[0].split('_').join(' '),
            'inStore': "N",
            'logo': item.icon,
            'name': item.name.split('.').join(' '),
            'number': self.storeNumber,
            'payment': "N",
            'primaryColor': "",
            'secondaryColor': "",
            'socialShare': "N",
            'location': new firebase.firestore.GeoPoint(item.geometry.location.lat, item.geometry.location.lng),
            'userId': self.userId
          });

          if (isSaved) {
            self.toastService.custom("Store saved");
          }
        } else {
          self.toastService.custom("Store already exist");
        }

        self.isStorexists = false;
        self.autocompleteItems = [];
        self.dismiss();
        self.getGeolocation();
      }, err => {
        console.error(`Encountered error APS: ${err}`);
      });
  }

  dismiss() {
    this.autocomplete.query = "";
    this.isStoreselected = false;
  }

  // skipContent() {
  //   if (this.storeStatus == "addStore") {
  //     this.isTab = false;
  //     this.navCtrl.pop();
  //   } else {
  //     this.isTab = false;
  //     this.navCtrl.setRoot('TabsHomePage');
  //     this.toastService.custom('Welcome In!');
  //   }
  // }

  // Configure Toast
  public presentToast(text) {
    this.toastService.custom(text);
  }

  skipStoreSelection() {
    this.isTab = false;
    this.navCtrl.setRoot('TabsHomePage');
    this.toastService.custom('Welcome In!');
  }

}
