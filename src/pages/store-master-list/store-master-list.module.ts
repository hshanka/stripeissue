import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { StoreMasterListPage } from './store-master-list';
import { PipesModule } from '../../pipes/pipes.module';

@NgModule({
  declarations: [
    StoreMasterListPage,
  ],
  imports: [
    IonicPageModule.forChild(StoreMasterListPage),
    PipesModule
  ],
})
export class StoreMasterListPageModule {}
