import { Injectable } from '@angular/core';
import { FCM } from "@ionic-native/fcm";
import { Storage } from '@ionic/storage';

@Injectable()
export class AppConstants {


	constructor(
	) {}


	public config = {
		"enviroment": "dev",
		"dev": {
			"aws_lambda_baseUrl": "https://6jesung7pi.execute-api.us-east-1.amazonaws.com/dev",
			"stripe_public_key": "pk_test_CFCdp80VrJTmLJdg0NpV0ENa00JJB44kDv"
		},
		"staging": {
			"aws_lambda_baseUrl": "",
			"stripe_public_key": ""
		},
		"prod": {
			"aws_lambda_baseUrl": "",
			"stripe_public_key": ""
		}
	}
}