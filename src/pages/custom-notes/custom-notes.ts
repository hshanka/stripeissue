import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-custom-notes',
  templateUrl: 'custom-notes.html'
})
export class CustomNotesPage {

  private isEditable: boolean = false;
  private isTab: boolean = true;
  private customNotes: string;

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController) {
    this.customNotes = navParams.get('customNote');
    if(navParams.get('isEditable') == 'Y'){
      this.isEditable = true;
    }
  }

  ionViewWillLeave() {
    this.resetFields();
    // if(this.isTab){
    //   this.navCtrl.popToRoot();
    // }
  }

  resetFields() {
  }

  goBack() {
  }
  
  saveCustomNotes(){
    this.viewCtrl.dismiss(this.customNotes);
  }

  cancelCustomNotes(){
    this.viewCtrl.dismiss();
  }

}
