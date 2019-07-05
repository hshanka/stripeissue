import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import { ToastController } from 'ionic-angular';
import firebase from 'firebase';

import { Account } from './../../../models/account';

@Injectable()
export class AuthService {

  constructor(private auth: AngularFireAuth) {}

  async signInWithEmailAndPassword(account: Account) {
    try {
      return {
        result: await this.auth.auth.signInWithEmailAndPassword(account.email, account.password)
      }
    } catch (e) {
      console.error(e);
      return {
        error: e
      };
    }
  }

  async register(account: Account) {
    try {
      return {
        result: await this.createEmailWithVerification(account)
      }
    } catch (e) {
      console.error(e);
      return {
        error: e
      };
    }
  }

  createEmailWithVerification(account: Account) {
    return new Promise((resolve, reject) => {
      this.auth.auth.createUserWithEmailAndPassword(account.email, account.password)
        .then(result => {
          let user = firebase.auth().currentUser;
          return user.sendEmailVerification();
        }).then((response) => {
          resolve();
        }).catch(err => {
          reject(err);
        })
    })
  }

  getAuthenticatedUser() {
    return this.auth.authState;
  }

  getCurrentUser() {
    return firebase.auth().currentUser;
  }

  signOut() {
    this.auth.auth.signOut();
  }

}
