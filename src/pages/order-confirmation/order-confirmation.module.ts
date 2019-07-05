import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { OrderConfirmationPage } from './order-confirmation';
import { PipesModule } from '../../pipes/pipes.module';

@NgModule({
  declarations: [
    OrderConfirmationPage
  ],
  imports: [
    IonicPageModule.forChild(OrderConfirmationPage),
    PipesModule
  ]
})
export class OrderConfirmationPageModule {}
