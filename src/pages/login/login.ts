import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
// import { Facebook, FacebookLoginResponse } from '@ionic-native/facebook';
// import { GooglePlus } from '@ionic-native/google-plus';
import { User } from 'firebase/app';
import firebase from 'firebase';
import { AuthService, DataService, ToastService, fcmService} from './../../providers';
import { Account } from '../../models/account';

@IonicPage()
@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {

  account = {} as Account;

  constructor(
    public navCtrl: NavController,
    private storage: Storage,
    // private fb: Facebook,
    // private googlePlus: GooglePlus,
    private authService: AuthService,
    private dataService: DataService,
    private toastService: ToastService,
    private fcmService: fcmService) {
  }

  navigateToRegisterPage() {
    this.navCtrl.push('RegisterPage');
  }

  async loginUser() {
    console.log("login");
    const result = await this.authService.signInWithEmailAndPassword(this.account);
    this.login(result);
  }

  login(event) {
    if (!event.error) {
      // if (!event.result.emailVerified) {
      //   this.toastService._showToast('Please verify your email first by clicking on the link in your inbox!', 3000);
      //   return;
      // }
      this.dataService.getProfile(<User>event.result).then(profile => {
        this.checkUser(profile);
        
      }).catch(err => {
        if (err == 'NP') {
          this.toastService._showToast(event.result.email, 3000);
          this.navCtrl.setRoot('EditProfilePage', { provider: "email", userDetails: event.result })
        } else { }
      });
    } else {
      this.toastService._showToast(event.error.message, 3000);
    }
  }

  Fblogin() {
    /*this.fb.login(['public_profile', 'user_friends', 'email'])
      .then((res: FacebookLoginResponse) => {
        let credentials = firebase.auth.FacebookAuthProvider.credential(res.authResponse.accessToken);
        firebase.auth().signInWithCredential(credentials).then((info) => {
          this.toastService._showToast(`Welcome In! ${info.email}`, 3000);
          this.data.getProfile(<User>info).then(profile => {
            this.savePfofileToDB(profile);
          }).catch(err => {
            if (err == 'NP') {
              this.navCtrl.setRoot('EditProfilePage', { provider: "facebook", userDetails: info })
            } 
          });
        }).catch(error => {
          this.toastService._showToast(error.message, 3000);
        });
      }).catch(e =>
        console.error('Error logging into Facebook', e));*/
  }

  Googlelogin() {
    /*this.googlePlus.login({ 'webClientId': '1086163179887-lnail39vrvjqtq5jv33mm0e02788s6oi.apps.googleusercontent.com', 'offline': false })
      .then(res => {
        let credentials = firebase.auth.GoogleAuthProvider.credential(res.idToken);
        firebase.auth().signInWithCredential(credentials).then((info) => {
          this.toastService._showToast(`Welcome In! ${info.email}`, 3000);
          this.data.getProfile(<User>info).then(profile => {
            this.savePfofileToDB(profile);
          }).catch(err => {
            if (err == 'NP') {
              this.navCtrl.setRoot('EditProfilePage', { provider: "google", userDetails: info })
            } 
          });
          // let profile = this.data.getProfile(<User>info);
          // profile ? this.navCtrl.setRoot('TabsHomePage') : this.navCtrl.setRoot('StoreSearchPage');
        }).catch(error => {
          this.toastService._showToast(error.message, 3000);
        });
      }).catch(err => console.error('Error logging into Google', err));*/
  }

  checkUser(profile) {
    if (profile.role == "N") {
      this.toastService._showToast(`Welcome In! ${profile.email}`, 3000);
      this.savePfofileToDB(profile);
    } else {
      this.toastService._showToast(`Please login using Store App`, 3000);
      this.authService.signOut();
    }
  }



  savePfofileToDB(profile) {
    this.storage.ready().then(() => {
      this.storage.set('profile', profile).then(() => {
        this.dataService.updateDevices(profile);
        this.navCtrl.setRoot('TabsHomePage');
      });
    });
  }

}
