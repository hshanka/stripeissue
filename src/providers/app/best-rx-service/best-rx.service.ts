import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { Http, Headers, RequestOptions } from '@angular/http';
import { HTTP } from '@ionic-native/http';

@Injectable()
export class BestRxService {

  constructor(private platform: Platform, private angularHttp: Http, public nativeHttp: HTTP) {}

  private apiUrl: string = 'https://posservice.bestrxconnect.com/';
  private apiCred: string = '53aacc42ba7634b7b981aebc560e71d5';
  private userName: string = 'xoomcart';

  // private pharmacyNumber: number = 1234567890; //test
  private pharmacyNumber: number = 1346657129; //live

  checkProductCount(itemSku): any {

    let getItemApi = this.apiUrl + 'getItemdetails';

    let body = {
      "PharmacyNumber": this.pharmacyNumber,
      "APIKey": 'G6s5cZSiZp',
      "ItemSKUInfo": itemSku
    };

    // var headers = new Headers();
    // headers.append('Content-Type', 'application/json');
    // headers.append("Authorization", "Basic " + btoa(this.userName + ":" + this.apiCred));

    // const requestOptions = new RequestOptions({ headers: headers });

    if (this.platform.is('core') || this.platform.is('mobileweb')) {
      return new Promise((resolve, reject) => {
        try {
          // this.angularHttp.post(getItemApi, body, requestOptions).take(1).map(doc => doc.json()).toPromise().then(data => {
          //   resolve({ 'data': data, 'core': true })
          // })
          resolve({ 'data': '', 'core': true });
        } catch (err) {
          reject(err);
        }
      })
    } else {
      let auth = this.nativeHttp.getBasicAuthHeader(this.userName, this.apiCred);

      this.nativeHttp.setHeader('*', 'Content-Type', 'application/json');
      this.nativeHttp.setHeader('*', 'Authorization', auth.Authorization);
      this.nativeHttp.setDataSerializer('json');

      return this.nativeHttp.post(getItemApi, body, '');
    }
  }

}
