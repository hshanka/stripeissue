import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CustomNotesPage } from './custom-notes';

@NgModule({
  declarations: [
    CustomNotesPage
  ],
  imports: [
    IonicPageModule.forChild(CustomNotesPage)
  ]
})
export class CustomNotesPageModule {}
