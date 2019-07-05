import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { StoreReceiptDetailPage } from './store-receipt-detail';

@NgModule({
  declarations: [
    StoreReceiptDetailPage
  ],
  imports: [
    IonicPageModule.forChild(StoreReceiptDetailPage)
  ]
})
export class StoreReceiptDetailPageModule {}
