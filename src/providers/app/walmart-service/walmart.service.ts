import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable()
export class WalmartService {

  public url: string;
  public apiKey: string;

  constructor(public http: Http) {}

  getProductDetaisByKeyword(keyword) {
    let link = 'http://api.walmartlabs.com/v1/search?query=' + keyword + '&format=json&apiKey=ffqmhs47yejn9b46t9a68ex8';
    let response = this.http.get(link).map(res => res.json());
    return response;
  }

  getProductDetaisByUPC(upcValue) {
    let link = 'http://api.walmartlabs.com/v1/items?apiKey=ffqmhs47yejn9b46t9a68ex8&upc=' + upcValue;
    let response = this.http.get(link).map(res => res.json());
    return response;
  }

}
