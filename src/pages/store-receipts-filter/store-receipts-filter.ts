import { Component } from '@angular/core';
import { IonicPage, ViewController } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-store-receipts-filter',
  templateUrl: 'store-receipts-filter.html'
})
export class StoreReceiptsFilterPage {
  
  private start_date: any;
  private end_date: any;
  private startTimestamp: any;
  private endTimestamp: any;
  private reciptId: string;

  constructor(private view: ViewController) { }
  
  startDate(sDate) {
    this.start_date = new Date(sDate);
    this.startTimestamp = (this.start_date).getTime();
  }

  endDate(eDate) {
    this.end_date = new Date(eDate);
    this.endTimestamp = (this.end_date).getTime();
  }

  receiptId(receiptsId) {
    this.reciptId = receiptsId;
  }
  
  search() {
    if(this.reciptId != null && this.startTimestamp ==null && this.endTimestamp ==null) {
      this.view.dismiss({resId:this.reciptId});
    } else if(this.reciptId == null && this.startTimestamp != null && this.endTimestamp != null) { 
      this.view.dismiss({st:this.startTimestamp,dt:this.endTimestamp});
    } else if(this.reciptId == null && this.startTimestamp != null && this.endTimestamp == null) { 
      this.view.dismiss({st:this.startTimestamp});
    }
    //this.view.dismiss({st:this.startTimestamp,dt:this.endTimestamp});
  }
 
  reset(){
    this.view.dismiss({resetId:"1"});
  }

}
