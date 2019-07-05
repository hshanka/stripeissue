import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { StoreReceiptsPage } from './store-receipts';
import { PipesModule } from '../../pipes/pipes.module';

@NgModule({
  declarations: [
    StoreReceiptsPage
  ],
  imports: [
    IonicPageModule.forChild(StoreReceiptsPage),
    PipesModule
  ]
})
export class StoreReceiptsPageModule {}
