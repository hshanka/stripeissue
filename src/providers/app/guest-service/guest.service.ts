import { Injectable } from '@angular/core';
import { AngularFirestore } from 'angularfire2/firestore';
import { UserService } from './../user-service/user.service';

@Injectable()
export class GuestService {

  private uuid: string = '';

  constructor(private afs: AngularFirestore, private userService: UserService) {}

  transferGuestItemsToLogged(uuid) {
    this.uuid = uuid;
    this.userService.checkGuestAccount().then((data) => {
      if (data && data != '') {
        this.transferCurbsideToLoggedAccount(data);
        this.transferMasterToLoggedAccount(data);
        this.transferInstoreToLoggedAccount(data);
      }
    })
  }

  private transferCurbsideToLoggedAccount(guestId) {
    let curbsideTmp: Array<any> = [];
    let curbsideOberver = this.afs.collection('curbside').ref.where('userId', '==', guestId).onSnapshot(snap => {
      curbsideOberver();
      if (snap.size > 0) {
        snap.forEach(data => {
          let documentId = data.id;
          curbsideTmp.push({ documentId, ...data.data() });
        })
        this._transferCurbsideToLoggedAccount(curbsideTmp);
      }
    })
  }

  private _transferCurbsideToLoggedAccount(curbsideTmp) {
    curbsideTmp.forEach(element => {
      var curbTmp = this.afs.collection('curbside').ref
        .where('userId', '==', this.uuid)
        // .where('userId', '==', '2B3HXryZWhaWo1w36kx1b1AO1Ef2')
        .where('materialId', '==', element.materialId)
        .where('storeId', '==', element.storeId)
        .onSnapshot(querySnapshot => {
          curbTmp();
          if (querySnapshot.size > 0) {
            querySnapshot.forEach(el => {
              console.log('_transferCurbsideToLoggedAccount');
              console.log(el);
              let documentId = el.id;
              this._transferCurbsideUpdate({ documentId, ...el.data() }, element);
            })
          } else {
            this._transferCurbsideSave(element);
          }
        }, err => {
          console.error(`Encountered error EP : ${err}`);
        });
    });
  }

  private _transferCurbsideSave(fromValue) {
    this.afs.collection('curbside').add({
      'storeId': fromValue.storeId,
      'userId': this.uuid,
      'intExt': fromValue.intExt,
      'materialId': fromValue.materialId,
      'quantity': fromValue.quantity
    }).then(suc => {
      this.afs.collection('curbside').doc(fromValue.documentId).delete().catch(err => {
        console.log(err);
      })
    }).catch(err => {
      console.log(err);
    })
  }

  private _transferCurbsideUpdate(toValue, fromValue) {
    this.afs.collection('curbside').doc(toValue.documentId).update({
      'quantity': toValue.quantity + fromValue.quantity
    }).then(suc => {
      this.afs.collection('curbside').doc(fromValue.documentId).delete().catch(err => {
        console.log(err);
      })
    }).catch(error => {
      console.log(error);
    })
  }

  private transferInstoreToLoggedAccount(guestId) {
    let instoreTmp: Array<any> = [];
    let instoreOberver = this.afs.collection('instore').ref.where('userId', '==', guestId).onSnapshot(snap => {
      instoreOberver();
      if (snap.size > 0) {
        snap.forEach(data => {
          let documentId = data.id;
          instoreTmp.push({ documentId, ...data.data() });
        })
        this._transferInstoreToLoggedAccount(instoreTmp);
      }
    })
  }

  private _transferInstoreToLoggedAccount(instoreTmp) {
    instoreTmp.forEach(element => {
      var insTmp = this.afs.collection('instore').ref
        .where('userId', '==', this.uuid)
        // .where('userId', '==', '2B3HXryZWhaWo1w36kx1b1AO1Ef2')
        .where('materialId', '==', element.materialId)
        .where('storeId', '==', element.storeId)
        .onSnapshot(querySnapshot => {
          insTmp();
          if (querySnapshot.size > 0) {
            querySnapshot.forEach(el => {
              console.log('_transferInstoreToLoggedAccount');
              console.log(el);
              let documentId = el.id;
              this._transferInStoreUpdate({ documentId, ...el.data() }, element);
            })
          } else {
            this._transferInStoreSave(element);
          }
        }, err => {
          console.error(`Encountered error EP : ${err}`);
        });
    });
  }

  private _transferInStoreSave(fromValue) {
    this.afs.collection('instore').add({
      'storeId': fromValue.storeId,
      'userId': this.uuid,
      'intExt': fromValue.intExt,
      'materialId': fromValue.materialId,
      'quantity': fromValue.quantity
    }).then(suc => {
      this.afs.collection('instore').doc(fromValue.documentId).delete().catch(err => {
        console.log(err);
      })
    }).catch(err => {
      console.log(err);
    })
  }

  private _transferInStoreUpdate(toValue, fromValue) {
    this.afs.collection('instore').doc(toValue.documentId).update({
      'quantity': toValue.quantity + fromValue.quantity
    }).then(suc => {
      this.afs.collection('instore').doc(fromValue.documentId).delete().catch(err => {
        console.log(err);
      })
    }).catch(error => {
      console.log(error);
    })
  }

  private transferMasterToLoggedAccount(guestId) {
    let masterTmp: Array<any> = [];
    let masterObserver = this.afs.collection('masterList').ref.where('userId', '==', guestId).onSnapshot(snap => {
      masterObserver();
      if (snap.size > 0) {
        snap.forEach(data => {
          let documentId = data.id;
          masterTmp.push({ documentId, ...data.data() });
        })
        this._transferMasterToLoggedAccount(masterTmp);
      }
    })
  }

  private _transferMasterToLoggedAccount(masterTmp) {
    masterTmp.forEach(element => {
      console.log(element);
      var masterTmp = this.afs.collection('masterList').ref
        .where('userId', '==', this.uuid)
        // .where('userId', '==', '2B3HXryZWhaWo1w36kx1b1AO1Ef2')
        .where('materialId', '==', element.materialId)
        .where('storeId', '==', element.storeId)
        .onSnapshot(querySnapshot => {
          masterTmp();
          console.log(querySnapshot);
          console.log(querySnapshot.size);
          if (querySnapshot.size > 0) {
            this.afs.collection('masterList').doc(element.documentId).delete().catch(err => {
              console.log(err);
            })
          } else {
            this._transferMasterListSave(element);
          }
        }, err => {
          console.error(`Encountered error EP : ${err}`);
        });
    });
  }

  private _transferMasterListSave(fromValue) {
    this.afs.collection('masterList').add({
      'storeId': fromValue.storeId,
      'userId': this.uuid,
      'materialId': fromValue.materialId
    }).then(suc => {
      this.afs.collection('masterList').doc(fromValue.documentId).delete().catch(err => {
        console.log(err);
      })
    }).catch(err => {
      console.log(err);
    })
  }

}
