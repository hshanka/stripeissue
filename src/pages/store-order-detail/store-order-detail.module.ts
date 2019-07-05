import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { StoreOrderDetailPage } from './store-order-detail';
import { PipesModule } from '../../pipes/pipes.module';

@NgModule({
  declarations: [
    StoreOrderDetailPage
  ],
  imports: [
    IonicPageModule.forChild(StoreOrderDetailPage),
    PipesModule
  ]
})
export class StoreOrderDetailPageModule {}



