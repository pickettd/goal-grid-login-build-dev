(function () {
    'use strict';
    // console.log('firebaseui_factory.js');
    angular.module('goalgrid')
        .factory('FirebaseuiFactory', ['$firebaseAuth', '$location', '$window', '$rootScope',
            function authFactory($firebaseAuth, $location, $window, $rootScope) {
                var firebaseuiFactory = {};

                var firebaseId = firebase.app().options.projectId;
                // This is the default address in development
                //var firebaseServerURL = 'http://localhost:5000/'+firebaseId+'/us-central1/api/';
                // This is the default address in production
                var firebaseServerURL = 'https://us-central1-'+firebaseId+'.cloudfunctions.net/api/';

                var authObject = firebase.auth();
                firebaseuiFactory.firebaseAuthObject = $firebaseAuth(authObject);
                firebaseuiFactory.ui = new firebaseui.auth.AuthUI(authObject);
                firebaseuiFactory.dataRoot = firebase.database().ref();
                firebaseuiFactory.userToken = null;

                // firebaseuiFactory.register = function (user) {
                //     console.log('register called');
                //     // return firebaseAuthObject.$createUserWithEmailAndPassword(user.email, user.password);
                // };

                // firebaseuiFactory.login = function (user) {
                //     console.log('login called');
                //     // return firebaseAuthObject.$signInWithEmailAndPassword(user.email, user.password);
                // };

                firebaseuiFactory.isLoggedIn = function () {
                    return firebaseuiFactory.firebaseAuthObject.$requireSignIn();
                };

                firebaseuiFactory.logout = function () {
                    console.log('logout called');
                    authObject.signOut().then(function () {
                        console.log('Log out successful. Redirecting');
                        $rootScope.$apply(function () {
                            $location.path("/login");
                        });
                    }).catch(function (err) {
                        console.log('Log out failed', err);
                    });
                };


                firebaseuiFactory.createUserAuth = function(newUser, successFn, errFn) {
                    if (firebaseuiFactory.userToken) {
                        $.ajax({
                            url: firebaseServerURL + 'newUser',
                            type: 'POST',
                            beforeSend: function(xhr) {
                                 xhr.setRequestHeader("Authorization", "Bearer "+firebaseuiFactory.userToken);
                            },
                            data: newUser,
                            success: successFn,
                            error: errFn
                        });
                    }
                    else {
                        console.error('Cannot create user, this account is not fully authenticated yet - please wait a moment and try again');
                    }
                };
                firebaseuiFactory.updateUserAuth = function(updateUser, successFn, errFn) {
                    if (firebaseuiFactory.userToken) {
                        $.ajax({
                            url: firebaseServerURL + 'updateUser',
                            type: 'POST',
                            beforeSend: function(xhr) {
                                 xhr.setRequestHeader("Authorization", "Bearer "+firebaseuiFactory.userToken);
                            },
                            data: updateUser,
                            success: successFn,
                            error: errFn
                        });
                    }
                    else {
                        console.error('Cannot update user, this account is not fully authenticated yet - please wait a moment and try again');
                    }
                };
                firebaseuiFactory.deleteUserAuth = function(deleteUser, successFn, errFn) {
                    if (firebaseuiFactory.userToken) {
                        $.ajax({
                            url: firebaseServerURL + 'deleteUser',
                            type: 'POST',
                            beforeSend: function(xhr) {
                                 xhr.setRequestHeader("Authorization", "Bearer "+firebaseuiFactory.userToken);
                            },
                            data: deleteUser,
                            success: successFn,
                            error: errFn
                        });
                    }
                    else {
                        console.error('Cannot delete user, this account is not fully authenticated yet - please wait a moment and try again');
                    }
                };
                /**
                 * Returns the user if they are logged in. If not, then returns false. Also check for admin permissions
                 */
                firebaseuiFactory.getUser = function () {
                    // console.log('hit getUser::');
                    // console.log('authObject.currentUser = ', authObject.currentUser);
                    if (authObject.currentUser) {
                        authObject.currentUser.getIdToken(/* forceRefresh */ true).then(function(idToken) {
                            firebaseuiFactory.userToken = idToken;
                            var thisUserId = authObject.currentUser.uid;
                            //console.log('Got logged in user token: ' + idToken);
                            $.ajax({
                                url: firebaseServerURL + 'roles?user='+thisUserId,
                                type: 'GET',
                                beforeSend: function(xhr) {
                                     xhr.setRequestHeader("Authorization", "Bearer "+idToken);
                                },
                                success: function(data){
                                    console.log('Check admin call success');
                                },
                                error: function(req, status, err) {
                                  console.log('Check admin call failed: '+err);
                                }
                            });
                        });
                    }
                    return authObject.currentUser;
                };

                return firebaseuiFactory;

            }]);
})();