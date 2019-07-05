import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-profile',
  templateUrl: 'profile.html'
})
export class ProfilePage {

  private avatar = "";

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
  ) {
    
  }

  

  
  navigateToAddPayments(){
    this.navCtrl.push('AddCardsPage');
  }

 


  

}
