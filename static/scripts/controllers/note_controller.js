(function () {
    'use strict';

    angular.module('goalgrid')
    .controller('NoteCtrl', function ($scope, noteFactory, modalData, userFactory) {
        $scope.noteModal = {};

        $scope.noteModal.modalState = modalData;
        $scope.noteModal.newNote = noteFactory.newNote;
        $scope.noteModal.currentEdit = noteFactory.currentEdit;

        if (modalData.editOnly) {
            $scope.noteModal.modalNotes = [noteFactory.visibleNotesFlatObject[modalData.note.id]];
        }
        else {
            /*
            If in the future we want to expand the notes modal to handle editing a list of notes this will need to be updated
            */
            $scope.noteModal.modalNotes = [];
        }

        $scope.noteModal.returnSharedWithString = function(note) {
            // This logic handles the case of a new note where the manager and user id is set in the modal but not the newNote
            var isThisModalForCurrentUser = userFactory.currentUser.id === modalData.user.id;
            var isCurrentUserManagerForModal = userFactory.currentUser.id === modalData.managerID;

            var isManagerNote = noteFactory.isManagerNote(note);
            var isThisUsersNote = (noteFactory.isThisUsersNote(note) || isThisModalForCurrentUser);
            var isCurrentUserManagerOfNote = (noteFactory.isCurrentUserManagerOfNote(note) || isCurrentUserManagerForModal);

            if (!isThisUsersNote && isCurrentUserManagerOfNote) {
                return modalData.user.name;
            }
            else {
                return 'my manager';
            }
        };

        $scope.noteModal.resetNoteModal = function() {
            noteFactory.resetNoteModal(modalData.noteView);
        };

        $scope.noteModal.addNote = function() {
            /*
            If there is no view date specified then use the time now.
            Otherwise set the date based on the view date but set the time based on right now.
            */
            var timeNow = new Date();
            // Note that this timestamp property is based on the view date.
            // With the recent changes to how Month/Year/Etc views date pickers work, those timestamps will be within that range,
            // but not necessarily usefully specific (ie, the picker says November but the timestamp could be anywhere in the month)
            // So there is also createdTimestamp added noteFactory.addNote that records the present time of note creation
            if (!modalData.viewDate) {
                $scope.noteModal.newNote.timestamp = timeNow;
            }
            else {
                $scope.noteModal.newNote.timestamp = angular.copy(modalData.viewDate);
                $scope.noteModal.newNote.timestamp.setHours(timeNow.getHours());
                $scope.noteModal.newNote.timestamp.setMinutes(timeNow.getMinutes());
                $scope.noteModal.newNote.timestamp.setMilliseconds(timeNow.getMilliseconds());
            }
            $scope.noteModal.newNote.timestamp = ($scope.noteModal.newNote.timestamp).getTime();

            $scope.noteModal.newNote.noteView = modalData.noteView;
            $scope.noteModal.newNote.managerID = modalData.managerID;
            $scope.noteModal.newNote.managerName = modalData.managerName;
            $scope.noteModal.newNote.userID = modalData.user.id;
            /*
            Need to set the private flag in case it is left blank by default
            */
            if (!$scope.noteModal.newNote.private) {
                $scope.noteModal.newNote.private = false;
            }

            var thisNote = angular.copy($scope.noteModal.newNote);
            noteFactory.addNote(thisNote).then(function() {
                if (modalData.addOnly) {
                    $scope.noteModal.resetNoteModal();
                    $scope.$close();
                }
            });
            noteFactory.resetNewNote(modalData.noteView);
        };

        $scope.noteModal.saveNote = function(note) {
            var thisEditedNote = $scope.noteModal.currentEdit[note.id].note;
            noteFactory.updateNote(thisEditedNote).then( function () {
                if (modalData.editOnly) {
                    $scope.noteModal.resetNoteModal();
                    $scope.$close();
                }
            });
            $scope.noteModal.currentEdit[note.id] = {};
        };

        $scope.noteModal.toggleDeleteNoteMode = function(noteID) {
            $scope.noteModal.currentEdit[noteID].deleteMode = !$scope.noteModal.currentEdit[noteID].deleteMode;
        };

        $scope.noteModal.deleteNote = function(noteID) {
            noteFactory.deleteNote(noteID);
            $scope.noteModal.currentEdit[noteID] = {};

            if ($scope.noteModal.modalState.editOnly) {
                $scope.noteModal.resetNoteModal();
                $scope.$close();
            }
        };
    });

})();
