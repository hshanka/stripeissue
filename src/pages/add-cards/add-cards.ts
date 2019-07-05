import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';
import { StripeService, LoaderService, ToastService } from '../../providers'
import { IAddCard } from '../../models/addCard';
import { Platform } from 'ionic-angular'
declare var Stripe;


/**
 * Generated class for the AddCardsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-add-cards',
  templateUrl: 'add-cards.html',
})
export class AddCardsPage {

  publicKey:any;
  stripe:any;
  cardNumberElement: any;
  cardExpiryElement: any;
  cardCvcElement: any;
  addCard:IAddCard.CardObject;
  userObj:IAddCard.User;
  tokenObj:IAddCard.Token;
  sourceObj:IAddCard.Source;
  
  userProfile:any;
  token:any;
  source:any;
  savedCardsList = [];
  
  constructor(
    public platform : Platform,
    public navCtrl: NavController,
    public stripeService: StripeService,
    private loaderService: LoaderService,
    private toastService: ToastService
    
    ) {
    this.publicKey = this.stripeService.getPublishKey();
    this.stripe = Stripe(this.publicKey);
  }

  ionViewWillLeave() {
    this.navCtrl.pop()
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
      console.log(result.token);

    } else if (result.error) {
      errorElement.textContent = result.error.message;
      errorElement.classList.add('visible');
    }
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


      let options = {
        address_zip: postal_code.value,
      };
      

      this.loaderService.show()
      this.createToken(stripe, this.cardNumberElement, options)
        .then((result:any) => {
          this.token = result.token.id;
          console.log("token",  this.token );
          return this.createSource(stripe, this.token, this.cardNumberElement);
        })
        .then((result:any) => {
          this.source = result.source.id
          console.log("source",  this.source );
          this.loaderService.hide();
        })
        .catch((err:any) => {
          this.loaderService.hide();
          this.toastService.custom(
            "Something went wrong"
          );
        })
    });

  }



  
  createToken(stripe, cardNoElement, options) {
    return new Promise((resove: any, reject: any) => {
      this.stripeService.generateToken(stripe, cardNoElement, options).then((result: any) => {
        resove(result);
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  createSource(stripe, tokenId, cardNoElement){
    return new Promise((resove: any, reject: any) => {
      this.stripeService.generateSource(stripe, tokenId, cardNoElement).then((resp: any) => {
      
        if (resp.error) {
          reject()
        }else{
          resove(resp)
        }
    });
  })
}

  setupStripe() {
    let elements = this.stripe.elements();
    this.setupFormElements(this.stripe, elements)
  }

  



}
