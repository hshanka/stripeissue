import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { User } from 'firebase/app';
import "rxjs/add/operator/take";

import { Profile } from './../../../models/profile';
import { Storage } from '@ionic/storage';

@Injectable()
export class DataService {

  profileObject: AngularFirestoreCollection<Profile>

  constructor(
    private afs: AngularFirestore,
    private storage: Storage
    ) {}

  async saveProfile_test(profileData) {
    this.profileObject = this.afs.collection(`userProfile`);
    try {
      await this.profileObject.add(profileData).then(function () {
        return true;
      }).catch(function (err) {
        console.error(`Encountered error DS : ${err}`);
        return false;
      });
    } catch (err) {
      console.error(`Encountered error DS : ${err}`);
      return false;
    }
  }

  updateDevices(profile){
    const userRef = this.afs.collection('userProfile').ref.where('uid', '==', profile.uid)
    this.storage.get('deviceToken').then(token=>{
      this.storage.get('profile').then(profile=>{
        if(profile){
          if(profile.devices.length){
            profile.devices[0] = token
          }else{
            profile.devices.push(token)
          }
          this.storage.set('profile', profile)
          userRef.get().then(data=>{
            data.docs.map(m=>{
              this.afs.collection('userProfile').doc(`/${m.id}`).update(profile);
            })
          })
        }
        
      })
    })


    // return new Promise(function(resolve, reject){
    //   const userRef = this.afs.collection('userProfile').ref.where('uid', '==', user.uid)
    //   this.db.runTransaction(transaction => {
    //     // This code may get re-run multiple times if there are conflicts.
    //     transaction.get(userRef).then(doc => {
    //       if (!doc.data().devices) {
    //         transaction.set({
    //           devices: ["devices"]
    //         });
    //       } else {
    //         const devices = doc.data().devices;
    //         devices.push(devices);
    //         transaction.update(userRef, { devices: devices });
    //       }
    //     });
    //   }).then(function () {
    //     console.log("Transaction successfully committed!");
    //   }).catch(function (error) {
    //     console.log("Transaction failed: ", error);
    //   });
    // })
  }

  saveProfile(profileData) {
    return new Promise((resolve, reject) => {
      this.afs.collection('userProfile').add(profileData).then(function (data) {
        resolve(data)
      }).catch(function (err) {
        console.error(`Encountered error DS : ${err}`);
        reject(err);
      });
    })
    // var observer = this.afs.collection('userProfile').ref.where('uid', '==', user.uid)
    //   .onSnapshot(querySnapshot => {
    //     observer();  
    //     if(querySnapshot.size > 0){
    //       querySnapshot.forEach(function (doc) {
    //         resolve(doc.data());
    //       });
    //     }else{
    //       reject('NP');
    //     }
    //   }, err => {
          // console.error(`Encountered error DS : ${err}`);
    //     reject(err);
    //   });
  }

  async getProfileById(user){
    return new Promise((resolve, reject) => {
        var observer = this.afs.collection('userProfile').ref.where('uid', '==', user.id)
        .onSnapshot(querySnapshot => {
          observer();
          if (querySnapshot.size > 0) {
            querySnapshot.forEach(function (doc) {
              resolve(doc.data());
            });
          } else {
            reject('NP');
          }
        }, err => {
          console.error(`Encountered error DS : ${err}`);
          reject(err);
        });
    })
  }

  async getProfile(user: User) {
    return new Promise((resolve, reject) => {
      var observer = this.afs.collection('userProfile').ref.where('uid', '==', user.uid)
        .onSnapshot(querySnapshot => {
          observer();
          if (querySnapshot.size > 0) {
            querySnapshot.forEach(function (doc) {
              resolve(doc.data());
            });
          } else {
            reject('NP');
          }
        }, err => {
          console.error(`Encountered error DS : ${err}`);
          reject(err);
        });
    })
  }

}
