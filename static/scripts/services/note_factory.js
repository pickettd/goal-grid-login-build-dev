(function () {
    'use strict';

    angular.module('goalgrid').factory('noteFactory', ['$q', '$filter', '$modal', '$firebaseObject', 'firebaseFactory', 'userFactory', 'reportsFactory', function($q, $filter, $modal, $firebaseObject, firebaseFactory, userFactory, reportsFactory) {
        var noteFactory = {};

        var notesRef = firebaseFactory.thisUserRef.child('noteData').child('notes');
        noteFactory.visibleNotesFlatObject = {};
        noteFactory.newNote = {};
        noteFactory.currentEdit = {};

        var getNotesDataRefFromNote = function(note) {
            return firebaseFactory.usersRef.child(note.userID+'/noteData');
        };

        var getNoteRefFromNote = function(note) {
            return getNotesDataRefFromNote(note).child('/notes/'+note.id);
        };

        var getUnreadNoteIDRef = function (note) {
            return getNotesDataRefFromNote(note).child('unreadNoteIDs/'+note.id);
        };

        var addNoteIDToFirebaseUnreadNotes = function(note) {
            getUnreadNoteIDRef(note).set(true);
        };

        var removeNoteIDFromFirebaseUnreadNotes = function(note) {
            getUnreadNoteIDRef(note).set(null);
        };

        var hardcodedNotes = {
            1: {
                id: 1,
                userID: 3,
                managerID: null,
                timestamp: (moment().subtract(1, 'day').hour(16).minute(15)).toDate().getTime(),
                private: false,
                noteView: 'Day',
                noteText: "Didn't get any tours today"
            },
            2: {
                id: 2,
                userID: 3,
                managerID: 2,
                timestamp: (moment().subtract(1, 'day').hour(17).minute(5)).toDate().getTime(),
                private: false,
                noteView: 'Manager',
                noteText: 'Helped Sally practice her intent statement'
            },
            3: {
                id: 3,
                userID: 3,
                managerID: 2,
                timestamp: (moment().subtract(1, 'month').hour(12)).toDate().getTime(),
                private: false,
                noteView: 'Manager',
                noteText: 'Helped Sally review the sales script'
            },
            4: {
                id: 4,
                userID: 3,
                managerID: null,
                timestamp: (moment().subtract(2, 'day').hour(9).minute(0)).toDate().getTime(),
                private: false,
                noteView: 'Day',
                noteText: 'Attended sales training class'
            },
            5: {
                id: 5,
                userID: 3,
                managerID: null,
                timestamp: (moment().hour(5).minute(10)).toDate().getTime(),
                private: true,
                noteView: 'Day',
                noteText: 'Went for bike ride with kids'
            },
            6: {
                id: 6,
                userID: 3,
                managerID: 2,
                timestamp: (moment().subtract(2, 'day').hour(12)).toDate().getTime(),
                private: true,
                noteView: 'Manager',
                noteText: 'Private observation - I decided to give a VIP client to Veronica instead of Sally'
            }
        };

        noteFactory.isManagerNote = function(note) {
            return (note.managerID !== null)&&(note.managerID !== undefined);
        };

        noteFactory.isThisUsersNote = function(note) {
            return (note.userID === userFactory.currentUser.id);
        };

        noteFactory.isCurrentUserManagerOfNote = function(note) {
            return (note.managerID === userFactory.currentUser.id);
        };

        noteFactory.openNoteModal = function(noteView, scope, modalDataObject, templateUrl) {
            if (modalDataObject === undefined) {
                noteFactory.resetNoteModal(noteView);
                modalDataObject = {
                    editOnly: false,
                    addOnly: true,
                    noteView: noteView,
                    user: {},
                    managerID: null,
                    viewDate: new Date()
                };
            }
            if (templateUrl === undefined) {
                templateUrl = 'static/views/modals/notes/note_layout.html';
            }
            return $modal.open({
                animation: true,
                templateUrl: templateUrl,
                controller: 'NoteCtrl',
                scope: scope,
                resolve: {
                    modalData: function($q) {
                        return $q.when(modalDataObject);
                    }
                }
            });
        };

        noteFactory.resetNewNote = function(noteView) {
            noteFactory.newNote.id = 0;
            noteFactory.newNote.userID = 0;
            noteFactory.newNote.managerID = null;
            noteFactory.newNote.managerName = null;
            noteFactory.newNote.timestamp = new Date().getTime();
            noteFactory.newNote.private = false;
            noteFactory.newNote.noteView = noteView;
            noteFactory.newNote.noteText = '';
        };

        noteFactory.resetNoteModal = function(noteView) {
            noteFactory.resetNewNote(noteView);
            noteFactory.currentEdit = {};
        };

        /*
        This function filters the visible notes list by user ID.
        It also accepts optional parameters of a date and format type in order to retrieve only a single day's notes.
        A particular date format string can be supplied (for example to just match year or month and year).
        Optionally the view type can also be specified for the filter. If a view filter is used it means that manager notes should be excluded.
        */
        noteFactory.getSingleUserNotes = function(userID, dateToFilterOn, justMatchFormat, viewTypeToFilerOn) {
            var returnArray = [];

            angular.forEach(noteFactory.visibleNotesFlatObject, function(note) {
                
                if (note.userID === userID) {
                    var doesDateMatch = true;
                    var doesViewTypeMatch = true;

                    if (dateToFilterOn !== undefined) {
                        var dateMatchFormat = 'MM/dd/yyyy';
                        if (justMatchFormat !== undefined) {
                            dateMatchFormat = justMatchFormat;
                        }
                        var thisNoteDateString = $filter('date')(note.timestamp, dateMatchFormat);
                        var compareDateString = $filter('date')(dateToFilterOn, dateMatchFormat);
                        doesDateMatch = (thisNoteDateString === compareDateString);
                    }

                    /*
                    Check if a view type filter was requested. A manager's note will have the 'Manager' type so will be excluded automatically.
                    */
                    if (viewTypeToFilerOn !== undefined) {
                        doesViewTypeMatch = (note.noteView === viewTypeToFilerOn);
                    }

                    if (doesDateMatch && doesViewTypeMatch) {
                        returnArray.push(note);
                    }
                }
            });
            return $filter('orderBy')(returnArray, 'timestamp');
        };
        
         noteFactory.getUnreadNotes = function(userID) {
            var returnArray = [];
            angular.forEach(noteFactory.visibleNotesFlatObject, function(note) {
                if (note.userID === userID && note.managerID && reportsFactory.isNoteUnread(note.id)) {
                     returnArray.push(note);
                }
                
            });
            return $filter('orderBy')(returnArray, 'timestamp');
        };
        
        var removeManagerNotes = function() {
            if (!userFactory.currentUser.isManager()) {
                angular.forEach(noteFactory.visibleNotesFlatObject, function(note) {
                    if (noteFactory.isManagerNote(note) && noteFactory.isThisUsersNote(note) && note.private) {
                        delete noteFactory.visibleNotesFlatObject[note.id];
                    }
                });
            }
        };

        noteFactory.getNotes = function(isManager) {
            var defObj = $q.defer();

            if (isManager) {
                var usersObj = $firebaseObject(firebaseFactory.usersRef);
                usersObj.$loaded().then(function(){
                    noteFactory.visibleNotesFlatObject = {};
                    angular.forEach(usersObj, function(user){
                        var thisUserNotes = {};
                        if (user.noteData) {
                            thisUserNotes = user.noteData.notes;
                        }
                        angular.forEach(thisUserNotes, function(note) {
                            //TODO: this logic should be moved into the server side security rules
                            if ((note.private && isManager && !note.managerID) || (note.private && !isManager && note.managerID)) {
                                angular.noop();
                            }
                            else {
                                noteFactory.visibleNotesFlatObject[note.id] = note;
                            }
                        });
                    });
                    defObj.resolve(noteFactory.visibleNotesFlatObject);
                });
            }
            else {
                noteFactory.visibleNotesFlatObject = $firebaseObject(notesRef);
                noteFactory.visibleNotesFlatObject.$watch(function() {
                    removeManagerNotes();
                });
                noteFactory.visibleNotesFlatObject.$loaded().then(function() {
                    removeManagerNotes();
                    defObj.resolve(noteFactory.visibleNotesFlatObject);
                });
            }

            return defObj.promise;
        };

        noteFactory.addNote = function(newNote) {
            var defObj = $q.defer();

            newNote.id = getNotesDataRefFromNote(newNote).child('notes').push().key;
            // Use the Firebase-specific server time for note creation timestamp
            newNote.createdTimestamp = firebase.database.ServerValue.TIMESTAMP;
            noteFactory.visibleNotesFlatObject[newNote.id] = newNote;
            getNoteRefFromNote(newNote).set(newNote);
            if (newNote.managerID && !newNote.private) {
                addNoteIDToFirebaseUnreadNotes(newNote);
            }
            defObj.resolve(newNote);

            return defObj.promise;
        };

        noteFactory.updateNote = function(updatedNote) {
            var defObj = $q.defer();

            var oldNote = noteFactory.visibleNotesFlatObject[updatedNote.id];
            if (oldNote.managerID && !oldNote.private) {
                removeNoteIDFromFirebaseUnreadNotes(updatedNote);
            }

            _.assign(noteFactory.visibleNotesFlatObject[updatedNote.id], updatedNote);
            getNoteRefFromNote(updatedNote).set(updatedNote);
            if (updatedNote.managerID && !updatedNote.private) {
                addNoteIDToFirebaseUnreadNotes(updatedNote);
            }
            defObj.resolve(noteFactory.visibleNotesFlatObject[updatedNote.id]);

            return defObj.promise;
        };

        noteFactory.deleteNote = function(noteID) {
            var defObj = $q.defer();

            var thisNote = noteFactory.visibleNotesFlatObject[noteID];
            var userID = thisNote.userID;
            var managerID = thisNote.managerID;
            var deleteObj = {id: noteID, userID: userID};

            if (managerID) {
                removeNoteIDFromFirebaseUnreadNotes(deleteObj);
            }
            delete noteFactory.visibleNotesFlatObject[noteID];
            getNoteRefFromNote(deleteObj).set(null);
            defObj.resolve({});

            return defObj.promise;
        };

        return noteFactory;
    }]);

})();
