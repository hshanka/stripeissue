import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { User } from 'firebase/app';
import { Subscription } from 'rxjs/Subscription';

import { AuthService } from './../auth-service/auth.service';

import { ShoppingMode } from './../../../models/shoppingMode';
import { CurbSideItem } from './../../../models/curbsideItem';

@Injectable()
export class CartService {

  private authenticatedUser: User;
  private authenticatedUser$: Subscription;
  private curbsideListener;
  private shoppingModeListener;
  private cartItemExist: boolean = false;
  private curbsideListCol: AngularFirestoreCollection<CurbSideItem>;
  private shoppingModeListCol: AngularFirestoreCollection<ShoppingMode>;

  public cartCount: number = 0;
  public curbsideCount: number = 0;
  public instoreCount: number = 0;
  public sModeCount: number = 0;

  constructor(private auth: AuthService, private afs: AngularFirestore) {}

  initializeCartCOunt() {
    this.ckAuthenticatedUser().then(user => {
      this.curbsideListCol = this.afs.collection<CurbSideItem>("curbside");
      this.shoppingModeListCol = this.afs.collection<ShoppingMode>("shoppingMode");
      this.getCountOfCartItems(user);
    }).catch(err => {
      console.error(`Encountered error CCS : ${err}`);
    });
  }

  async ckAuthenticatedUser() {
    let userTmp;
    await this.auth.getAuthenticatedUser().subscribe((user: User) => {
      userTmp = user;
    })
    return userTmp;
  }

  getCountOfCartItems(user) {

    let self = this;

    this.cartCount = 0;
    this.curbsideListener = this.curbsideListCol.ref
      .where('userId', '==', user.uid)
      .onSnapshot(querySnapshot => {
        self.curbsideCount = querySnapshot.size;
        self.addCartCount();
      }, err => {
        console.error(`Encountered error CCS : ${err}`);
      });

    this.shoppingModeListener = this.shoppingModeListCol.ref
      .where('userId', '==', user.uid)
      .onSnapshot(querySnapshot => {
        self.instoreCount = querySnapshot.size;
        self.addCartCount();
      }, err => {
        console.error(`Encountered error CCS : ${err}`);
      });
  }

  addCartCount() {
    this.cartCount = this.curbsideCount + this.instoreCount;
    if (this.cartCount > 0)
      this.cartItemExist = true;
  }

  getCartCOunt() {
    return this.cartCount;
  }

  isCartExist() {
    return this.cartItemExist;
  }

}
