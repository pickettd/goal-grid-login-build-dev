(function () {
    'use strict';
    // **********************
    // Note that userFactory is still here because so much of the code still uses it.
    // We should be able to remove userFactory.currentUser and just use accountFactory.currentUserData though
    // **********************

    angular.module('goalgrid').factory('userFactory', function ($cookies) {
        var userFactory = {};
        userFactory.currentUser = {};
        userFactory.currentUser.isManager = function() {
            if ((userFactory.currentUser.role === 'admin')||(userFactory.currentUser.role === 'manager')) { return true;}
            return false;
        };
        userFactory.currentUser.isAdmin = function() {
            if (userFactory.currentUser.role === 'admin') { return true;}
            return false;
        };

        return userFactory;
    });

})();
