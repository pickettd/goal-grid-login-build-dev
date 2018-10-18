(function () {
    'use strict';

    angular.module('goalgrid')
        .factory('firebaseFactory', ['userFactory',
            function (userFactory) {
                var root = firebase.database().ref('/');
                var firebaseFactory = {};
                firebaseFactory.firebaseRef = root;
                firebaseFactory.usersRef = root.child('users');
                firebaseFactory.groupsRef = root.child('groups');
                firebaseFactory.setThisUserRef = function(userid) {
                  firebaseFactory.thisUserRef = root.child('users').child(userid);
                };
                return firebaseFactory;

            }]);

    // angular.module('goalgrid').factory('firebaseFactory', ['userFactory', '$location', '$cookies', '$window', function (userFactory, $location, $cookies, $window) {
    //     var firebaseFactory = {};

    //     var firebaseUrl = 'https://goal-grid-demo.firebaseio.com/';
    //     // We use a different Firebase URL for the dev server or the fresh HKBGoals copy
    //     if ($location.host() === 'localhost') {
    //         // For local development fill in your sandbox Firebase node URL here
    //         // i.e. Peter's sandbox URL is 'https://goal-grid-dev-sandbox.firebaseio.com/peterTestData'
    //         // and David's sandbox URL is 'https://goal-grid-dev-sandbox.firebaseio.com/davidTestData'
    //         firebaseUrl = 'https://goal-grid-dev-sandbox.firebaseio.com';
    //     }
    //     else if ($location.host() === 'goal-grid-demo-dev.herokuapp.com') {
    //         firebaseUrl += 'prototypeDemoData-dev';
    //     }
    //     else if ($location.host() === 'www.hkbgoals.com') {
    //         firebaseUrl += 'www_hkbgoals';
    //     }
    //     else {
    //         firebaseUrl += 'prototypeDemoData';
    //     }
    //     firebaseFactory.firebaseRef = new Firebase(firebaseUrl);
    //     firebaseFactory.usersRef = firebaseFactory.firebaseRef.child('users');
    //     firebaseFactory.groupsRef = firebaseFactory.firebaseRef.child('groups');
    //     firebaseFactory.thisUserRef = firebaseFactory.usersRef.child(userFactory.currentUser.id);

    //     var firebaseToken = $cookies.user_firebase_token || '';
    //     if (firebaseToken) {
    //         firebaseFactory.firebaseRef.authWithCustomToken(firebaseToken, function(error, authData) {
    //         if (error) {
    //             console.log("Login Failed!", error);
    //             $window.alert('Could not reach database, please try logging in again');
    //             $window.location.href = 'logout';
    //         } else {
    //             console.log("Login Succeeded!", authData);
    //         }
    //         });
    //     }

    //     return firebaseFactory;
    // }]);
})();
