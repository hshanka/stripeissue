import { Injectable } from '@angular/core';
import { ToastController, AlertController } from 'ionic-angular';

@Injectable()
export class ToastService {

    toast: any;

    constructor(private toastCtrl: ToastController, private alertCtrl: AlertController) {}

    custom(message) {
        this.toast = this.toastCtrl.create({
            message: message,
            duration: 3000,
            position: 'bottom'
        });
        this.toast.present();
    }

    _showToast(message, time) {
        this.toastCtrl.create({
            message: message,
            duration: time
        }).present();
    }

    _okAlertCtrl(title, message, callback) {
        this.alertCtrl.create({
            title: title,
            message: message,
            buttons: [{
                text: 'Ok',
                role: 'cancel',
                handler: () => {
                    callback();
                }
            }]
        }).present();
    }

    _confirmAlertCtrl(title, message, callback) {
        this.alertCtrl.create({
            title: title,
            message: message,
            buttons: [{
                text: 'Cancel',
                role: 'cancel'
            }, {
                text: 'Ok',
                handler: () => {
                    callback();
                }
            }]
        }).present();
    }

}
