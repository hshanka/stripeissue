import { Component } from '@angular/core';
import { IonicPage, NavController, ActionSheetController } from 'ionic-angular';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { Storage } from '@ionic/storage';
// import { Facebook, FacebookLoginResponse } from '@ionic-native/facebook';
// import { GooglePlus } from '@ionic-native/google-plus';
import firebase from 'firebase';
import { User } from 'firebase/app';
import { LoaderService, ToastService } from './../../providers';
import { fcmService } from "../../providers/utils/fcm-service/fcm.service";
import { Account } from '../../models/account';
import { UserItem } from './../../models/userItem';

@IonicPage()
@Component({
  selector: 'page-basic-profile',
  templateUrl: 'basic-profile.html'
})
export class BasicProfilePage {

  account = {} as Account;

  private avatar = "";
  private authenticatedUser: User;

  private isTab: boolean = true;
  private isEdit: boolean = false;
  private isAvatar: boolean = false;
  private emailLinking: boolean = false;

  private dob: string;
  private email: string;
  private firstName: string;
  private lastName: string;
  private phone: string;
  private role: string;
  private status: string;
  private storeId: string;
  private docId: string;

  private userDetailCol: AngularFirestoreCollection<UserItem>;
  private userData: Array<any> = [];

  constructor(
    public navCtrl: NavController,
    public actionSheetCtrl: ActionSheetController,
    private afs: AngularFirestore,
    private camera: Camera,
    private storage: Storage,
    // private fb: Facebook,
    // private googlePlus: GooglePlus,
    private loaderService: LoaderService,
    private toastService: ToastService,
    private fcmService: fcmService) {}

  ionViewDidLoad() {
    this.initLoggedUser();
  }

  ionViewWillLeave() {
    this.resetFields();
    if (this.isTab) {
      this.navCtrl.popToRoot();
    }
  }

  resetFields() {
  }

  goBack() {
    this.isTab = false;
    if (this.isEdit == true) {
      this.isEdit = false;
    } else {
      this.navCtrl.popToRoot();
    }
  }

  // User Authentication
  initLoggedUser() {
    try {
      this.storage.get('profile').then((data) => {
        if (data != null) {
          this.authenticatedUser = data;
          this.loadUserDetails();
        }
      });
    } catch (e) { }
  }

  loadUserDetails() {
    this.loaderService.show();
    this.userDetailCol = this.afs.collection('userProfile');
    let self = this;
    this.afs.collection('userProfile')
    .ref
    .where('uid', '==', this.authenticatedUser.uid).onSnapshot(querySnapshot => {
      if (querySnapshot.size > 0) {
        querySnapshot.forEach(function (doc) {
          self.userData = [];
          let documentId = doc.id;
          let item = { documentId, ...doc.data() };
          self.userData.push(item);
          self.setValues(item);
        });
        self.loaderService.hide();
      } else {
        self.loaderService.hide();
      }
    }, err => {
      self.loaderService.hide();
      console.error(`Encountered error BP : ${err}`);
    });
  }

  setValues(item) {
    this.dob = item.dob;
    this.email = item.email;
    this.firstName = item.firstName;
    this.lastName = item.lastName;
    this.phone = item.phone;
    this.role = item.role;
    this.status = item.status;
    this.storeId = item.storeId;
    this.docId = item.documentId;
    this.avatar = item.avatar;
    if (this.avatar === "" || this.avatar === undefined) {
      this.isAvatar = false;
      this.avatar = "";
    } else {
      this.isAvatar = true;
    }
  }

  editProfile() {
    this.isEdit = true;
  }

  presentActionSheet() {
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Select your action',
      buttons: [
        {
          text: 'Capture',
          handler: () => {
            this.captureImage();
          }
        }, {
          text: 'Select',
          handler: () => {
            this.openFile();
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

  captureImage() {
    const options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE
    }
    this.camera.getPicture(options).then((imageData) => {
      // imageData is either a base64 encoded string or a file URI
      // If it's base64:
      let base64Image = 'data:image/jpeg;base64,' + imageData;
      this.avatar = base64Image;
    }, (err) => {
      // Handle error
    });
  }

  openFile() {
    const options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      sourceType: this.camera.PictureSourceType.SAVEDPHOTOALBUM
    }
    this.camera.getPicture(options).then((imageData) => {
      // imageData is either a base64 encoded string or a file URI
      // If it's base64:
      let base64Image = 'data:image/jpeg;base64,' + imageData;
      this.avatar = base64Image;
    }, (err) => {
      // Handle error
    });
  }

  saveProfile() {
    this.loaderService.show();
    this.fcmService.getDeviceToken().then(token => {

      this.userDetailCol.doc(this.docId).set({
        'dob': this.dob,
        'email': this.email,
        'firstName': this.firstName,
        'lastName': this.lastName,
        'phone': this.phone,
        'role': this.role,
        'status': this.status,
        'storeId': this.storeId,
        'uid': this.authenticatedUser.uid,
        'avatar': this.avatar,
        'devices': [token]
      }).then(doc => {
        this.isEdit = false;
        this.loadUserDetails();
      }).catch(err => {
        this.loaderService.hide();
      })
    
    })
    
  }

  fbLink() {
    /*this.fb.login(['public_profile', 'user_friends', 'email'])
      .then((res: FacebookLoginResponse) => {
        let credentials = firebase.auth.FacebookAuthProvider.credential(res.authResponse.accessToken);
        firebase.auth().currentUser.linkWithCredential(credentials).then((info) => {
          this.toastService.custom(`Facebook Linking  Successful`);
        }).catch(error => {
          this.toastService.custom(error.message);
        });
      }).catch(e =>
        console.error('Error logging into Facebook', e));*/
  }

  googleLink() {
    /*this.googlePlus.login({ 'webClientId': '1086163179887-lnail39vrvjqtq5jv33mm0e02788s6oi.apps.googleusercontent.com', 'offline': false })
      .then(res => {
        let credentials = firebase.auth.GoogleAuthProvider.credential(res.idToken);
        firebase.auth().currentUser.linkWithCredential(credentials).then((info) => {
          this.toastService.custom(`Google Linking  Successful`);
        }).catch(error => {
          this.toastService.custom(error.message);
        });
      }).catch(err =>
        console.error('Error logging into Google', err));*/
  }


  emailLink() {
    this.emailLinking = true;
  }

  cancelLink() {
    this.emailLinking = false;
  }

  linkUser() {
    if (this.account.email && this.account.password) {
      var credential = firebase.auth.EmailAuthProvider.credential(this.account.email, this.account.password);
      firebase.auth().currentUser.linkWithCredential(credential).then((user) => {
        this.toastService.custom(`Email Linking  Successful`);
        this.emailLinking = false;
      }).catch(error => {
        console.error("Account linking error", error);
        this.toastService.custom(error.message);
        this.emailLinking = false;
      });
    } else {
      this.toastService.custom("Please enter valid credentials");
    }
  }

}
