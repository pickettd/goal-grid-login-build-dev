(function () {
    'use strict';

    // Values for sandbox
    //var firebaseID = 'goal-grid-dev-sandbox';
    //var firebaseAPI = 'AIzaSyDI56bJheSTwUBFzRTlkBXXVg8hrmn9-o4';
    //var firebaseMessagingId = '637574795586';

    // Values for login-prototype
    var firebaseID = 'goal-grid-login-prototype';
    var firebaseAPI = 'AIzaSyA8izaYTPKoj0roPVeBH1verzc8aoHGcx0';
    var firebaseMessagingId = '669303885284';

    var config = {
        apiKey: firebaseAPI,
        authDomain: firebaseID+'.firebaseapp.com',
        databaseURL: 'https://'+firebaseID+'.firebaseio.com',
        projectId: firebaseID,
        storageBucket: firebaseID+'.appspot.com',
        messagingSenderId: firebaseMessagingId
    };

    firebase.initializeApp(config);

    var app = angular.module('goalgrid', [
        'ngResource',
        'ngCookies',
        'angularjs-dropdown-multiselect',
        'mp.autoFocus',
        'ui.bootstrap',
        'colorpicker.module',
        'angular-packery',
        'angular-sortable-view',
        'angularSpectrumColorpicker',
        'ngTable',
        'ngFileUpload',
        'ngOrderObjectBy',
        'firebase',
        'ui.router'
    ]);

    app.run(function ($transitions, $state) {

        var onError = function (transition) {
            // console.error('Transition error', transition);
            if (transition.error().detail === "AUTH_REQUIRED") {
                console.log("AUTH_REQUIRED. Redirecting to login.");
                // return transition.router.stateService.target('login');
                // According to the docs the above should work and be the proper way.
                $state.go('login');
            }
        };

        $transitions.onError({}, onError);
    });

    app.config(["$stateProvider", "$urlRouterProvider", function ($stateProvider, $urlRouterProvider) {

        $urlRouterProvider.otherwise('home');

        $stateProvider
            .state("login", {
                url: '/login',
                controller: "FirebaseuiController",
                templateUrl: "static/views/login.html"
            })
            .state("home", {
                url: '/home',
                controller: "MainCtrl",
                templateUrl: "static/views/main.html",
                resolve: {
                    // controller will not be loaded until $requireSignIn resolves
                    // Auth refers to our $firebaseAuth wrapper in the factory below
                    currentAuth: ['FirebaseuiFactory', 'userFactory', 'accountFactory', function (FirebaseuiFactory, userFactory, accountFactory) {
                        // $requireSignIn returns a promise so the resolve waits for it to complete
                        // If the promise is rejected, it will throw a $stateChangeError (see above)
                        var authStatus = FirebaseuiFactory.isLoggedIn();
                        return authStatus.then(function () {
                            var loggedInUser = FirebaseuiFactory.getUser();
                            // Pass the uid into getCurrentUserData so that the account factory currentUser gets set properly after login
                            return accountFactory.getCurrentUserData(loggedInUser).then(function () {
                                // Note that userFactory is being set here because so much of the code still uses it.
                                // We should be able to remove userFactory.currentUser and just use accountFactory.currentUserData
                                userFactory.currentUser.id = loggedInUser.uid;
                                if (loggedInUser.displayName) {
                                    userFactory.currentUser.name = loggedInUser.displayName;
                                }
                                else {
                                    userFactory.currentUser.name = loggedInUser.email;
                                }
                                userFactory.currentUser.role = accountFactory.currentUserData.role;

                                return loggedInUser;
                            });
                        });
                    }]
                }
            })
            .state('404', {
                // url: '*path',
                url: '/404',
                templateUrl: 'static/views/404.html'
            });
    }]);

    /*
    The following settings are to allow Angular to make authenticated calls into the Tornado API.
    */
    angular.module('goalgrid').config(['$httpProvider', function ($httpProvider) {
        $httpProvider.defaults.withCredentials = true;
        $httpProvider.defaults.xsrfCookieName = '_xsrf';
        $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    }]);
})();
