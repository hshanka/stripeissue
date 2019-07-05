import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { HTTP } from '@ionic-native/http';
import { Http, Headers, RequestOptions } from '@angular/http';

@Injectable()
export class StripeService {
  private config:any;

  publicKey: any;
  baseURL: any;
  options:any;
  stripeCustomerid:any
  private platform_stripe_uid = "";
  private connected_stripe_uid = "";
  // api:any;

  constructor(
    private storage: Storage,
    //private http: HTTP,
    private http: Http,
    //private constant: AppConstant
    //private stripe: Stripe
  ) {
    //this.config = this.constant.config;
    //this.publicKey =  this.config[this.config.enviroment].stripe_public_key;
   
    this.publicKey = "pk_test_dgK3YDwVWxroykVLR9RJVeqU00mpIrY3w8";
    //this.publicKeyd = "pk_live_ofKtlUqSvsE9euoDW6SNrCF100dBhKGs6k";
    
    this.baseURL = "http://localhost:3000";
    //this.baseURL = "https://6jesung7pi.execute-api.us-east-1.amazonaws.com/dev";


    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    this.options = new RequestOptions({headers: headers});
    
  }

  getConnectedStripeId(){
    return this.connected_stripe_uid;
  }

  getPlatformStripeId(){
    return this.platform_stripe_uid;
  }

  setStripeCustomerId(data){
    this.connected_stripe_uid = data.connected_stripe_uid
    this.platform_stripe_uid = data.platform_stripe_uid
  }

  getPublishKey() {
    return this.publicKey;
  }

  generateSource(stripe, tokenId, cardNoElement) {
    return new Promise((resove: any, reject: any) => {
      stripe.createSource(cardNoElement).then(resp => {
        resove(resp);
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  generateToken(stripe, cardNoElement, options = null) {

    return new Promise((resove: any, reject: any) => {
      
      stripe.createToken(cardNoElement, options).then((resp: any) => {
        resove(resp);
      }).catch((err: any) => {
        reject(err);
      });
    });

  }

  createCustomer(data){
    return new Promise((resolve, reject) => {
      // this.http.setHeader('*', 'Content-Type', 'application/json');
      // this.http.setDataSerializer('json');
      this.http.post(this.baseURL + '/create-customer',data, this.options).toPromise().then(result=> {
        console.log(result);
        resolve(result);
      }).catch((err) => {
        console.log(err);
        reject(err);
      });
    })
  }

  createCharge(data){
    return new Promise((resolve, reject) => {
      // this.http.setHeader('*', 'Content-Type', 'application/json');
      // this.http.setDataSerializer('json');
      this.http.post(this.baseURL + '/create-charge',data, this.options).toPromise().then(result=> {
        console.log(result);
        resolve(result);
      }).catch((err) => {
        console.log(err);
        reject(err);
      });
    })
  }

  getSavedCards(data){
    
    return new Promise((resolve, reject) => {
      // this.http.setHeader('*', 'Content-Type', 'application/json');
      // this.http.setDataSerializer('json');
      this.http.post(this.baseURL + '/list-cards',data, this.options).toPromise().then(result=> {
        console.log(result);
        resolve(result);
      }).catch((err) => {
        console.log(err);
        reject(err);
      });
    })
  }

}