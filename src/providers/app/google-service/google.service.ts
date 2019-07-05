import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable()
export class GoogleService {

  public url: string;
  public apiKey: string;

  constructor(public http: Http) {}

  getPlaceSearchDetailsByLocation(keyword, lat, long) {
    let link = 'https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + keyword + '&location=' + lat + ',' + long + '&radius=10000&key=AIzaSyCXoadpcxrX-M88DytYIAaUK_Jk2tmROxY';
    // let link = this.url+data+'&format=json&apiKey='+this.apiKey;
    let response = this.http.get(link).map(res => res.json());
    return response;
  }

  getPlaceSearchDetails(keyword) {
    let link = 'https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + keyword + '&key=AIzaSyCXoadpcxrX-M88DytYIAaUK_Jk2tmROxY';
    // let link = this.url+data+'&format=json&apiKey='+this.apiKey;
    let response = this.http.get(link).map(res => res.json());
    return response;
  }

  getPlaceDetails(keyword) {
    let link = 'https://maps.googleapis.com/maps/api/place/details/json?placeid=' + keyword + '&key=AIzaSyCXoadpcxrX-M88DytYIAaUK_Jk2tmROxY';
    // let link = this.url+data+'&format=json&apiKey='+this.apiKey;
    let response = this.http.get(link).map(res => res.json());
    return response;
  }

}
