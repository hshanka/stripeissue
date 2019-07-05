import { Component } from '@angular/core';
import { IonicPage } from 'ionic-angular';
import * as firebase from 'firebase';
import { AuthService, LoaderService, ToastService } from './../../providers';
import { Account } from '../../models/account';

@IonicPage()
@Component({
  selector: 'page-change-password',
  templateUrl: 'change-password.html'
})
export class ChangePasswordPage {

  account = {} as Account;
  newPassword: string = '';
  confirmPassword: string = '';
  isenabled: boolean = false;

  constructor(private authService: AuthService, private loaderService: LoaderService, private toastService: ToastService) {}

  ionViewDidLoad() {
    this.account.password = "";
  }

  async changePassword() {
    this.isenabled = false;
    if (this.account.password.length <= 0) {
      this.presentToast("Enter Old password");
      return;
    }
    if (this.newPassword.length <= 0) {
      this.presentToast("Enter New password");
      return;
    }
    if (this.confirmPassword.length <= 0) {
      this.presentToast("Enter Confirm password");
      return;
    }

    this.account.email = this.authService.getCurrentUser().email
    var self = this;
    this.loaderService.show();
    this.authService.getCurrentUser().reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(firebase.auth().currentUser.email, this.account.password
    )).then(function () {
      self.passwordValidation()
    }).catch(function (error) {
      self.presentToast("Old password is wrong");
      self.account.password = "";
      self.loaderService.hide();
    });
  }

  async passwordValidation() {
    var self = this
    if (self.confirmPassword != self.account.password) {
      if (self.confirmPassword != self.newPassword) {
        self.presentToast('Password Mismatch !');
        self.confirmPassword = "";
        self.newPassword = "";
        self.loaderService.hide();
      } else {
        const result: any = await self.authService.getCurrentUser()
        .updatePassword(self.newPassword).then(function () {
          self.presentToast('Updated Password Successfully');
          self.account.password = "";
          self.confirmPassword = "";
          self.newPassword = "";
          self.loaderService.hide();
        }).catch(function (error) {
          self.presentToast(error.message);
          self.account.password = "";
          self.confirmPassword = "";
          self.newPassword = "";
          self.loaderService.hide();
        });
      }
    } else {
      self.presentToast('Password must not be same as old password');
      self.confirmPassword = "";
      self.newPassword = "";
      self.loaderService.hide();
    }
  }

  onVerifyChange(e) {
    if (this.account.password.length > 0 &&
      this.confirmPassword.length > 0 && this.newPassword.length > 0) {
    } 
  }

  // Configure Toast
  presentToast(text) {
    this.toastService.custom(text);
  }

}
