import { Injectable } from '@angular/core';
import { Http,  Headers, RequestOptions } from '@angular/http';
import { HTTP } from '@ionic-native/http';
import { Platform } from 'ionic-angular';


@Injectable()
export class AlgoliaService {

  // private apiUrl = 'http://ec2-52-205-250-191.compute-1.amazonaws.com:3000/api/algolia/getProductListSearch'; //live
  private apiUrl = 'http://ec2-52-205-250-191.compute-1.amazonaws.com:3000/api_test/algolia/getProductListSearch';  //test
  private options:any;
  constructor(
    public nativeHttp: HTTP,
    private platform: Platform,
    private angularHttp: Http
  ) {

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    this.options = new RequestOptions({headers: headers});
   }

  getProductList(storeId, searchValue, pageNumber): any {

    let body = {
      "storeId": storeId,
      "queryValue": searchValue,
      "pageCount": 10,
      "pageNumber": pageNumber
    };
    
    return new Promise((resolve, reject) => {
      this.angularHttp.post(this.apiUrl, body, '').toPromise().then((result) => {
        resolve(result);
      }).catch((err) => {
        reject(err);
      });
    });
    // if (this.platform.is('core') || this.platform.is('mobileweb')) {
    //   return new Promise((resolve, reject) => {
    //     try {
    //       this.angularHttp.post(this.apiUrl, body, '').take(1).map(doc => doc.json()).toPromise().then(data => {
    //         resolve({ 'data': data, 'core': true  })
    //       })
    //     } catch (error) {
    //       console.log(error);
    //     }
    //   })
    // } else {
    //   return this.nativeHttp.post(this.apiUrl, body, '');
    // }
  }
}
