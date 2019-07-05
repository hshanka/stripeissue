import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AddCardsPage } from './add-cards';

@NgModule({
  declarations: [
    AddCardsPage,
  ],
  imports: [
    IonicPageModule.forChild(AddCardsPage),
  ],
})
export class AddCardsPageModule {}
