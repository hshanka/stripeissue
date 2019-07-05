import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ShoppingModePage } from './shopping-mode';

@NgModule({
  declarations: [
    ShoppingModePage
  ],
  imports: [
    IonicPageModule.forChild(ShoppingModePage)
  ]
})
export class ShoppingModePageModule {}
