import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { StoreCustomListPage } from './store-custom-list';

@NgModule({
  declarations: [
    StoreCustomListPage
  ],
  imports: [
    IonicPageModule.forChild(StoreCustomListPage)
  ]
})
export class StoreCustomListPageModule {}
