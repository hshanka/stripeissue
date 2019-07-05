import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PartnerStoreListPage } from './partner-store-list';

@NgModule({
  declarations: [
    PartnerStoreListPage
  ],
  imports: [
    IonicPageModule.forChild(PartnerStoreListPage)
  ]
})
export class PartnerStoreListPageModule {}
