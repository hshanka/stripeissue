import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-coupons-rewards',
  templateUrl: 'coupons-rewards.html'
})
export class CouponsRewardsPage {

  private isTab: boolean = true;

  constructor(public navCtrl: NavController) {
  }

  ionViewDidLoad() { }

  ionViewWillLeave() {
    this.resetFields();
    if(this.isTab){
      this.navCtrl.popToRoot();
    }   
  }

  resetFields() {
  }

  goBack() {
    this.isTab = false;
    this.navCtrl.pop();
  }

}
