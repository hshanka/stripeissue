import { Component } from '@angular/core';
import { IonicPage, ViewController } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-pay-options-modal',
  templateUrl: 'pay-options-modal.html'
})
export class PayOptionsModalPage {

  constructor(public viewCtrl: ViewController) {
  }

  cancelPayOptions() { 
  	this.viewCtrl.dismiss(); 
  }

  selectedOption(type) { 
  	this.viewCtrl.dismiss(type); 
  }

}
