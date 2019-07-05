import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Keyboard } from '@ionic-native/keyboard';
import { Storage } from '@ionic/storage';
import { Vibration } from '@ionic-native/vibration';
// import { Geofence } from '@ionic-native/geofence';
import { ToastService } from './../providers';

@Component({
  templateUrl: 'app.html'
})
export class xoomCart {

  rootPage: any = 'TabsHomePage';
  isFirstTime: boolean = true;

  constructor(public platform: Platform, 
    public statusBar: StatusBar, 
    public splashScreen: SplashScreen, 
    private keyboard: Keyboard, 
    private storage: Storage, 
    private toastService: ToastService,
    private vibration: Vibration
    ) {

    platform.ready().then(() => {



      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      statusBar.overlaysWebView(false);
      splashScreen.hide();
      keyboard.hideFormAccessoryBar(false);


    });
    
  }

 

 

}
