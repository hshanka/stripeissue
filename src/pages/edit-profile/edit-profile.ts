import { Component, EventEmitter, Output } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs/Subscription';
import { User } from 'firebase/app';
import { AuthService, DataService, GuestService, LoaderService, fcmService } from './../../providers';
import { Profile } from '../../models/profile';

@IonicPage()
@Component({
  selector: 'page-edit-profile',
  templateUrl: 'edit-profile.html'
})
export class EditProfilePage {

  profile = {} as Profile;
  private authenticatedUser: User;
  private authenticatedUser$: Subscription;

  private avatar = "";
  private userDetails;
  private profileForm: FormGroup;

  private provider: string;
  // private isTab: boolean = true;
  @Output() saveProfileResult: EventEmitter<Boolean>;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private formBuilder: FormBuilder,
    private storage: Storage,
    private authService: AuthService,
    private dataService: DataService,
    private guestService: GuestService,
    private loaderService: LoaderService,
    private fcmService: fcmService
    ) {

    this.saveProfileResult = new EventEmitter<Boolean>();
    this.authenticatedUser$ = this.authService.getAuthenticatedUser().subscribe((user: User) => {
      this.authenticatedUser = user;
    })

    this.userDetails = navParams.get('userDetails');
    this.provider = navParams.get('provider');
    this.profileForm = formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: ['', Validators.required],
      dateOfBirth: ['']
    });

  }

  ionViewWillEnter() {
    // this.setValues();
  }

  ionViewWillLeave() {
    this.resetFields();
    // if(this.isTab){
    //   this.navCtrl.popToRoot();
    // }
  }

  resetFields() { 
    this.authenticatedUser$.unsubscribe(); 
  }

  // goBack() {
  // this.isTab =false;
  // this.navCtrl.pop();
  // }

  // setValues() {
  //   if (this.provider == "facebook" || this.provider == "google") {
  //     this.avatar = this.userDetails.photoURL;
  //     this.profile.firstName = this.userDetails.displayName;
  //     this.profile.phone = this.userDetails.phoneNumber;
  //   }
  // }

  async saveProfile() {
    this.loaderService.show();
    if (this.authenticatedUser) {
      this.fcmService.getDeviceToken().then(token => {
        var profileData = {
          dob: this.profileForm.controls['dateOfBirth'].value,
          email: this.authenticatedUser.email,
          firstName: this.profileForm.controls['firstName'].value,
          lastName: this.profileForm.controls['lastName'].value,
          phone: this.profileForm.controls['phone'].value,
          role: "N",
          status: "0",
          storeId: "",
          uid: this.authenticatedUser.uid,
          avatar: this.avatar,
          devices: [token]
        }
        this.dataService.saveProfile(profileData).then(result => {
          if (result) {
            // this.isTab =false;
            this.guestService.transferGuestItemsToLogged(this.authenticatedUser.uid);
            this.saveProfileInStorage(profileData);
          }
        }).catch(err => {
          console.error(`Encountered error EP : ${err}`);
        })
      })
      
    }
  }

  saveProfileInStorage(profile) {
    this.storage.ready().then(() => {
      this.storage.set('profile', profile).then(success => {
        // this.navCtrl.push('AddPreferredStorePage', { storeStatus: 'profile' });
        // this.navCtrl.setRoot('TabsHomePage');
        this.navCtrl.parent.select(0);
        this.loaderService.hide();
      }).catch(err => {
        console.error(`Encountered error EP : ${err}`);
      })
    });
  }

}
