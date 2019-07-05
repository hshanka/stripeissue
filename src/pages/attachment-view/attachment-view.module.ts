import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AttachmentViewPage } from './attachment-view';

@NgModule({
  declarations: [
    AttachmentViewPage
  ],
  imports: [
    IonicPageModule.forChild(AttachmentViewPage)
  ]
})
export class AttachmentViewPageModule {}
