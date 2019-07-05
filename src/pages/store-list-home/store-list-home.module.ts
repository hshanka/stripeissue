import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { StoreListHomePage } from './store-list-home';
import { SuperTabsModule } from 'ionic2-super-tabs';


@NgModule({
  declarations: [
    StoreListHomePage
  ],
  imports: [
    SuperTabsModule,
    IonicPageModule.forChild(StoreListHomePage)
  ]
})
export class StoreListHomePageModule {}
