import { Injectable } from '@angular/core';
import { LoadingController } from 'ionic-angular';

@Injectable()
export class LoaderService {

    loading: any;

    constructor(private loadingCtrl: LoadingController) {}

    show() {
        if (!this.loading) {
            this.loading = this.loadingCtrl.create({
                content: 'Loading...'
            });
            this.loading.present();
        }
    }

    hide() {
        if (this.loading) {
            this.loading.dismiss()
            this.loading = null;
        }
    }

}
