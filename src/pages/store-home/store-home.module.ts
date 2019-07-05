import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { StoreHomePage } from './store-home';
import { PipesModule } from '../../pipes/pipes.module';
 
@NgModule({
  declarations: [
    StoreHomePage
  ],
  imports: [
    IonicPageModule.forChild(StoreHomePage),
    PipesModule
  ]
})
export class StoreHomePageModule {}
