(function () {
    'use strict';

    angular.module('goalgrid').factory('reportsFactory', ['$q', '$firebaseObject', 'firebaseFactory', function($q, $firebaseObject, firebaseFactory) {
        var reportsFactory = {};

        var unreadNotesRef = firebaseFactory.thisUserRef.child('noteData').child('unreadNoteIDs');
        // Note that this is hardcoded for our built-in goal type ids right now
        reportsFactory.currentReportsTypeIDArray = [1,2,3,4];
        reportsFactory.unreadNoteIDs = $firebaseObject(unreadNotesRef);

        reportsFactory.isNoteUnread = function(noteID) {
            if (!reportsFactory.unreadNoteIDs) {
                return false;
            }
            return reportsFactory.unreadNoteIDs[noteID];
        };

        reportsFactory.markNoteRead = function(noteID) {
            unreadNotesRef.child(noteID).set(null);
        };

        reportsFactory.markNoteUnread = function(noteID) {
            unreadNotesRef.child(noteID).set(true);
        };

        reportsFactory.toggleGoalType = function (goalTypeID) {
            var index = reportsFactory.currentReportsTypeIDArray.indexOf(goalTypeID);
            /* Was already selected */
            if (index > -1) {
                reportsFactory.currentReportsTypeIDArray.splice(index, 1);
            }

            /* Is newly selected */
            else {
              /* This is general logic to add the new goal type id and sort by id */
                reportsFactory.currentReportsTypeIDArray.push(goalTypeID);
                reportsFactory.currentReportsTypeIDArray.sort(function(a, b) {
                    return a - b;
                });
            }
        };

        return reportsFactory;
    }]);

})();
