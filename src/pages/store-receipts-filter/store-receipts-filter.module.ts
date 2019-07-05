import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { StoreReceiptsFilterPage } from './store-receipts-filter';

@NgModule({
  declarations: [
    StoreReceiptsFilterPage
  ],
  imports: [
    IonicPageModule.forChild(StoreReceiptsFilterPage)
  ]
})
export class StoreReceiptsFilterPageModule {}
