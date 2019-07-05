import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';
import { AuthService, LoaderService, ToastService } from './../../providers';
import { Account } from '../../models/account';

@IonicPage()
@Component({
  selector: 'page-register',
  templateUrl: 'register.html'
})
export class RegisterPage {

  account = {} as Account;
  confirmpassword: string = '';

  constructor(
    public navCtrl: NavController,
    private authService: AuthService,
    private loaderService: LoaderService,
    private toastService: ToastService
  ) { }

  ionViewDidLoad() {
  }

  async register(account) {
    if (this.confirmpassword != this.account.password) {
      this.toastService._showToast('Password Mismatch !', 3000);
    } else {
      this.loaderService.show();
      const result: any = await this.authService.register(this.account);
      if (result.error != null) {
        this.loaderService.hide();
        this.toastService._showToast(result.error.message, 3000);
      } else {
        this.loaderService.hide();
        this.toastService._showToast('Registration Successful. Please verify your email by clicking on the link in your inbox!', 3000);
        this.goBackToLogin();
      }
    }
  }

  goBackToLogin() { 
    this.navCtrl.pop(); 
  }

}
