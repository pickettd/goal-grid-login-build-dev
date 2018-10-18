(function () {
    'use strict';
    // console.log('firebaseui_controller.js');
    angular.module('goalgrid')
        .controller('FirebaseuiController', ['FirebaseuiFactory',
            function (firebaseuiFactory) {

                this.signInSuccess = function (currentUser) {
                    // console.log('Login successful. User is', currentUser);
                    return true; // redirects to signInSuccessUrl if func returns true
                };

                // FirebaseUI config.
                var signInSuccessUrl = '#/home';
                var uiConfig = {
                    callbacks: {
                        signInSuccess: this.signInSuccess,
                        uiShown: function () {
                            document.getElementById('loader').style.display = 'none';
                        }
                    },
                    // redirectUrl: '/',
                    signInFlow: 'redirect', // perform a full page redirect to the sign-in page of the provider
                    signInSuccessUrl: signInSuccessUrl, // url to go to on success
                    // queryParameterForWidgetMode: 'mode',
                    // With credentialHelper commented out we will get the default behavior that allows new accounts
                    //credentialHelper: firebaseui.auth.CredentialHelper.NONE,
                    // requireDisplayName is what we'll use for the user's first and last name
                    signInOptions: [{provider: firebase.auth.EmailAuthProvider.PROVIDER_ID, requireDisplayName: true}]
                };
                // The start method will wait until the DOM is loaded.
                firebaseuiFactory.ui.start('#firebaseui-auth-container', uiConfig);
            }]);
})();