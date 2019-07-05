# consumerappv2

Steps to setup on your machine:
npm install

ionic cordova platform add android@7.0.0

make sure google-services.json is there in project root and under 'platforms/android'

plugin dependency is 

	ionic cordova plugin add cordova-plugin-fcm-with-dependecy-updated
  
	npm install @ionic-native/fcm@^4.20.0
  
ionic cordova prepare android
