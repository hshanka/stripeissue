import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PersonalCartPage } from './personal-cart';
import { PipesModule } from '../../pipes/pipes.module';

@NgModule({
  declarations: [
    PersonalCartPage
  ],
  imports: [
    IonicPageModule.forChild(PersonalCartPage),
    PipesModule
  ]
})
export class PersonalCartPageModule {}
