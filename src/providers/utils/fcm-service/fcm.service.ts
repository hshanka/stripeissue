import { Injectable } from '@angular/core';
import { FCM } from "@ionic-native/fcm";
import { Storage } from '@ionic/storage';

@Injectable()
export class fcmService {

	constructor(
		private fcm: FCM,
		private storage: Storage
	) {}

	generateUUID() {
	    var d = new Date().getTime();
	    let uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
	      let r = (d + Math.random() * 16) % 16 | 0;
	      d = Math.floor(d / 16);
	  
	      return (c == "x" ? r : (r & 0x3 | 0x8)).toString(16);
	    });
	    return uuid;
	}

	public getToken() {
		return this.fcm.getToken();
	}

	public onNotification() {
		return this.fcm.onNotification();
	}

	public onTokenRefresh() {
		return this.fcm.onTokenRefresh();
	}


	/**
	 * setDeviceToken
	 */
	public setDeviceToken(deviceToken) {
		return new Promise((resolve, reject) => {
			try {
				this.storage.ready().then(() => {
					this.storage.set('deviceToken', deviceToken).then(data => {
						resolve(deviceToken);
					}).catch(error => {
						console.log(error);
					});
				});
			}
			catch (error) {
			}
		});
	}

	/**
	 * getDeviceToken
	 */
	// public getDeviceToken() {
	// 	return new Promise((resolve, reject) => {
	// 	try {
	// 		this.storage.ready().then(() => {
	// 			this.storage.get('deviceToken').then(deviceToken => {
	// 				resolve(deviceToken);
	// 			}).catch(error => {
	// 				console.log(error);
	// 			});
	// 		});
	// 	}
	// 	catch (error) {
	// 	}
	// 	});
	// }
	//faizal10@yopmail.com
	//faizal123#
	public async getDeviceToken() {
		var token = "";
		return await new Promise((resolve, reject) => {
		try {
				this.storage.get('deviceToken').then(deviceToken => {
					resolve(deviceToken);
				}).catch(error => {
					console.log(error);
				});
		}
		catch (error) {
			console.log(error);
		}
		});
	}

}