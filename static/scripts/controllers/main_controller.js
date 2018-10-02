(function () {
    'use strict';
    
    angular.module('goalgrid')
    .controller('MainCtrl', [
                '$scope', '$filter', '$location', 'userFactory', 'goalFactory', 'accountFactory', 'pictureFactory', 'viewFactory', 'reportsFactory','$modal', 'noteFactory', 'FirebaseuiFactory',
    function ($scope, $filter, $location, userFactory, goalFactory, accountFactory, pictureFactory, viewFactory, reportsFactory, $modal, noteFactory, FirebaseuiFactory) {
        $scope.main = {};

        $scope.main.logOut = function () {
            // Cleanup the live data event watchers (will get permission errors if you don't clean being logging out)
            if (noteFactory.visibleNotesFlatObject.$destroy) {
              noteFactory.visibleNotesFlatObject.$destroy();
            }
            if (reportsFactory.unreadNoteIDs.$destroy) {
              reportsFactory.unreadNoteIDs.$destroy();
            }
            FirebaseuiFactory.logout();
        };

        $scope.main.isInitialLoadDone = false;

        /*
        This function works by looking at the current view date and calling the get notes function
        specifying that only a certain day's notes should be returned.
        */
        $scope.main.getVisibleNotesForCurrentUserByCurrentView = function() {
            var byDate;
            var dateFormat;

            if ($scope.main.isViewDaily($scope.main.currentView)) {
                byDate = $scope.main.currentViewDate;
                dateFormat = 'MM/dd/yyyy';
            }
            else if ($scope.main.isViewMonthly($scope.main.currentView)) {
                byDate = $scope.main.currentViewDate;
                dateFormat = 'MM/yyyy';
            }
            else if ($scope.main.isViewYearly($scope.main.currentView)) {
                byDate = $scope.main.currentViewDate;
                dateFormat = 'yyyy';
            }
            else {
                // This will happen in the case of Life goals
                byDate = undefined;
                dateFormat = undefined;
            }
            return noteFactory.getSingleUserNotes($scope.main.currentUser.id, byDate, dateFormat, $scope.main.currentView.name);
        };

        $scope.main.addOrEditNoteModal = function(userID, editID) {
            var modalDataObject = {
                editOnly: false,
                addOnly: true,
                noteView: viewFactory.currentView.name,
                allowPrivate: true,
                user: {}
            };
            noteFactory.resetNoteModal(viewFactory.currentView.name);
            if (editID !== undefined) {
                modalDataObject.editOnly = true;
                modalDataObject.addOnly = false;
                modalDataObject.note = noteFactory.visibleNotesFlatObject[editID];
                var isManagerNote = noteFactory.isManagerNote(modalDataObject.note);
                var isThisUsersNote = noteFactory.isThisUsersNote(modalDataObject.note);
                var isCurrentUserManagerOfNote = noteFactory.isCurrentUserManagerOfNote(modalDataObject.note);
                /*
                A manager should not be able to edit a user's notes.
                A user should not be able to edit manager's notes.
                */
                if ((!isThisUsersNote && !isCurrentUserManagerOfNote)||(isThisUsersNote && isManagerNote)) {
                    return;
                }
                noteFactory.currentEdit[editID] = {};
                noteFactory.currentEdit[editID].note = angular.copy(modalDataObject.note);
            }
            /*
            If add note is being called from the reports view then the timestamp will always be now (not the past).
            */
            if ($scope.main.showReports) {
                modalDataObject.viewDate = new Date();
            }
            else {
                modalDataObject.viewDate = $scope.main.currentViewDate;
            }
            if (userID === undefined || userID === userFactory.currentUser.id) {
                modalDataObject.user = angular.copy(userFactory.currentUser);
                // TODO: This translation is needed because the account usernames are currently used as person names
                if (!modalDataObject.user.name)
                {
                    modalDataObject.user.name = modalDataObject.user.username;
                }
                modalDataObject.managerID = null;
                modalDataObject.managerName = null;
            }
            else {
                modalDataObject.user = angular.copy(accountFactory.accounts[userID]);
                // TODO: This translation is needed because the account usernames are currently used as person names
                modalDataObject.user.name = modalDataObject.user.username;
                modalDataObject.managerID = userFactory.currentUser.id;
                modalDataObject.managerName = userFactory.currentUser.name;
            }
            noteFactory.openNoteModal(viewFactory.currentView.name, $scope, modalDataObject);
        };

        var openModalHelper = function(modalDataObject, templateUrl, controllerString, size) {
            return $modal.open({
                animation: true,
                templateUrl: templateUrl,
                controller: controllerString,
                scope: $scope,
                size: size,
                resolve: {
                    modalData: function($q) {
                        return $q.when(modalDataObject);
                    }
                }
            });
        };

        $scope.main.openHelpModal = function() {
            var templateUrl = 'static/views/modals/help_and_tips/help.html';
            return openModalHelper({}, templateUrl, '', 'lg');
        };

        $scope.main.gridViewClickEmptySpace = function(event, goalTypeID) {
            if (goalTypeID) {
                goalFactory.resetGoalModal(goalTypeID);
            }
            var modalDataObject = {editOnly: false, addOnly: true};
            var goalModal = $scope.main.openGoalModal(goalTypeID, modalDataObject);
        };

        $scope.main.toggleChartViewRearrangeGoals = function() {
            $scope.main.linkViewDragEnabled = $scope.main.gridViewRearrangeGoals;
        };

        $scope.main.gridViewClickGoal = function(goalID) {
            var goal = goalFactory.visibleGoalsFlatObject[goalID];

            goalFactory.resetGoalModal(goal.goalTypeID);
            goalFactory.currentEdit[goalID] = {};
            goalFactory.currentEdit[goalID].goal = angular.copy(goal);
            var modalDataObject = {editOnly: true, addOnly: false, goal: goal};
            var templateUrl = 'static/views/modals/goals_inner.html';
            /*
            // This code checks if the color by link path option is enabled,
            // and if it is, then use the view template for link color edits

            if ($scope.main.linkSettings.colorCodeByLinkPath) {
                templateUrl = 'static/views/modals/link_color_outer.html';
                modalDataObject.linkColorMode = true;
            }
            */
            var goalModal = $scope.main.openGoalModal(goal.goalTypeID, modalDataObject, templateUrl);
        };

        $scope.main.openGoalModal = function(goalTypeID, modalDataObject, templateUrl) {
            /*
            modalDataObject will be undefined when openGoalModal is being called in the default way (both add/edit).
            */
            if (modalDataObject === undefined) {
                $scope.main.setModalGoalType(goalTypeID);
                modalDataObject = {editOnly: false, addOnly: false};
            }
            if (templateUrl === undefined) {
                templateUrl = 'static/views/modals/goals_inner.html';
            }
            if ($scope.main.currentView.allowGoalLinkUI) {
                modalDataObject.allowGoalLinkUI = true;
            }
            modalDataObject.currentViewDate = $scope.main.currentViewDate;
            return openModalHelper(modalDataObject, templateUrl, 'GoalCtrl');
        };

        $scope.main.openUnreadNotes = function(userId) {
            /*
            modalDataObject will be undefined when openGoalModal is being called in the default way (both add/edit).
            */
            $scope.main.showReportsNoteSection = true;

              var modalDataObject = {editOnly: false, addOnly: false};
   

            var templateUrl = 'static/views/modals/unread_notes_mobile.html';
          

                modalDataObject.allowGoalLinkUI = true;
           
            modalDataObject.currentViewDate = $scope.main.currentViewDate;
            return openModalHelper(modalDataObject, templateUrl, 'ReportsCtrl');
        };
        
        $scope.main.getUnreadNotesForSingleUser = function(userID) {
            // Since reports are based on a whole month, send a date format parameter to only match on month and year
            return noteFactory.getUnreadNotes(userID);
        };

        // Note that this function takes completed as a bool because in the past
        // we had different styling for percentage-based goals that weren't completed
        $scope.main.getBackgroundColorStyleFromGoal = function(goal, completed) {
            return { 'background-color': goalFactory.getGoalColor(goal) };
        };

        $scope.main.colorPercentageSquare = function(columnIndex, goal, monthIndex) {
            // It seems like we always want to color the 0% button with the goal's color
            if (columnIndex === 0) {
                var goalColor = goalFactory.getGoalColor(goal);
                return 'background-color: '+goalColor+' !important;';
            }
            else {
                return goalFactory.colorPercentageSquare(columnIndex, goal, monthIndex, $scope.main.currentViewDate, false);
            }
        };

        $scope.main.addPicToThisView = function(left, primaryColumn, newPic) {
            viewFactory.addPicToView($scope.main.currentView.id, left, primaryColumn, newPic);
            pictureFactory.addViewIDToPicture(newPic, $scope.main.currentView.id);
        };

        var setPictureModal = function(pictureID) {
            if (pictureID) {
                $scope.main.pictureForModal = angular.copy(pictureFactory.allPictures[pictureID]);
            }
            else {
                // Ignoreme is added to the viewIDs to prevent Firebase from creating an array (instead of an object)
                $scope.main.pictureForModal = {
                    src: '',
                    viewIDs: {ignoreme: true},
                    selectionType: 'file'
                };
                $scope.main.pictureForModal.viewIDs[$scope.main.currentView.id] = true;
            }
                if (!$scope.main.pictureForModal.selectionType) {
                    $scope.main.pictureForModal.selectionType = 'url';
                }
        };

        $scope.main.setPictureAndOpenModal = function(pictureID, viewLeft, viewFirstColumn, picListIndex) {
            var modalDataObject = {};
            modalDataObject.currentView = $scope.main.currentView;
            modalDataObject.viewLeft = viewLeft;
            modalDataObject.viewFirstColumn = viewFirstColumn;
            modalDataObject.picListIndex = picListIndex;
            if (pictureID === null) {
                modalDataObject.addOnly = true;
            }
            setPictureModal(pictureID);
            $scope.main.openPictureModal(modalDataObject);
        };

        $scope.main.openPictureModal = function(modalDataObject) {
            var controllerString = 'PictureCtrl';
            var templateUrl = 'static/views/modals/pictures/pic_select.html';

            if (modalDataObject === undefined) {
                modalDataObject = {currentView: $scope.main.currentView};
            }
            if (($scope.main.currentView.allowPictureEdit)||(modalDataObject.addOnly)) {
                templateUrl = 'static/views/modals/pictures/pic_edit.html';
            }

            return openModalHelper(modalDataObject, templateUrl, controllerString);
        };

        $scope.main.toggleChartViewColorByLinkPath = function() {
            goalFactory.recolorGoals();
        };

        /* This function is just a helper for a view to be able to access angular.equals */
        $scope.main.isObject1EqualToObject2 = function (object1, object2) {
            return angular.equals(object1, object2);
        };

        /* This function is a helper to get the number of keys in an object based on angular.forEach */
        $scope.main.getObjectLength = function(object) {
            if (!object) {
                return 0;
            }
            var objectLength = object.length;
            if (objectLength !== undefined) {
                return objectLength;
            }
            else {
                objectLength = 0;

                angular.forEach(object, function(child) { objectLength++; });

                return objectLength;
            }
        };

        $scope.main.isViewDaily = function(view) {
            var goalTypeID = viewFactory.getViewSingleGoalTypeID(view);
            if (goalTypeID !== null) {
                return goalFactory.isGoalDaily({goalTypeID: goalTypeID});
            }
            return false;
        };

        $scope.main.isViewMonthly = function(view) {
            var goalTypeID = viewFactory.getViewSingleGoalTypeID(view);
            if (goalTypeID !== null) {
                return goalFactory.isGoalMonthly({goalTypeID: goalTypeID});
            }
            return false;
        };

        $scope.main.isViewYearly = function(view) {
            var goalTypeID = viewFactory.getViewSingleGoalTypeID(view);
            if (goalTypeID !== null) {
                return goalFactory.isGoalYearly({goalTypeID: goalTypeID});
            }
            return false;
        };

        $scope.main.isViewLifetime = function(view) {
            var goalTypeID = viewFactory.getViewSingleGoalTypeID(view);
            if (goalTypeID !== null) {
                return goalFactory.isGoalLifeTime({goalTypeID: goalTypeID});
            }
            return false;
        };

        // This function determines how much the current date moves with the left/right buttons
        // It detects if a view only has a single type of goal in it (day/month/year) and if so it will move the date by the appropriate unit
        $scope.main.incrementCurrentViewDateByViewAmount = function(incrementAmount, inputIncrementType) {
            var incrementType = 'day';
            if (inputIncrementType !== undefined) {
                incrementType = inputIncrementType;
            }
            else {
                if ($scope.main.isViewMonthly($scope.main.currentView)) {
                    incrementType = 'month';
                }
                else if ($scope.main.isViewYearly($scope.main.currentView)) {
                    incrementType = 'year';
                }
            }
            $scope.main.currentViewDate = moment($scope.main.currentViewDate).add(incrementAmount, incrementType).toDate();

        };

        $scope.main.isGoalDaily = function(goal) {
            return goalFactory.isGoalDaily(goal);
        };

        $scope.main.isGoalMonthly = function(goal) {
            return goalFactory.isGoalMonthly(goal);
        };

        $scope.main.isGoalYearly = function(goal) {
            return goalFactory.isGoalYearly(goal);
        };

        $scope.main.isGoalLifeTime = function(goal) {
            return goalFactory.isGoalLifeTime(goal);
        };

        $scope.main.isGoalYearlyOrLifeTime = function(goal) {
            return goalFactory.isGoalYearlyOrLifeTime(goal);
        };

        $scope.main.isGoalCurrentlyComplete = function(goal) {
            return goalFactory.isGoalCompleteOnDate(goal, $scope.main.currentViewDate);
        };

        /**
         * Check to see if a goal recurs on a given date.
         * @param {*} goal The goal being validated.
         * @param {*} inputDate The date it's being validated for.
         */
        $scope.main.validRecurDate = function (goal, inputDate) {
            var recurrence = moment(goal.recur.startDate).recur();

            // The library doesn't make it easy to have both by day of the week repeats and skip-week repeating rules at the same time
            // Note that it looks like frequencyCount could be an int or a string
            if (goal.recur.repeatType !== 'weeks' || (goal.recur.frequencyCount != 1)) {
                recurrence = recurrence.every(goal.recur.frequencyCount, goal.recur.repeatType);
            }
            // So if the repeat schedule is every week, just use the days of the week
            // Note that it looks like frequencyCount could be an int or a string
            else if (goal.recur.repeatType === 'weeks' && (goal.recur.frequencyCount == 1)) {
                recurrence = recurrence.every(goal.recur.selectedDays).daysOfWeek();
            }

            var timestampToCheck = goalFactory.getEndOrStartOfGoalsPeriodUsingDate(goal, inputDate, 'start');
            return recurrence.matches(timestampToCheck);
        };

        $scope.main.isGoalActiveInCurrentView = function(goal) {
            var timestampToCheck = $scope.main.currentViewDate;
            var momentRightNow = moment();
            // If the we are checking inactivity for today, we should use the timestamp of right now
            // instead of the value of the current view which will be the start of the day
            if (moment(timestampToCheck).isSame(momentRightNow, 'day')) {
                timestampToCheck = momentRightNow.valueOf();
            }
            var valid = goalFactory.isGoalActiveOnDate(goal, timestampToCheck);

            // If goal passes isGoalActiveOnDate() then check if it's a recurring goal
            // if it is, check to see if it's also a valid recurrence date.
            if(valid && goal.recur) {
                valid = $scope.main.validRecurDate(goal, timestampToCheck);
            }

            return valid;
        };

        $scope.main.getCurrentProgessDate = function(goal) {
            return goalFactory.getGoalProgressStringInRecurrenceOnDate(goal, $scope.main.currentViewDate);
        };

        /*
        This function will mark progress based on the datepicker but records the current
        system time also.
        */
        $scope.main.markGoalProgress = function(goal, progress, event) {
            event.preventDefault();
            event.stopPropagation();

            goalFactory.markGoalProgressOnDate(goal, progress, $scope.main.currentViewDate);
        };

        $scope.main.getCurrentCompletionPercentageForGoal = function(goal) {
            return goalFactory.getGoalCompletionPercentageInRecurrenceOnDate(goal, $scope.main.currentViewDate);
        };

        /* This function isn't used currently but can be used in the case that the view needs ng-model for a percentage */
        /*
        $scope.main.getRecurrenceStringCurrentDateFromGoalTypeID = function (goalTypeID) {
            return goalFactory.getGoalRecurrenceStringOnDateFromGoalType(goalTypeID, $scope.main.currentViewDate);
        };
        */

        $scope.main.markGoalIncomplete = function(goal, event) {
            event.preventDefault();
            event.stopPropagation();

            goalFactory.markGoalProgressOnDate(goal, '0', $scope.main.currentViewDate);
        };

        $scope.main.openGridDatePicker = function(event) {
            event.preventDefault();
            event.stopPropagation();

            if ($scope.main.currentView.changeDate) {
                $scope.main.gridDatePickerOpened = true;
            }
        };

        $scope.main.setModalGoalType = function(goalTypeID) {
            goalFactory.resetGoalModal(goalTypeID);
        };

        $scope.main.enableView = function(viewID) {
            //var newView = viewFactory.allViews[viewID];
            // This is something that can probably be removed in the future.
            // It is in place right now because only the daily view allows current date view changes.
            // So all other views should just be for the current date.
            $scope.main.currentViewDate = moment().startOf('day').toDate();
            var newView = viewFactory.allViews[viewID];
            var oldView = $scope.main.currentView;
            // In the case that the color by group setting is on, check if
            // the view we're loading allows group colors.
            // Note that if this is the first load of the page,
            // the oldView might not be set yet.
            if (goalFactory.linkSettings.colorCodeByLinkPath) {
                if ((oldView.showColorByGroup)||(angular.equals(oldView,{}))) {
                    if (!newView.showColorByGroup) {
                        goalFactory.linkSettings.colorCodeByLinkPath = false;
                        goalFactory.recolorGoals();
                    }
                }
            }
            viewFactory.setCurrentView(viewID);
            $scope.main.currentView = viewFactory.currentView;
            if ($scope.main.isViewMonthly($scope.main.currentView)) {
                $scope.main.currentDatePickerMode = 'month';
                $scope.main.currentDatePickerPopup = 'MMMM-yyyy';
            }
            else if ($scope.main.isViewYearly($scope.main.currentView)) {
                $scope.main.currentDatePickerMode = 'year';
                $scope.main.currentDatePickerPopup = 'yyyy';
            }
            else {
                $scope.main.currentDatePickerMode = 'day';
                $scope.main.currentDatePickerPopup = 'EEE dd-MMMM-yyyy';
            }
            $scope.main.showReports = false;
            $scope.main.showRewards = false;
            $scope.main.showClaimReport = false;
        };

        $scope.main.changeOrderOfGoalsInCurrentView = function(item, indexFrom, indexTo) {
            viewFactory.reorderGoalsinCurrentView(item, indexFrom, indexTo);
        };

        $scope.main.changeOrderOfPicturesInCurrentView = function() {
            viewFactory.savePicturesOrdersinView($scope.main.currentView);
        };

        //-----------------------------------------------------------------------------------------------------------
        // Start scope variables (not functions) and initialization code

        // currentViewDate is used as the model for the date picker and as the string in the goal completion record data structure
        $scope.main.currentViewDate = moment().startOf('day').toDate();

        // The date picker variables are used to determine if the date picker is working on day, month, or year
        $scope.main.currentDatePickerMode = 'day';
        $scope.main.currentDatePickerPopup = 'EEE dd-MMMM-yyyy';

        // todayDate is used by the date picker to set a max and not be able to go in the future
        $scope.main.todayDate = moment().startOf('day').format(goalFactory.datePickerFormatString);

        $scope.main.pictureForModal = {};
        $scope.main.linkViewDragEnabled = true;
        $scope.main.dateOptions = {
            startingDay: 1,
            show_weeks: false
        };

        // This is commented out now because userFactory initializes current user itself now
        //userFactory.getCurrentUser();
        $scope.main.currentUser = userFactory.currentUser;

        $scope.main.showReportsNoteSection = true;
        $scope.main.gridViewRearrangeGoals = false;
        $scope.main.linkViewDragEnabled = $scope.main.gridViewRearrangeGoals;

        // set the default bootswatch name
        $scope.main.css = '';

        // create the list of bootswatches
        $scope.main.bootstraps = [
            { name: 'None', url: '' },
            { name: 'Cerulean', url: 'cerulean' },
            { name: 'Cosmo', url: 'cosmo' },
            { name: 'Cyborg', url: 'cyborg' },
            { name: 'Darkly', url: 'darkly' },
            { name: 'Flatly', url: 'flatly' },
            { name: 'Journal', url: 'journal' },
            { name: 'Lumen', url: 'lumen' },
            { name: 'Paper', url: 'paper' },
            { name: 'Readable', url: 'readable' },
            { name: 'Sandstone', url: 'sandstone' },
            { name: 'Simplex', url: 'simplex' },
            { name: 'Slate', url: 'slate' },
            { name: 'Spacelab', url: 'spacelab' },
            { name: 'Superhero', url: 'superhero' },
            { name: 'United', url: 'united' },
            { name: 'Yeti', url: 'yeti' }
        ];

        $scope.main.currentReportsTypeIDArray = reportsFactory.currentReportsTypeIDArray;
        $scope.main.toggleGoalType = reportsFactory.toggleGoalType;
        $scope.main.currentUserGoals = goalFactory.currentUserGoals;
        $scope.main.allPublicGoals = goalFactory.allPublicGoals;
        $scope.main.allVisibleGoalsFlatObject = goalFactory.visibleGoalsFlatObject;
        $scope.main.currentUserAllGoalsFlatArray = goalFactory.currentUserAllGoalsFlatArray;
        // This variable isn't used yet
        $scope.main.goalCompletionData = goalFactory.goalCompletionData;
        $scope.main.allGoalTypes = goalFactory.allGoalTypes;
        $scope.main.currentView = {};
        $scope.main.allViews = viewFactory.allViews;
        $scope.main.allVisibleNotes = noteFactory.visibleNotesFlatObject;
        $scope.main.allPictures = pictureFactory.allPictures;
        $scope.main.linkSettings = goalFactory.linkSettings;
        $scope.main.setCurrentUserBootstrapUrl = accountFactory.setCurrentUserBootstrapUrl;

        var getAllServerData = function() {
            console.timeStamp('started_server_data_load - getAccountRoles');
            accountFactory.getAccountRoles().then(function() {
                $scope.main.account_roles = accountFactory.account_roles;
                console.timeStamp('start_getAccounts');
                accountFactory.getAccounts().then(function() {
                    console.timeStamp('end_getAccounts');
                    $scope.main.css = accountFactory.currentUserData.bootstrapUrl;
                    $scope.main.accounts = accountFactory.accounts;
                    $scope.main.allGroups = accountFactory.allGroups;
                    console.timeStamp('start_getNotes');
                    noteFactory.getNotes($scope.main.currentUser.isManager()).then(function() {
                        console.timeStamp('end_getNotes');
                        $scope.main.allVisibleNotes = noteFactory.visibleNotesFlatObject;
                        $scope.main.unreadManagerNoteIDs = reportsFactory.unreadNoteIDs;
                    });

                    console.timeStamp('start_getPics');
                    pictureFactory.getPictures().then(function(allPictures) {
                        console.timeStamp('end_getPics');
                        $scope.main.allPictures = pictureFactory.allPictures;
                    });
                    console.timeStamp('start_getGoalTypes');
                    goalFactory.getGoalTypes().then(function(goalTypes) {
                        console.timeStamp('end_getGoalTypes');
                        // Visible goals will eventually be based on the date of the view (because of inactive status)
                        console.timeStamp('start_getVisibleGoals');
                        goalFactory.getVisibleGoals(userFactory.currentUser).then(function(visibleGoals) {
                            console.timeStamp('end_getVisibleGoals');
                            console.timeStamp('start_getAllPublicGoals');
                            goalFactory.getAllPublicGoals().then(function(goals) {
                                console.timeStamp('end_getAllPublicGoals');
                                $scope.main.allPublicGoals = goalFactory.allPublicGoals;
                                $scope.main.allGoalTypes = goalFactory.allGoalTypes;
                                $scope.main.currentUserGoals = goalFactory.currentUserGoals;
                                $scope.main.allVisibleGoalsFlatObject = goalFactory.visibleGoalsFlatObject;
                                $scope.main.currentUserAllGoalsFlatArray = goalFactory.currentUserAllGoalsFlatArray;
                                $scope.main.unclaimedRewardIDs = goalFactory.unclaimedRewardIDs;
                                $scope.main.linkSettings = goalFactory.linkSettings;

                                console.timeStamp('start_getAllViews');
                                viewFactory.getAllViews().then(function() {
                                    console.timeStamp('end_getAllViews');
                                    //recolorGoals here in case the default colors changed
                                    goalFactory.recolorGoals();
                                    var initialViewID = 1;
                                    angular.forEach(viewFactory.allViews, function(view) {
                                        if (view.goalArraysByType === undefined) { view.goalArraysByType = {}; }
                                        if (view.goalIDsArraysByType === undefined) { view.goalIDsArraysByType = {}; }
                                        angular.forEach(view.goalTypeIDs, function(goalTypeID){
                                            // Note that this shouldn't be undefined now that we're using Firebase data
                                            if (view.goalIDsArraysByType[goalTypeID] === undefined) {
                                                view.goalArraysByType[goalTypeID] = goalFactory.filterOnTypeOfGoal(goalTypeID);
                                            }
                                            else {
                                                view.goalArraysByType[goalTypeID] = [];
                                                angular.forEach(view.goalIDsArraysByType[goalTypeID], function(goalID) {
                                                    view.goalArraysByType[goalTypeID].push(goalFactory.visibleGoalsFlatObject[goalID]);
                                                });
                                            }
                                        });
                                        if (view.isInitial === true) {
                                            initialViewID = view.id;
                                        }
                                    });

                                    $scope.main.allViews = viewFactory.allViews;
                                    $scope.main.enableView(initialViewID);
                                    // showReports controls if the grid of goals is shown or if reports are on screen
                                    if (userFactory.currentUser.isManager()) {
                                        $scope.main.showReports = true;
                                    }
                                    else {
                                        $scope.main.showReports = false;
                                    }
                                    console.timeStamp('completed_server_data_function');
                                    $scope.main.isInitialLoadDone = true;
                                });
                            });
                        });
                    });
                });
            });
        };

        getAllServerData();

        $scope.main.accounts = accountFactory.accounts;
        $scope.main.account_roles = accountFactory.account_roles;
        $scope.main.allGroups = accountFactory.allGroups;
    }]);

})();
