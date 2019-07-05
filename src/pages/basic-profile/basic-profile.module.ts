import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { BasicProfilePage } from './basic-profile';

@NgModule({
  declarations: [
    BasicProfilePage
  ],
  imports: [
    IonicPageModule.forChild(BasicProfilePage)
  ]
})
export class BasicProfilePageModule {}
