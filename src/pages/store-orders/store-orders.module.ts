import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { StoreOrdersPage } from './store-orders';

@NgModule({
  declarations: [
    StoreOrdersPage
  ],
  imports: [
    IonicPageModule.forChild(StoreOrdersPage)
  ]
})
export class StoreOrdersPageModule {}
