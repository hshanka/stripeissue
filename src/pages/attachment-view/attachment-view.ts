import { Component } from '@angular/core';
import { IonicPage, NavParams, ViewController } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-attachment-view',
  templateUrl: 'attachment-view.html'
})
export class AttachmentViewPage {

  private attachment;

  constructor(public navParams: NavParams, public viewCtrl: ViewController) {
    this.attachment = navParams.get('attachment');
  }

  cancelAttachmentView(){
    this.viewCtrl.dismiss();
  }

}
