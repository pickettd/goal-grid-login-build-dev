(function () {
    'use strict';

    angular.module('goalgrid')
    .controller('AccountCtrl', function ($scope, accountFactory, userFactory) {
        $scope.accountsModal = {};

        $scope.accountsModal.newAccountsLoading = {};
        $scope.accountsModal.newGroup = {
            selectedManagersArray: [],
            selectedMembersArray: []
        };
        $scope.accountsModal.justManagers = accountFactory.justManagers;
        $scope.newAccount = {};
        $scope.currentEdit = {};
        $scope.accountsModal.currentGroupEdit = {};
        $scope.accountsModal.groupDropdownSettings = {
            displayProp: 'name',
            enableSearch: false,
            smartButtonMaxItems: 5,
            externalIdProp: ''
        };
        $scope.accountsModal.dropdownTexts = {
            buttonDefaultText: 'Select',
            dynamicButtonTextSuffix: 'selected',
            checkAll: 'Select All',
            uncheckAll: 'Deselect All'
        };
        $scope.accountsModal.accountDropdownSettings = {
            displayProp: 'username',
            enableSearch: true,
            smartButtonMaxItems: 5,
            externalIdProp: ''
        };
        $scope.accountsModal.getGroupMemberCount = accountFactory.getGroupMemberCount;
        $scope.accountsModal.getGroupManagerCount = accountFactory.getGroupManagerCount;

        $scope.resetNewAccount = function () {
            $scope.newAccount = {
                selectedMemberOfArray: [],
                selectedManagerOfArray: []
            };
        };

        $scope.resetAccountModal = function () {
            $scope.resetNewAccount();
            $scope.accountsModal.newGroup = {
                selectedManagersArray: [],
                selectedMembersArray: []
            };
            $scope.currentEdit = {};
            $scope.currentGroupEdit = {};
        };

        $scope.accountsModal.addGroup = function() {
            accountFactory.addGroup($scope.accountsModal.newGroup);
            $scope.accountsModal.newGroup = {
                selectedManagersArray: [],
                selectedMembersArray: []
            };
        };

        $scope.accountsModal.toggleDeleteGroupMode = function(groupID) {
            $scope.accountsModal.currentGroupEdit[groupID].deleteMode = !$scope.accountsModal.currentGroupEdit[groupID].deleteMode;
        };

        $scope.accountsModal.editGroup = function(group) {
            $scope.accountsModal.currentGroupEdit[group.id] = {};
            var setMemberArray = [];
            var setManagerArray = [];

            angular.forEach(group.members, function(value, accountID) {
                if (accountFactory.accounts[accountID]) {
                    setMemberArray.push(accountFactory.accounts[accountID]);
                }
            });

            angular.forEach(group.managers, function(value, accountID) {
                if (accountFactory.accounts[accountID]) {
                    setManagerArray.push(accountFactory.accounts[accountID]);
                }
            });

            group.selectedMembersArray = setMemberArray;
            group.selectedManagersArray = setManagerArray;

            $scope.accountsModal.currentGroupEdit[group.id].group = group;
            $scope.accountsModal.currentGroupEdit[group.id].deleteMode = false;
            $scope.accountsModal.currentGroupEdit[group.id].stopDelete = false;
        };

        $scope.accountsModal.saveGroup = function(group) {
            accountFactory.updateGroup($scope.accountsModal.currentGroupEdit[group.id].group).then(function() {
            });
            $scope.accountsModal.currentGroupEdit[group.id] = {};
        };

        $scope.accountsModal.deleteGroup = function(groupID) {
            accountFactory.deleteGroup(groupID);
            $scope.accountsModal.currentGroupEdit[groupID] = {};
        };

        $scope.addAccount = function() {
            $scope.accountsModal.newAccountsLoading[$scope.newAccount.username] = {username: $scope.newAccount.username};
            accountFactory.addAccount($scope.newAccount).then(function(account) {
                delete $scope.accountsModal.newAccountsLoading[account.username];
            });
            $scope.resetNewAccount();
        };

        $scope.toggleDeleteAccountMode = function(accountID) {
            if ((accountID === 0)||(userFactory.currentUser.id === accountID)) {
                $scope.currentEdit[accountID].stopDelete = true;
            }
            else {
                $scope.currentEdit[accountID].deleteMode = !$scope.currentEdit[accountID].deleteMode;
            }
        };

        $scope.editAccount = function(account) {
            $scope.currentEdit[account.id] = {};
            var setMemberOfArray = [];
            var setManagerOfArray = [];

            if (account.groups && account.groups.memberOf) {
                angular.forEach(account.groups.memberOf, function(value, groupID) {
                    setMemberOfArray.push(accountFactory.allGroups[groupID]);
                });
            }
            if (account.groups && account.groups.managerOf) {
                angular.forEach(account.groups.managerOf, function(value, groupID) {
                    setManagerOfArray.push(accountFactory.allGroups[groupID]);
                });
            }
            account.selectedMemberOfArray = setMemberOfArray;
            account.selectedManagerOfArray = setManagerOfArray;

            $scope.currentEdit[account.id].account = account;
            $scope.currentEdit[account.id].deleteMode = false;
            $scope.currentEdit[account.id].stopDelete = false;
        };

        $scope.saveAccount = function(account) {
            accountFactory.updateAccount($scope.currentEdit[account.id].account).then(function() {
            });
            $scope.currentEdit[account.id] = {};
        };

        $scope.deleteAccount = function(accountID) {
            accountFactory.deleteAccount(accountID);
            $scope.currentEdit[accountID] = {};
        };

        $scope.resetAccountModal();
    });

})();
