import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PreferredStoreListPage } from './preferred-store-list';

@NgModule({
  declarations: [
    PreferredStoreListPage
  ],
  imports: [
    IonicPageModule.forChild(PreferredStoreListPage)
  ]
})
export class PreferredStoreListPageModule {}
