import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PayOptionsModalPage } from './pay-options-modal';

@NgModule({
  declarations: [
    PayOptionsModalPage
  ],
  imports: [
    IonicPageModule.forChild(PayOptionsModalPage)
  ]
})
export class PayOptionsModalPageModule {}
