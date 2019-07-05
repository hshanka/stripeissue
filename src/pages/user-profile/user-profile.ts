import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';
import { User } from 'firebase/app';
import { AngularFireAuth } from 'angularfire2/auth';
import firebase from 'firebase';
// import { Facebook, FacebookLoginResponse } from '@ionic-native/facebook';
// import { GooglePlus } from '@ionic-native/google-plus';
import { Subscription } from 'rxjs/Subscription';
import { AuthService, LoaderService, ToastService } from './../../providers';
import { Account } from '../../models/account';

@IonicPage()
@Component({
  selector: 'page-user-profile',
  templateUrl: 'user-profile.html'
})
export class UserProfilePage {

  private authenticatedUser: User;
  private authenticatedUser$: Subscription;
  private emailLinking: boolean;

  account = {} as Account;

  constructor(public navCtrl: NavController, 
    public navParams: NavParams, 
    private authFire: AngularFireAuth, 
    private authService: AuthService,
    private loaderService: LoaderService,
    private toastService: ToastService 
    // private fb: Facebook,
    // private googlePlus: GooglePlus
    ) {
    try {
      this.authenticatedUser$ = this.authService.getAuthenticatedUser().subscribe((user: User) => {
        this.authenticatedUser = user;
      })
    } catch (e) { }
  }

  ionViewDidLoad() {
    this.emailLinking = false;
  }

  fbLink() {
    /*this.fb.login(['public_profile', 'user_friends', 'email'])
      .then((res: FacebookLoginResponse) => {
        let credentials = firebase.auth.FacebookAuthProvider.credential(res.authResponse.accessToken);
        firebase.auth().currentUser.linkWithCredential(credentials).then((info) => {
          this.toastService.custom(`Facebook Linking  Successful`);
        }).catch(error => {
          this.toastService.custom(err.message);
        });
      }).catch(err => {
        console.error(`Encountered error UP : ${err}`);
      });*/
  }

  googleLink() {
    /*this.googlePlus.login({ 'webClientId': '1086163179887-lnail39vrvjqtq5jv33mm0e02788s6oi.apps.googleusercontent.com', 'offline': false })
      .then(res => {
        let credentials = firebase.auth.GoogleAuthProvider.credential(res.idToken);
        firebase.auth().currentUser.linkWithCredential(credentials).then((info) => {
          this.toastService.custom(`Google Linking  Successful`);
        }).catch(err => {
          console.error(`Encountered error UP : ${err}`);
          this.toastService.custom(err.message);
        });
      }).catch(err => {
        console.error(`Encountered error UP : ${err}`);
      });*/
  }

  emailLink() {
    this.emailLinking = true;
  }

  linkUser() {
    if (this.account.email && this.account.password) {
      var credential = firebase.auth.EmailAuthProvider.credential(this.account.email, this.account.password);
      firebase.auth().currentUser.linkWithCredential(credential).then((user) => {
        this.toastService.custom(`Email Linking  Successful`);
        this.emailLinking = false;
      }).catch(err => {
        console.error(`Encountered error UP : ${err}`);
        this.toastService.custom(err.message);
        this.emailLinking = false;
      });
    } else {
      this.toastService.custom('Please enter valid credentials');
    }
  }

}
