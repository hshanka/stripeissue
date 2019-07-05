import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { HttpModule } from '@angular/http';

import { SuperTabsModule } from 'ionic2-super-tabs';
import { IonicStorageModule } from '@ionic/storage';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Camera } from '@ionic-native/camera';
import { Keyboard } from '@ionic-native/keyboard';
import { HTTP } from '@ionic-native/http';
import { Network } from '@ionic-native/network';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { Geolocation } from '@ionic-native/geolocation';
import { FCM } from "@ionic-native/fcm";
import { Vibration } from '@ionic-native/vibration';
import { AlertController } from 'ionic-angular';

// import { Geofence } from '@ionic-native/geofence';
// import { FCM } from '@ionic-native/fcm';
// import { SocialSharing } from '@ionic-native/social-sharing';
// import { Facebook } from '@ionic-native/facebook';
// import { GooglePlus } from '@ionic-native/google-plus';

// Import the AF2 Module
import { environment } from './../../environments/environment';

// providers
import { LoaderService, ToastService,  StripeService } from '../providers';

// app pages
import { xoomCart } from './app.component';

@NgModule({
  declarations: [
    xoomCart
  ],
  imports: [
    BrowserModule,
    HttpModule,
    IonicModule.forRoot(xoomCart),
    IonicStorageModule.forRoot({
      name: 'xoomCT',
      driverOrder: ['sqlite', 'indexeddb', 'websql']
    }),
    SuperTabsModule.forRoot(), 
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    xoomCart
  ],
  providers: [
    LoaderService,
    StatusBar,
    SplashScreen,
    Camera,
    Keyboard,
    HTTP,
    Network,
    BarcodeScanner,
    Geolocation,
    FCM,
    Vibration,
    AlertController,
    ToastService,
    StripeService,
    { provide: ErrorHandler, useClass: IonicErrorHandler }
  ]
})
export class AppModule { }
