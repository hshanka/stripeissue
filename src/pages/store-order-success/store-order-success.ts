import { Component } from '@angular/core';
import { IonicPage, NavParams } from 'ionic-angular';

@IonicPage()
@Component({
	selector: 'page-store-order-success',
	templateUrl: 'store-order-success.html'
})
export class StoreOrderSuccessPage {

	private totalAmount: number;

	constructor(public navParams: NavParams) {
		this.totalAmount = navParams.get('total');
	}

}
