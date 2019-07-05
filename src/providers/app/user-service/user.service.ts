import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { fcmService } from "./../../utils/fcm-service/fcm.service";

@Injectable()
export class UserService {

  constructor(private storage: Storage, private fcmService: fcmService) {}

  getUUID() {
    return new Promise((resolve, reject) => {
      try {
        this.storage.ready().then(() => {
          this.storage.get('profile').then((data) => {
            if (data != null) {
              resolve(data.uid);
            } else {
              this.createGuestUser().then(data => {
                resolve(data);
              }).catch(error => {

              })
            }
          });
        });
      } catch (e) { 
        reject(e) 
      }
    })
  }

  private createGuestUser() {
    return new Promise((resolve, reject) => {
      try {
        this.storage.ready().then(() => {
          this.storage.get('userId').then(guestData => {
            if (guestData != null) {
              resolve(guestData);
            } else {
              let uuid = 'gst_' + this.fcmService.generateUUID();
              this.storage.set('userId', uuid).then(data => {
                resolve(uuid);
              })
            }
          }).catch(error => {
          })
        })
      } catch (error) {
      }
    })
  }

  checkGuestAccount() {
    return new Promise((resolve, reject) => {
      try {
        this.storage.ready().then(() => {
          this.storage.get('userId').then(guestData => {
            if (guestData != null) {
              resolve(guestData);
            } else {
              resolve();
            }
          }).catch(error => {
          })
        })
      } catch (error) {
      }
    })
  }

  saveProfileToDB(profile) {
    return new Promise((resolve, reject) => {
      this.storage.ready().then(() => {
        this.storage.set('profile', profile).then((result) => {
          resolve(result);
        }).catch((err) => {
          reject(err);
        })
      });
    });
   
  }

}
