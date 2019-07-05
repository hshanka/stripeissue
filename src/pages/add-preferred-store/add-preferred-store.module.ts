import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AddPreferredStorePage } from './add-preferred-store';

@NgModule({
  declarations: [
    AddPreferredStorePage
  ],
  imports: [
    IonicPageModule.forChild(AddPreferredStorePage)
  ]
})
export class AddPreferredStorePageModule {}
