(function () {
    'use strict';

    angular.module('goalgrid').factory('accountFactory', ['$resource', '$q', '$cookies', 'firebaseFactory', 'FirebaseuiFactory', '$timeout', function ($resource, $q, $cookies, firebaseFactory, FirebaseuiFactory, $timeout) {
        var accountFactory = {};

        var usersRef = firebaseFactory.usersRef;
        var groupsRef = firebaseFactory.groupsRef;
        var rolesRef = firebaseFactory.firebaseRef.child('roles');
        var roleOptionsRef = rolesRef.child('_options');
        accountFactory.accounts = {};
        accountFactory.account_roles = {};
        accountFactory.allGroups = {};
        accountFactory.currentUserData = {};
        // This variable was testing the performance of getting the whole user at once
        //accountFactory.wholeCurrentUserNode = {};
        accountFactory.justManagers = {};

        var currentUserID = null;

        var getGroupRefFromGroupID = function (groupID) {
            return groupsRef.child(groupID);
        };

        var getUserRefFromAccount = function (account) {
            return usersRef.child(account.id).child('userData');
        };

        var getWholeUserNodeRefFromAccount = function (account) {
            return usersRef.child(account.id);
        };

        accountFactory.getCurrentUserData = function(setUser) {
            console.timeStamp('inside_getAccountRoles-start_getCurrentUserData');
            if (!currentUserID) {
                accountFactory.setCurrentUserID(setUser.uid);
            }
            var defObj = $q.defer();
            if (angular.equals({}, accountFactory.currentUserData)) {
                getUserRefFromAccount({id: currentUserID}).once("value", function(snapshot) {
                    if (snapshot) {
                        var user = snapshot.val();

                        if (user) {
                            accountFactory.currentUserData = user;
                            //accountFactory.wholeCurrentUserNode = user;
                            console.timeStamp('inside_getAccountRoles-end_getCurrentUserData');
                            defObj.resolve(accountFactory.currentUserData);
                        }
                  }
                }, function(error) {
                  console.log('Could not access current user data');
                  console.timeStamp('inside_getAccountRoles-end_getCurrentUserData-ERROR');
                  console.log(error);
                });
            }
            else {
              defObj.resolve(accountFactory.currentUserData);
            }

            return defObj.promise;
        };

        var createNewUserInFirebase = function (account) {
            var defObj = $q.defer();

            var successFn = function(response) {
                var newUser = {
                    userData: {
                        id: response.uid,
                        name: account.username,
                        role: account.role.name,
                        roleID: account.role.id,
                        email: account.email,
                        bootstrapUrl: 'cerulean'
                    },
                    viewData: {}
                };
                if (account.groups) {
                    newUser.userData.groups = account.groups;
                }
                console.log('Getting default view node to create user');
                firebaseFactory.firebaseRef.child('defaultViews').once("value", function(snapshot) {
                    var defaultViewsObj = snapshot.val();
                    newUser.viewData.views = defaultViewsObj;
                    console.log('Creating user metadata');
                    getWholeUserNodeRefFromAccount({id: response.uid}).set(newUser);
                    defObj.resolve(newUser.userData);
                });
            };

            FirebaseuiFactory.createUserAuth({displayname: account.username, email: account.email, password: account.pw, rolename: account.role.name},
                successFn,
                function(req, status, err) {console.log('Create user call failed: '+err);});

            return defObj.promise;
        };

        accountFactory.setCurrentUserID = function(id) {
          currentUserID = id;
          firebaseFactory.setThisUserRef(id);
        };

        accountFactory.setCurrentUserBootstrapUrl = function(url) {
            var userRef = getUserRefFromAccount(accountFactory.currentUserData);
            return userRef.child('bootstrapUrl').set(url);
        };

        accountFactory.getAccountRoles = function () {
            var defObj = $q.defer();
            var promiseArray = [];
            accountFactory.accounts = {};

            var currentUserPromise = accountFactory.getCurrentUserData();
            if (accountFactory.currentUserData.role === 'admin') {
                roleOptionsRef.once("value", function(snapshot) {
                    if (snapshot) {
                        accountFactory.account_roles = {};
                        var allRoles = snapshot.val();
                        angular.forEach(allRoles, function(role) {
                            if (role.id) {
                                accountFactory.account_roles[role.id] = role;
                            }
                        });
                        defObj.resolve(accountFactory.account_roles);
                    }
                });
                promiseArray.push(defObj.promise);
            }
            else {
                accountFactory.account_roles = {};
                var myRoleName = accountFactory.currentUserData.role;
                var myRoleID = accountFactory.currentUserData.roleID;
                accountFactory.account_roles[myRoleID] = {id: myRoleID, name: myRoleName};
            }
            promiseArray.push(currentUserPromise);
            // After we get roles and the current user we can finish processing the current user (might be a manager) before continuing
            return $q.all(promiseArray).then(function() {
                var account = {
                    id: accountFactory.currentUserData.id,
                    username: accountFactory.currentUserData.name,
                    email: accountFactory.currentUserData.email
                };
                account.role = accountFactory.account_roles[accountFactory.currentUserData.roleID];
                perAccountHelper(accountFactory.currentUserData, account);
            });
        };

        function perAccountHelper(user, account) {
            var isUserInManagedGroup = false;
            accountFactory.accounts[user.id] = account;
            accountFactory.accounts[user.id].groups = user.groups;

            if (account.groups && account.groups.memberOf) {
                angular.forEach(account.groups.memberOf, function(value, groupID) {
                    if (accountFactory.currentUserData.groups && accountFactory.currentUserData.groups.managerOf && accountFactory.currentUserData.groups.managerOf[groupID]) {
                        isUserInManagedGroup = true;
                    }
                });
            }
            // This is the case for an ungrouped user - we wanted ungrouped users to show up for all managers by default
            else {
                if ((accountFactory.currentUserData.role === 'manager')&&(user.role === 'user')) {
                    isUserInManagedGroup = true;
                }
            }
            if ((!isUserInManagedGroup) && (accountFactory.currentUserData.role !== 'admin') && (accountFactory.currentUserData.id != account.id)) {
                delete accountFactory.accounts[user.id];
            }
            else if (user.role === 'manager') {
                accountFactory.justManagers[user.id] = account;
            }
        }

        accountFactory.getAccounts = function () {
            var defObj = $q.defer();
            var promiseChain = [];

            console.timeStamp('inside_getAccounts-start_serverAccounts');

            if ((accountFactory.currentUserData.role === 'admin') || (accountFactory.currentUserData.role === 'manager')) {
                rolesRef.once("value", function(snapshot) {
                    if (snapshot) {
                        var allAccountIDs = snapshot.val();
                        angular.forEach(allAccountIDs, function(role, userID) {
                            if (userID !== '_options') {
                                var account = {id: userID};
                                var thisUserPromise = getUserRefFromAccount(account).once("value", function(snapshot) {
                                    $timeout(function() {
                                        if (snapshot) {
                                            var user = snapshot.val();
                                            if (user) {
                                                account.username = user.name;
                                                account.role = accountFactory.account_roles[user.roleID];
                                                account.email = user.email;
                                                perAccountHelper(user, account);
                                                return account;
                                            }
                                            else {
                                                return false;
                                            }
                                        }
                                    });
                                });
                                promiseChain.push(thisUserPromise);
                            }
                        });
                    }
                });

            }

            if (accountFactory.currentUserData.role === 'admin') {
                groupsRef.once("value", function(snapshot) {
                    var allGroups = snapshot.val();
                    if (allGroups) {
                      accountFactory.allGroups = snapshot.val();
                    }

                    defObj.resolve(accountFactory.accounts);
                });
            }
            else if (accountFactory.currentUserData.role === 'manager') {
                if (accountFactory.currentUserData.groups && accountFactory.currentUserData.groups.managerOf) {
                    accountFactory.allGroups = {};
                    var groupIDsToCheck = accountFactory.currentUserData.groups.managerOf;
                    var promiseArray = [];
                    angular.forEach(groupIDsToCheck, function(value, groupID) {
                        var thisGroupProm = getGroupRefFromGroupID(groupID).once('value', function(snapshot) {
                            var group = snapshot.val();
                            if (group) {
                                accountFactory.allGroups[groupID] = group;
                            }
                        });
                        promiseArray.push(thisGroupProm);
                    });
                    $q.all(promiseArray).then(function() {
                        defObj.resolve(accountFactory.accounts);
                    });
                }
            }
            else {
              defObj.resolve(accountFactory.accounts);
            }

            return defObj.promise;
        };

        var getCountGroupProperty = function(groupID, propertyName) {
            var returnCount = 0;
            if (accountFactory.allGroups[groupID] && accountFactory.allGroups[groupID][propertyName]) {
                angular.forEach(accountFactory.allGroups[groupID][propertyName], function(item) {
                    if (item) {
                        returnCount++;
                    }
                });
            }
            return returnCount;
        };

        // Javascript is always pass-by-value style but the object value is a reference, so
        // changing the groups property is propagated properly
        var setGroupsBySelectedArrays = function(account) {
            delete account.groups;

            if (account.selectedMemberOfArray.length) {
                if (!account.groups) { account.groups = {}; }
                account.groups.memberOf = {};
                angular.forEach(account.selectedMemberOfArray, function(group) {
                    account.groups.memberOf[group.id] = true;
                });
            }
            if (account.selectedManagerOfArray.length) {
                if (!account.groups) { account.groups = {}; }
                account.groups.managerOf = {};
                angular.forEach(account.selectedManagerOfArray, function(group) {
                    account.groups.managerOf[group.id] = true;
                });
            }
        };

        var setAccountsBySelectedArraysInGroup = function(group) {
            delete group.managers;
            delete group.members;

            if (group.selectedMembersArray && group.selectedMembersArray.length) {
                group.members = {};
                angular.forEach(group.selectedMembersArray, function(account) {
                    group.members[account.id] = true;
                });
            }
            if (group.selectedManagersArray && group.selectedManagersArray.length) {
                group.managers = {};
                angular.forEach(group.selectedManagersArray, function(account) {
                    group.managers[account.id] = true;
                });
            }
        };

        var removeAccountFromGroups = function(account) {
            if (account.groups) {
                angular.forEach(account.groups.memberOf, function(value, groupID) {
                    if (accountFactory.allGroups[groupID].members) {
                        delete accountFactory.allGroups[groupID].members[account.id];
                    }
                    getGroupRefFromGroupID(groupID).child('members').child(account.id).set(null);
                });
                angular.forEach(account.groups.managerOf, function(value, groupID) {
                    if (accountFactory.allGroups[groupID].managers) {
                        delete accountFactory.allGroups[groupID].managers[account.id];
                    }
                    getGroupRefFromGroupID(groupID).child('managers').child(account.id).set(null);
                });
            }
        };

        var removeGroupFromAccounts = function(group) {
            var returnPromiseArray = [];
            angular.forEach(group.members, function(value, accountID) {
                if (accountFactory.accounts[accountID]) {
                    if (accountFactory.accounts[accountID].groups && accountFactory.accounts[accountID].groups.memberOf) {
                        delete accountFactory.accounts[accountID].groups.memberOf[group.id];
                    }
                    var thisPromise = getUserRefFromAccount({id: accountID}).child('groups/memberOf').child(group.id).set(null);
                    returnPromiseArray.push(thisPromise);
                }
            });
            angular.forEach(group.managers, function(value, accountID) {
                if (accountFactory.accounts[accountID]) {
                    if (accountFactory.accounts[accountID].groups && accountFactory.accounts[accountID].groups.managerOf) {
                        delete accountFactory.accounts[accountID].groups.managerOf[group.id];
                    }
                    var thisPromise = getUserRefFromAccount({id: accountID}).child('groups/managerOf').child(group.id).set(null);
                    returnPromiseArray.push(thisPromise);
                }
            });
            return $q.all(returnPromiseArray);
        };

        var addAccountToGroups = function(account) {
            if (account.groups) {
                angular.forEach(account.groups.memberOf, function(value, groupID) {
                    if (!accountFactory.allGroups[groupID].members) {
                        accountFactory.allGroups[groupID].members = {};
                    }
                    accountFactory.allGroups[groupID].members[account.id] = true;
                    getGroupRefFromGroupID(groupID).child('members').child(account.id).set(true);
                });
                angular.forEach(account.groups.managerOf, function(value, groupID) {
                    if (!accountFactory.allGroups[groupID].managers) {
                        accountFactory.allGroups[groupID].managers = {};
                    }
                    accountFactory.allGroups[groupID].managers[account.id] = true;
                    getGroupRefFromGroupID(groupID).child('managers').child(account.id).set(true);
                });
            }
        };

        var addGroupToAccounts = function(group) {
            var returnPromiseArray = [];
            angular.forEach(group.members, function(value, accountID) {
                if (!accountFactory.accounts[accountID].groups) {
                    accountFactory.accounts[accountID].groups = {};
                }
                if (!accountFactory.accounts[accountID].groups.memberOf) {
                    accountFactory.accounts[accountID].groups.memberOf = {};
                }
                accountFactory.accounts[accountID].groups.memberOf[group.id] = true;
                var thisPromise = getUserRefFromAccount({id: accountID}).child('groups/memberOf').child(group.id).set(true);
                returnPromiseArray.push(thisPromise);
            });
            angular.forEach(group.managers, function(value, accountID) {
                if (!accountFactory.accounts[accountID].groups) {
                    accountFactory.accounts[accountID].groups = {};
                }
                if (!accountFactory.accounts[accountID].groups.managerOf) {
                    accountFactory.accounts[accountID].groups.managerOf = {};
                }
                accountFactory.accounts[accountID].groups.managerOf[group.id] = true;
                var thisPromise = getUserRefFromAccount({id: accountID}).child('groups/managerOf').child(group.id).set(true);
                returnPromiseArray.push(thisPromise);
            });
            return $q.all(returnPromiseArray);
        };

        accountFactory.getGroupMemberCount = function(groupID) {
            return getCountGroupProperty(groupID, 'members');
        };

        accountFactory.getGroupManagerCount = function(groupID) {
            return getCountGroupProperty(groupID, 'managers');
        };

        var setFirebaseGroupData = function(group) {
            getGroupRefFromGroupID(group.id).child('id').set(group.id);
            getGroupRefFromGroupID(group.id).child('name').set(group.name);
            var setMembers = null;
            if (group.members) {
                setMembers = group.members;
            }
            getGroupRefFromGroupID(group.id).child('members').set(setMembers);
            var setManagers = null;
            if (group.managers) {
                setManagers = group.managers;
            }
            getGroupRefFromGroupID(group.id).child('managers').set(setManagers);
        };

        accountFactory.addGroup = function(newGroup) {
            // This gets the object in sync with the UI structure for selecting groups
            setAccountsBySelectedArraysInGroup(newGroup);
            newGroup.id = firebaseFactory.groupsRef.push().key;
            accountFactory.allGroups[newGroup.id] = newGroup;
            // This creates the new group in Firebase
            setFirebaseGroupData(newGroup);
            // This gets the account objects locally and in Firebase in sync with the new group
            addGroupToAccounts(newGroup);

            return $q.when(accountFactory.allGroups[newGroup.id]);
        };

        accountFactory.updateGroup = function(updatedGroup) {
            var defObj = $q.defer();

            removeGroupFromAccounts(updatedGroup);
            setAccountsBySelectedArraysInGroup(updatedGroup);
            addGroupToAccounts(updatedGroup);
            setFirebaseGroupData(updatedGroup);
            accountFactory.allGroups[updatedGroup.id] = updatedGroup;
            defObj.resolve(accountFactory.allGroups[updatedGroup.id]);

            return defObj.promise;
        };

        accountFactory.deleteGroup = function(groupID) {
            removeGroupFromAccounts(accountFactory.allGroups[groupID]);
            getGroupRefFromGroupID(groupID).set(null);
            delete accountFactory.allGroups[groupID];
        };

        accountFactory.addAccount = function (account) {
            var defObj = $q.defer();

            setGroupsBySelectedArrays(account);
            createNewUserInFirebase(account).then(function(response) {
                account.id = response.id;
                addAccountToGroups(account);
                accountFactory.accounts[response.id] = account;
                if (account.role.name === 'manager') {
                    accountFactory.justManagers[account.id] = account;
                }
                defObj.resolve(accountFactory.accounts[response.id]);
            });

            return defObj.promise;
        };

        accountFactory.updateAccount = function(updatedAccount) {
            var defObj = $q.defer();

            var successFn = function(response) {
                removeAccountFromGroups(updatedAccount);
                if (updatedAccount.role.name !== 'manager') {
                    updatedAccount.selectedManagerOfArray = [];
                }
                setGroupsBySelectedArrays(updatedAccount);
                delete accountFactory.justManagers[updatedAccount.id];
                accountFactory.accounts[updatedAccount.id] = updatedAccount;
                if (updatedAccount.role.name === 'manager') {
                    accountFactory.justManagers[updatedAccount.id] = updatedAccount;
                }
                var userRef = getUserRefFromAccount(updatedAccount);
                userRef.child('name').set(updatedAccount.username);
                userRef.child('role').set(updatedAccount.role.name);
                userRef.child('roleID').set(updatedAccount.role.id);
                userRef.child('email').set(updatedAccount.email);
                if (updatedAccount.groups) {
                    userRef.child('groups').set(updatedAccount.groups);
                    addAccountToGroups(updatedAccount);
                }
                else {
                    userRef.child('groups').set(null);
                }
                console.log('User updated');
                defObj.resolve(updatedAccount);
            };

            var updateUser = {
                id: updatedAccount.id,
                displayname: updatedAccount.username,
                email: updatedAccount.email,
                password: updatedAccount.pw,
                rolename: updatedAccount.role.name
            };
            if (!updatedAccount.pw || (updatedAccount.pw.trim() === '')) {
                delete updateUser.password;
            }
            FirebaseuiFactory.updateUserAuth(updateUser,successFn, function(req, status, err) {console.log('Update user call failed: '+err);});

            return defObj.promise;
        };

        accountFactory.deleteAccount = function(accountID) {
            var defObj = $q.defer();

            var successFn = function(response) {
                removeAccountFromGroups(accountFactory.accounts[accountID]);
                delete accountFactory.justManagers[accountID];
                delete accountFactory.accounts[accountID];
                getWholeUserNodeRefFromAccount({id: accountID}).set(null);
                console.log('User deleted');
                defObj.resolve(accountID);
            };
            FirebaseuiFactory.deleteUserAuth({id: accountID}, successFn, function(req, status, err) {console.log('Delete user call failed: '+err);});

            return defObj.promise;
        };

        return accountFactory;
    }]);

})();
