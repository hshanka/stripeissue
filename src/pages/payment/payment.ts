import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { StripeService, LoaderService, DataService } from '../../providers'
import { Payment, Order, Users, Source, Token } from '../../models/payment'
import { Storage } from '@ionic/storage';
import { User } from 'firebase/app';

declare var Stripe;

/**
 * Generated class for the PaymentPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-payment',
  templateUrl: 'payment.html',
})
export class PaymentPage {

  card: any;
  cardNumberElement: any;
  cardExpiryElement: any;
  cardCvcElement: any;
  cartInfo: any;
  rememberMe: boolean;
  sourceId: string = "";
  token: string = "";

  paymentObject: Payment;
  userObject: Users;
  orderObject: Order;
  sourceObject: Source;
  tokenObject: Token;

  private stripeCustomerId;
  private email = "";
  private userId = "";
  private stripe: any;
  saveCardsList: any;
  payWithExistingCard: boolean = false;
  private platform_stripe_uid = "";
  private connected_stripe_uid = "";


  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public stripeService: StripeService,
    private loaderService: LoaderService,
    private storage: Storage,
    private dataService: DataService,
  ) {
    //


    this.stripe = Stripe(this.stripeService.getPublishKey())
    this.rememberMe = false;
    this.cartInfo = this.navParams.get('cartInfo');
    // this.cartInfo = {"orderId":"RALP-OI-567-1560765269891", "amount":10};


    this.storage.ready().then(() => {
      this.storage.get('profile').then((result) => {
        this.stripeService.setStripeCustomerId(result);
        //this.stripeCustomerId = result.stripe_uid;
        this.platform_stripe_uid = result.platform_stripe_uid;
        this.connected_stripe_uid = result.connected_stripe_uid;
        this.email = result.email;
        this.userId = result.uid;

        if (this.platform_stripe_uid) {
          this.getSavedCards();
        }


      }).catch((err) => {
        console.log(err);
      });
    })
  }

  paywithsavedcard(card, source:any){
    this.loaderService.show();
    this.pay(null, source);
  }

  ionViewDidLoad() {
    this.setupStripe();
    //this.setupSavedCards();

  }
  

  getSavedCards() {
    let data = {
      "user": {
        "customerId": this.platform_stripe_uid
      }
    }

    this.loaderService.show();
    this.stripeService.getSavedCards(data).then((result: any) => {
      this.loaderService.hide();
      console.log(result);
      this.saveCardsList = JSON.parse(result._body).resp.data;
    }).catch((err) => {
      this.loaderService.hide();
      console.log(err)
    });
  }

  setupSavedCards() {
    this.saveCardsList = [{"id":"src_1Eoqi2EowT6P7F4QR2gHmevQ","object":"source","amount":null,"card":{"exp_month":4,"exp_year":2024,"last4":"4242","country":"US","brand":"Visa","cvc_check":"pass","funding":"credit","fingerprint":"hZjKeUQHTpFxw0cR","three_d_secure":"optional","name":null,"address_line1_check":null,"address_zip_check":null,"tokenization_method":null,"dynamic_last4":null},"client_secret":"src_client_secret_FJTfRkIQV7V5kq3ynhsXqPkm","created":1561377102,"currency":null,"customer":"cus_FJTfvSTsoZq03B","flow":"none","livemode":false,"metadata":{},"owner":{"address":null,"email":null,"name":null,"phone":null,"verified_address":null,"verified_email":null,"verified_name":null,"verified_phone":null},"statement_descriptor":null,"status":"chargeable","type":"card","usage":"reusable"},{"id":"src_1EotKrEowT6P7F4QAuUEYu3m","object":"source","amount":null,"card":{"exp_month":5,"exp_year":2025,"last4":"1117","country":"US","brand":"Discover","cvc_check":"pass","funding":"credit","fingerprint":"q87xkHvoyoQVIAtE","three_d_secure":"not_supported","name":null,"address_line1_check":null,"address_zip_check":null,"tokenization_method":null,"dynamic_last4":null},"client_secret":"src_client_secret_FJWNNNDx5Mvd1EByxjCAlWyK","created":1561387197,"currency":null,"customer":"cus_FJTfvSTsoZq03B","flow":"none","livemode":false,"metadata":{},"owner":{"address":null,"email":null,"name":null,"phone":null,"verified_address":null,"verified_email":null,"verified_name":null,"verified_phone":null},"statement_descriptor":null,"status":"chargeable","type":"card","usage":"reusable"},{"id":"src_1EosQcEowT6P7F4QTSTUblg0","object":"source","amount":null,"card":{"exp_month":2,"exp_year":2022,"last4":"4444","country":"US","brand":"MasterCard","cvc_check":"pass","funding":"credit","fingerprint":"WACcPG5TpNkKILEu","three_d_secure":"optional","name":null,"address_line1_check":null,"address_zip_check":null,"tokenization_method":null,"dynamic_last4":null},"client_secret":"src_client_secret_FJVRJ7bUcM3EdnYU8nXxJ87S","created":1561383710,"currency":null,"customer":"cus_FJTfvSTsoZq03B","flow":"none","livemode":false,"metadata":{},"owner":{"address":null,"email":null,"name":null,"phone":null,"verified_address":null,"verified_email":null,"verified_name":null,"verified_phone":null},"statement_descriptor":null,"status":"chargeable","type":"card","usage":"reusable"}];
  }

  goBack() {
    this.navCtrl.pop();
  }

  setOutcome(result) {

    if (!result) {
      return true;
    }
    var successElement = document.querySelector('.success');
    var errorElement = document.querySelector('.error');
    successElement.classList.remove('visible');
    errorElement.classList.remove('visible');

    if (result.token) {
      // In this example, we're simply displaying the token
      successElement.querySelector('.token').textContent = result.token.id;
      successElement.classList.add('visible');

      // In a real integration, you'd submit the form with the token to your backend server
      //var form = document.querySelector('form');
      //form.querySelector('input[name="token"]').setAttribute('value', result.token.id);
      //form.submit();
    } else if (result.error) {
      errorElement.textContent = result.error.message;
      errorElement.classList.add('visible');
    }
  }



  /**
   * user: create the payload for create charge
   * @param tokenId 
   * @param sourceId 
   */
  getPayObject(tokenId = null, sourceId = null) {
    

    // todo:
    // change the currency dianamically
    // user: faizal
    this.orderObject = {
      id: this.cartInfo.orderId,
      amount: String(this.cartInfo.amount * 100),
      currency: "usd"
    }

    this.userObject = {
      id: this.userId,
      email: this.email,
      connected_stripe_uid:this.stripeService.getConnectedStripeId(),
      platform_stripe_uid: this.stripeService.getPlatformStripeId()

    }

    this.sourceObject = {
      id: sourceId
    }

    this.tokenObject = {
      id: tokenId
    }
  
    this.paymentObject = {
      token: this.tokenObject,
      source: this.sourceObject,
      order: this.orderObject,
      rememberMe: this.rememberMe,
      user: this.userObject
    }
    console.log(this.paymentObject);

    return this.paymentObject
  }


  
  savePfofileToDB(profile) {
    this.storage.ready().then(() => {
      this.storage.set('profile', profile).then((result) => {
        this.loaderService.hide();
        this.navCtrl.push('StoreOrdersPage').then(()=>{
          this.navCtrl.remove(this.navCtrl.getPrevious().index);
        });
      }).catch((err) => {
        this.loaderService.hide();
      });
    });
  }



  pay(tokenId = null, sourceId = null) {
    
    this.paymentObject = this.getPayObject(tokenId, sourceId);
    this.stripeService.createCharge(this.paymentObject).then((result) => {

       // todo
        // remove the condition 1=1
        // user: faizal
      if(this.paymentObject.rememberMe ||  1 == 1){
       
        
        this.dataService.getProfileById(this.userObject).then((result) => {
          this.savePfofileToDB(result)
          
        }).catch((err) => {
          this.loaderService.hide();
        });
      }else{
        this.loaderService.hide();
        this.navCtrl.push('StoreOrdersPage').then(()=>{
          this.navCtrl.remove(this.navCtrl.getPrevious().index);
        });
      }
      

    }).catch((err) => {
      this.loaderService.hide();
    });
  }


  setCardInfo(sourceId, stripeCustomerId) {
    
    // this.loaderService.show();
    // this.pay(null, sourceId);
    this.sourceId = sourceId;
    this.stripeCustomerId = stripeCustomerId;
    this.payWithExistingCard = true;
    this.rememberMe = false;
  }

  resetCardInfo() {
    this.sourceId = "";
    this.stripeCustomerId = "";
    this.payWithExistingCard = false;
  }


  generateSource(stripe, tokenId, cardNoElement) {
    //this.loaderService.show()
    this.stripeService.generateSource(stripe, tokenId, cardNoElement).then((resp: any) => {
      
      if (resp.error) {
        this.loaderService.hide();
        var errorElement = document.getElementById('card-errors');
        errorElement.textContent = resp.error.message;
      } else {
        this.pay(tokenId, resp.source.id)
        console.log(resp);
      }
    }).catch((err: any) => {
      this.loaderService.hide();
      console.log(err);
    })

  }

  processPayment(stripe, cardNoElement, options) {
    this.loaderService.show()
    this.stripeService.generateToken(stripe, cardNoElement, options).then((result: any) => {
      //this.loaderService.hide()
      
      if (this.rememberMe) {
        this.generateSource(stripe, result.token.id, cardNoElement)
      } else {
        this.pay(result.token.id);
      }

      console.log(result);
    }).catch((err: any) => {
      this.loaderService.hide();
    })
  }

  setupFormElements(stripe, elements) {

    let style = {
      base: {
        iconColor: '#666EE8',
        color: '#31325F',
        lineHeight: '40px',
        fontWeight: 300,
        fontFamily: 'Helvetica Neue',
        fontSize: '15px',

        '::placeholder': {
          color: '#CFD7E0',
        },
      },
    };


    this.cardNumberElement = elements.create('cardNumber', {
      style: style
    });
    this.cardNumberElement.mount('#card-number-element');

    this.cardExpiryElement = elements.create('cardExpiry', {
      style: style
    });
    this.cardExpiryElement.mount('#card-expiry-element');

    this.cardCvcElement = elements.create('cardCvc', {
      style: style
    });
    this.cardCvcElement.mount('#card-cvc-element');

    this.cardNumberElement.addEventListener('change', this.setOutcome.bind(event), false);

    this.cardExpiryElement.addEventListener('change', this.setOutcome.bind(event), false);

    this.cardCvcElement.addEventListener('change', this.setOutcome.bind(event), false);

    let form = document.getElementById('payment-form');

    form.addEventListener('submit', event => {
      event.preventDefault();
      let postal_code: any = document.getElementById('postal-code');

      console.log(this.card);

      let options = {
        address_zip: postal_code.value,
      };

      this.processPayment(stripe, this.cardNumberElement, options)

    });

  }

  setupStripe() {
    let elements = this.stripe.elements();
    this.setupFormElements(this.stripe, elements)
  }


}
