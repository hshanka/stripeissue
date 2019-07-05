import { Component } from '@angular/core';
import { IonicPage, Events } from 'ionic-angular';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { Storage } from '@ionic/storage';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { User } from 'firebase/app';
import { AuthService, LoaderService, ToastService } from './../../providers';

@IonicPage()
@Component({
  selector: 'page-preferred-store-list',
  templateUrl: 'preferred-store-list.html'
})
export class PreferredStoreListPage {

  private authenticatedUser: User;
  private authenticatedUser$: Subscription;
  private preferredStoreListCol: AngularFirestoreCollection<any>;
  private preferredStoreList: Observable<any[]>;

  constructor(
    public events: Events,
    private afs: AngularFirestore,
    private storage: Storage, 
    private authService: AuthService, 
    public loaderService: LoaderService, 
    private toastService: ToastService) {
    try {
      this.authenticatedUser$ = this.authService.getAuthenticatedUser().subscribe((user: User) => {
        this.authenticatedUser = user;
      })
    } catch (e) { }
  }
  
  ionViewWillEnter() {
    this.loaderService.show();
    try {
      this.initFirebase();
    }
    catch (e) { }
  }

  initFirebase() {
    let self = this;
    this.preferredStoreListCol = this.afs.collection(`preferredStores`, ref => ref
    .where('userId', '==', this.authenticatedUser.uid));
    this.preferredStoreList = this.preferredStoreListCol.snapshotChanges().map(actions => {
      return actions.map(a => {
        const data = a.payload.doc.data();
        const key = a.payload.doc.id;
        const partner = 'N';
          return { key, partner, ...data };
      });
    });
    self.loaderService.hide();
  }

  selectStore(item) {
    this.storage.ready().then(() => {
      this.storage.set('store', item);
      this.storeSelected('selectStore');
    });
  }

  storeSelected(event) {
    this.events.publish('store:selected', event, Date.now());
  }

}
