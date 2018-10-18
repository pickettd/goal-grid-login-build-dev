(function () {
    'use strict';

    angular.module('goalgrid')
    .controller('ReportsCtrl', function($scope, goalFactory, accountFactory, userFactory, reportsFactory, noteFactory, NgTableParams, $filter, $modal) {
        $scope.reports = {};

        $scope.reports.allVisibleNotes = noteFactory.visibleNotesFlatObject;
        $scope.reports.allAccounts = accountFactory.accounts;
        $scope.reports.showUser = {};
        $scope.reports.showGroup = {};
        $scope.reports.allGroups = accountFactory.allGroups;
        $scope.reports.currentReportFromDate = moment().startOf('month').toDate();
        $scope.reports.currentReportToDate = moment().startOf('day').toDate();
        $scope.reports.currentReportMaxFromDate = moment().startOf('day').format(goalFactory.datePickerFormatString);
        $scope.reports.startOfCurrentDate = moment().startOf('day').format(goalFactory.datePickerFormatString);
        $scope.reports.currentReportMinFromDate = moment(0).startOf('day').format(goalFactory.datePickerFormatString);
        $scope.reports.currentReportMinToDate = moment().startOf('month').format(goalFactory.datePickerFormatString);
        $scope.reports.currentReportsTypeIDArray = reportsFactory.currentReportsTypeIDArray;
        // TODO: This variable is static now - could be removed
        $scope.reports.currentReportsPeriodText = 'days';
        $scope.reports.accountDropdownSettings = {
            displayProp: 'username',
            enableSearch: true,
            smartButtonMaxItems: 5,
            externalIdProp: ''
        };
        $scope.reports.accountDropdownTexts = {
            buttonDefaultText: 'Select Users',
            dynamicButtonTextSuffix: 'selected',
            checkAll: 'Select All',
            uncheckAll: 'Deselect All'
        };
        $scope.reports.numberOfMonthsCurrentlyInReportView = 0;
        $scope.reports.reportMonthCounterArray = [0];
        $scope.reports.numberOfYearsCurrentlyInReportView = 0;
        $scope.reports.reportYearCounterArray = [0];
        $scope.reports.goalReportShowDetails = false;
        $scope.reports.notesToToggleStatus = [];
        
        var rewardsTableParamDefaults = {
            sorting: {
                goalTypeID: 'asc'
            },
            count: 100
        };

        $scope.reports.selectedReportsUserArray = [];
        var thisUserAccount = accountFactory.accounts[userFactory.currentUser.id];

        if (userFactory.currentUser.isManager()) {
            angular.forEach(accountFactory.accounts, function(account){
                if (userFactory.currentUser.id !== account.id) {
                    $scope.reports.selectedReportsUserArray.push(account);
                }
            });
        }
        else {
            if (thisUserAccount) {
                $scope.reports.selectedReportsUserArray.push(thisUserAccount);
                $scope.reports.showUser[thisUserAccount.id] = true;
                $scope.reports.showGroup.everyone = true;
            }
        }

        // This function is used to reset both radio buttons (filters) at once
        $scope.reports.coachingReportSetAllNotes = function() {
            $scope.reports.coachingReportFilters.private = '';
            $scope.reports.coachingReportFilters.managerID = '';
        };

        // This function used in reports per_group_reports.html to highlight notes editable by the logged in user.
        $scope.reports.isThisNoteEditableByLoggedInUser = function(note) {
            if (note !== undefined) {
                var isManagerNote = noteFactory.isManagerNote(note);
                var isThisUsersNote = noteFactory.isThisUsersNote(note);
                var isCurrentUserManagerOfNote = noteFactory.isCurrentUserManagerOfNote(note);
                /*
                A manager should not be able to edit a user's notes.
                A user should not be able to edit manager's notes.
                */
                if ((!isThisUsersNote && !isCurrentUserManagerOfNote)||(isThisUsersNote && isManagerNote)) {
                    return false;
                }
            
            return true;
        
            }

        };

        $scope.reports.isUserInUserArray = function(user) {
            var userIndex = _.findIndex($scope.reports.selectedReportsUserArray, function(userItem) {
                return userItem.id == user.id;
            });
            if (userIndex !== -1) {
                return true;
            }
            else {
                return false;
            }
        };

        var noteDateAndUserFilter = function(note, index, array) {
            var fromTimestamp = goalFactory.getStartOfMonthDateFromDateUsingMonthDiff($scope.reports.currentReportFromDate, 0).getTime();
            var toTimestamp = goalFactory.getEndOfMonthDateFromDateUsingMonthDiff($scope.reports.currentReportToDate, 0).getTime();
            var correctDate = (note.timestamp >= fromTimestamp) && (note.timestamp <= toTimestamp);

            return correctDate && $scope.reports.isUserInUserArray({id: note.userID});
        };

        $scope.reports.coachingReportFilters = {
            userID: $scope.reports.selectedReportsUserArray,
            managerID: '',
            private: ''
        };
        $scope.reports.coachingTableParams = new NgTableParams({
            sorting: {
                timestamp: 'asc'
            },
            filter: $scope.reports.coachingReportFilters,
            count: 100000
        }, {
            counts: [],
            filterDelay: 0,
            getData: function($defer, params) {
                // The orderObjectBy filter is used to get an array from the notes object (for sorting and pagination)
                var inputData = $filter('orderObjectBy')(noteFactory.visibleNotesFlatObject, '');
                var filteredFilter = {};
                // This is necessary because I want the directive to watch the userID array but not filter on it in the 1st pass
                angular.forEach(params.filter(), function(obj, key) {
                    if (key !== 'userID') {
                        filteredFilter[key] = obj;
                    }
                });
                var filteredData = params.filter() ? $filter('filter')(inputData, filteredFilter) : inputData;
                // Now the data gets a 2nd filter for user and date
                filteredData = $filter('filter')(filteredData, noteDateAndUserFilter);
                var currentOrderBy = params.orderBy();
                var currentReverse = null;

                // Setup custom sorting for userID and managerID to actually sort by username (not id)
                if (params.sorting().userID !== undefined) {
                    currentOrderBy = function(note) {
                        return accountFactory.accounts[note.userID].username;
                    };
                    currentReverse = (params.sorting().userID === 'desc');
                }
                if (params.sorting().managerID !== undefined) {
                    currentOrderBy = function(note) {
                        if (!note.managerID && note.managerID !== 0) {
                            return '';
                        }
                        else {
                            return accountFactory.accounts[note.managerID].username;
                        }
                    };
                    currentReverse = (params.sorting().managerID === 'desc');
                }
                // Setup custom sorting for timestamp so it isn't considered a string
                if (params.sorting().timestamp !== undefined) {
                    currentOrderBy = function(note) {
                        return note.timestamp;
                    };
                    currentReverse = (params.sorting().timestamp === 'desc');
                }

                var orderedData = params.sorting() ? $filter('orderBy')(filteredData, currentOrderBy, currentReverse) : filteredData;
                $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                return $defer.promise;
            }
        });

        // This function uses the ids from the group object to get the actual account objects
        // Using getManagers will include users listed as managers of the group
        // Using getMembers will include users listed as members of the group
        $scope.reports.getUsersFromGroup = function(groupID, getManagers, getMembers) {
            var returnUsers = {};
            var group = accountFactory.allGroups[groupID];
            if (getManagers) {
                angular.forEach(group.managers, function(value, userID) {
                    if (accountFactory.accounts[userID]) {
                        returnUsers[userID] = accountFactory.accounts[userID];
                    }
                });
            }
            if (getMembers) {
                if (groupID === 'everyone') {
                    angular.forEach(accountFactory.accounts, function(user) {
                        returnUsers[user.id] = user;
                    });
                }
                else {
                    angular.forEach(group.members, function(value, userID) {
                        if (accountFactory.accounts[userID]) {
                            returnUsers[userID] = accountFactory.accounts[userID];
                        }
                    });
                }
            }
            return returnUsers;
        };

        /*
        The claim table get data function is separate from the makeRewardsTableGetData function because the getGoalRewardObjectArray
        function should be called on each getData call.
        */
        var claimTableGetData = function($defer, params) {
            var dateToStart = goalFactory.getEndOfMonthDateFromDateUsingMonthDiff($scope.reports.currentReportToDate);
            var inputData = goalFactory.getGoalRewardObjectArray(dateToStart, $scope.reports.reportMonthCounterArray);
            var filteredData = $filter('filter')(inputData, $scope.filter);
            var currentOrderBy = params.orderBy();
            var currentReverse = null;

            if (params.sorting().claimReport !== undefined) {
                currentOrderBy = function(goalReward) {
                    if ((goalReward.progress != 100) || !goalReward.reward) {
                        return -1;
                    }
                    if (goalReward.claimDate) {
                        return 0;
                    }
                    return 1;
                };
                currentReverse = (params.sorting().claimReport === 'desc');
            }
            if (params.sorting().progressDate !== undefined) {
                currentOrderBy = function(goalReward) {
                    return moment(goalReward.progressDateString);
                };
                currentReverse = (params.sorting().progressDate === 'desc');
            }

            var orderedData = params.sorting() ? $filter('orderBy')(filteredData, currentOrderBy, currentReverse) : filteredData;
            $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
        };

        var filterByInactivityInCurrentReport = function(goal) {
            return goalFactory.isGoalActiveOnDate(goal, $scope.reports.currentReportToDate, 'month');
        };

        var rewardTableGetData = function($defer, params) {
            var goalArray = $filter('filter')(goalFactory.currentUserAllGoalsFlatArray, function(goal) {
                // We return the goals that have goal type other than 1 (Day)
                // or that have hideInRewards undefined or false
                if (goal.goalTypeID == 1) {
                    return false;
                }
                else {
                    return !goal.hideInRewards;
                }
            });
            var inputData = $filter('filter')(goalArray, filterByInactivityInCurrentReport);
            var filteredData = $filter('filter')(inputData, $scope.filter);
            var currentOrderBy = params.orderBy();
            var currentReverse = null;
            if (params.sorting().rewards !== undefined) {
                currentOrderBy = function(goal) {
                    var rewardsForGoal = $scope.reports.getRewardsForGoalOnCurrentReportWithIndex(goal, 0);
                    if (!rewardsForGoal) { return ''; }
                    var firstRewardKey = (Object.keys(rewardsForGoal)[0]);
                    if (!firstRewardKey) { return ''; }
                    var firstReward = rewardsForGoal[firstRewardKey];
                    return firstReward.rewardText;
                };
                currentReverse = (params.sorting().rewards === 'desc');
            }
            if (params.sorting().progress !== undefined) {
                currentOrderBy = function(goal) {return parseInt($scope.reports.getPercentageCompleteForCurrentReportWithIndex(goal, 0));};
                currentReverse = (params.sorting().progress === 'desc');
            }
            if (params.sorting().claimMain !== undefined) {
                currentOrderBy = function(goal) {
                    if ($scope.reports.getPercentageCompleteForCurrentReportWithIndex(goal, 0) != 100) {
                        return -1;
                    }
                    if (!($scope.reports.getRewardsForGoalOnCurrentReportWithIndex(goal, 0))) {
                        return -1;
                    }
                    var rewardsForGoal = $scope.reports.getRewardsForGoalOnCurrentReportWithIndex(goal, 0);
                    if (!rewardsForGoal) { return 1; }
                    var firstRewardKey = (Object.keys(rewardsForGoal)[0]);
                    if (!firstRewardKey) { return 1; }
                    var firstReward = rewardsForGoal[firstRewardKey];
                    var claimStatus = $scope.reports.getGoalRewardClaimedDateWithIndex(goal, firstReward, 0);
                    if (claimStatus) {
                        // This is 0 because it corresponds to the sort display that we want in the table
                        return 0;
                    }
                    return 1;
                };
                currentReverse = (params.sorting().claimMain === 'desc');
            }

            var orderedData = params.sorting() ? $filter('orderBy')(filteredData, currentOrderBy, currentReverse) : filteredData;
            /* and can resolve table promise  */
            $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
        };

        $scope.reports.claimTableParams = new NgTableParams(rewardsTableParamDefaults, {
            counts: [],
            getData: claimTableGetData
        });
        $scope.reports.rewardTableParams = new NgTableParams(rewardsTableParamDefaults, {
            counts: [],
            getData: rewardTableGetData
        });

        /*
        if ((userFactory.currentUser.role === 'admin')||(userFactory.currentUser.role === 'manager')) {
            angular.forEach(accountFactory.accounts, function(account) {
                if (account.id !== userFactory.currentUser.id) {
                    $scope.reports.selectedReportsUserArray.push(account);
                }
            });
        }
        */

        $scope.reports.getGoalRecurrenceStringWithIndex = function(goal, monthIndex) {
            var dateToCheck = goalFactory.getEndOfMonthDateFromDateUsingMonthDiff($scope.reports.currentReportToDate, monthIndex);
            return goalFactory.getGoalRecurrenceStringOnDate(goal, dateToCheck);
        };

        $scope.reports.getRecurrenceArrayForGoalBasedOnCurrentDateRange = function(goal) {

            return goalFactory.getRecurrenceArrayForGoalBasedOnStartDateAndMonthIndexArray(goal, $scope.reports.currentReportToDate, $scope.reports.reportMonthCounterArray);
        };

        $scope.reports.toggleShowClaimReport = function() {
            $scope.reports.showClaimReport = !$scope.reports.showClaimReport;
            if (!$scope.reports.showClaimReport) {
                $scope.reports.setViewToCurrentMonth();
            }
            else {
                $scope.reports.setViewToLatestSixMonths();
            }
        };

        /*
        When a new reward row is added, the logic is to check if it is complete in the current view month
        and add it to the unclaimed id list if it is complete. Note that it only applies for the current view month because
        in a future or past period it should be a different reward id.
        */
        $scope.reports.addAdditionalRewardRow = function(goal, monthIndex) {
            if (monthIndex === undefined) {
                monthIndex = 0;
            }
            var dateToAdd = goalFactory.getEndOfMonthDateFromDateUsingMonthDiff($scope.reports.currentReportToDate, monthIndex);
            var addToUnclaimedList = false;
            var thisPercentage = $scope.reports.getPercentageCompleteForCurrentReportWithIndex(goal, 0);

            if (thisPercentage === '100') {
                addToUnclaimedList = true;
            }

            goalFactory.addRewardToGoalInRecurrenceOnDate(goal, '', addToUnclaimedList, dateToAdd);
        };

        $scope.reports.openRemoveRewardModal = function(goal, reward, index, monthIndex) {
            if (monthIndex === undefined) {
                monthIndex = 0;
            }
            var dateToRemove = goalFactory.getEndOfMonthDateFromDateUsingMonthDiff($scope.reports.currentReportToDate, monthIndex);
            if (reward.managerID) {
                return;
            }
            if (reward.rewardText === '') {
                $scope.reports.removeReward(goal, reward, index, monthIndex);
            }
            else {
                var modalDataObject = {};
                modalDataObject.goal = goal;
                modalDataObject.reward = reward;
                modalDataObject.index = index;
                return $modal.open({
                    animation: true,
                    templateUrl: 'static/views/modals/delete_reward.html',
                    controller: function ($scope, modalData) {
                        $scope.rewardModal = {};
                        $scope.rewardModal.modalData = modalData;
                    },
                    scope: $scope,
                    resolve: {
                        modalData: function($q) {
                            return $q.when(modalDataObject);
                        }
                    }
                });
            }
        };

        $scope.reports.removeReward = function(goal, reward, index, monthIndex) {
            if (monthIndex === undefined) {
                monthIndex = 0;
            }
            var dateToRemove = goalFactory.getEndOfMonthDateFromDateUsingMonthDiff($scope.reports.currentReportToDate, monthIndex);

            goalFactory.removeRewardFromGoalInRecurrenceOnDate(goal, reward, dateToRemove);
        };

        /*
        This function will be called for a particular reward row in the reward module (based on the displayed date plus monthIndex).
        Note that the reward module does not deal with daily goals and only displays one month at a time.
        */
        $scope.reports.toggleGoalRewardClaimedWithIndex = function(goal, reward, monthIndex, goalRewardObject) {
            var earnedRecurrenceDate = goalFactory.getEndOfMonthDateFromDateUsingMonthDiff($scope.reports.currentReportToDate, monthIndex);
            goalFactory.toggleGoalRewardClaimedForDate(goal, reward, earnedRecurrenceDate, goalRewardObject);
        };

        /*
        This function will be called for a particular reward row in the reward module (based on the displayed date with month index).
        Note that the reward module does not deal with daily goals.
        */
        $scope.reports.getGoalRewardClaimedDateWithIndex = function(goal, reward, monthIndex) {
            var dateToCheck = goalFactory.getEndOfMonthDateFromDateUsingMonthDiff($scope.reports.currentReportToDate, monthIndex);
            return goalFactory.getGoalRewardClaimedDateInRecurrenceOnDate(goal, reward, dateToCheck);
        };

        $scope.reports.isNoteUnread = function(noteID) {
            return reportsFactory.isNoteUnread(noteID);
        };

        $scope.reports.toggleNoteReadStatus = function(noteID) {
            
            if (reportsFactory.isNoteUnread(noteID)) {
                reportsFactory.markNoteRead(noteID);
            }
            else {
                reportsFactory.markNoteUnread(noteID);
            }
        };
       /*
       We keep an array of checkboxes that have been clicked so that we can push the changes
       to Firebase after the Unread Manager Notes modal has closed. This keeps the checked notes
       visible until the user closes the modal.
       */
        $scope.reports.addNoteToToggleList = function(noteID, e) {

            if ($scope.reports.notesToToggleStatus === undefined) {
               $scope.reports.notesToToggleStatus = [];
            }
            $scope.reports.notesToToggleStatus.push([noteID, e.target.checked]);

        };
        
        $scope.$on('modal.closing', function(){
           for(var i = 0; i < $scope.reports.notesToToggleStatus.length; i++) {

               if ($scope.reports.notesToToggleStatus[i][1]) {
                reportsFactory.markNoteRead($scope.reports.notesToToggleStatus[i][0]);
            } else {
                reportsFactory.markNoteUnread($scope.reports.notesToToggleStatus[i][0]);
            }
           }
        });
        /*
        This function works by looking at the current to date and using the monthIndex passed in to get the month that is needed.
        Then the get notes function is called specifying that only a certain month's notes should be returned.
        */
        $scope.reports.getCurrentReportNotesForUserByMonthIndex = function(userID, monthIndex) {
            var notesDate = goalFactory.getDateFromDateUsingMonthDiff($scope.reports.currentReportToDate, monthIndex);

            // Since reports are based on a whole month, send a date format parameter to only match on month and year
            return noteFactory.getSingleUserNotes(userID, notesDate, 'MM/yyyy');
        };
        
        $scope.reports.getUnreadNotesForSingleUser = function(userID) {

            return noteFactory.getUnreadNotes(userID);
        };
        
        $scope.reports.shouldHighLightDate = function(day) {
            /* We won't highlight a day if multiple months are selected */
            if ($scope.reports.reportMonthCounterArray.length > 1) {
                return "";
            }
            /* We won't highlight a day unless the report is on the current month */
            var currentMonthAsMoment = moment($scope.reports.startOfCurrentDate, goalFactory.datePickerFormatString);
            if (!(currentMonthAsMoment.isSame($scope.reports.currentReportToDate))) {
                return "";
            }

            /* If the day passed in matches today's day of the month, return the highlight class */
            if (day === moment().date()) {
                return "highlight";
            }

            return "";
        };

        /*
        This function is used in the reports_tables view to determine what css class to assign to the <td>
        elements inside of the daily goal report table.
        Returning nothing or an empty string means the element will just have a blank, white background.
        day is the column index in the table being created, monthIndex is a setting for reports with multiple months shown
        */
        $scope.reports.colorDailySquare = function(day, goal, monthIndex, isLast) {
            if (day <= 0) {
                return '';
            }
            var goalColor = goalFactory.getGoalColor(goal);

            var dateFromCurrentToWithIndex = goalFactory.getDateFromDateUsingMonthDiff($scope.reports.currentReportToDate, monthIndex);

            dateFromCurrentToWithIndex.setDate(day);

            // The daily goal will only get a color square if it is active on this date
            if (goalFactory.isGoalActiveOnDate(goal, dateFromCurrentToWithIndex)) {
                var isGoalComplete = goalFactory.isGoalCompleteOnDate(goal, dateFromCurrentToWithIndex);
                // If it is a one-time goal then we have to see if it was completed that exact day
                if (goal.singleGoalCompletion) {
                    var progressDateString = goalFactory.getGoalProgressStringInRecurrenceOnDate(goal, dateFromCurrentToWithIndex);
                    var thisDateString = (moment(dateFromCurrentToWithIndex).format('DD-MMM-YYYY'));

                    if ((progressDateString === thisDateString)&&(isGoalComplete)) {
                        if (goalColor == 'White') {
                            goalColor = 'lightgrey';
                        }
                        return 'background-color: '+goalColor+'!important;';
                    }
                }
                // If the competion date string is not blank for this inputDate it means the goal is complete
                // on this day.
                else if (isGoalComplete) {
                    if (goalColor == 'White') {
                        goalColor = 'lightgrey';
                    }
                    return 'background-color: '+goalColor+'!important;';
                }
            }
            else if (!isLast) {
                return 'background-color: #888888!important;';
            }

            return '';
        };

        $scope.reports.colorPercentageSquare = function(columnIndex, goal, monthIndex) {
            /* In the reports view, the columnIndex will be one higher than it should be (0% doesn't get colored) */
            if (columnIndex <= 0) {
                columnIndex = -1;
            }
            return goalFactory.colorPercentageSquare(columnIndex, goal, monthIndex, $scope.reports.currentReportToDate, false);
        };

        $scope.reports.getRewardsGoalProgressStyles = function(goal) {
            var returnStyle = {};
            returnStyle.width = $scope.reports.getPercentageCompleteForCurrentReportWithIndex(goal, 0)+'%';
            returnStyle['background-color'] = goal.color;
            returnStyle.border = "1px solid "+goal.color;
            return returnStyle;
        };

        $scope.reports.setViewToLatestSixMonths = function() {
            $scope.reports.currentReportFromDate = moment().startOf('month').startOf('day').toDate();
            $scope.reports.currentReportToDate = moment().startOf('day').toDate();

            var calcFrom = moment($scope.reports.currentReportFromDate).add(-5, 'months');
            $scope.reports.currentReportFromDate = calcFrom.toDate();

            $scope.reports.updateToFromAndMinMaxDates();
        };

        $scope.reports.setViewToCurrentMonth = function() {
            $scope.reports.currentReportFromDate = moment().startOf('month').startOf('day').toDate();
            $scope.reports.currentReportToDate = moment().startOf('day').toDate();
            $scope.reports.updateToFromAndMinMaxDates();
        };

        $scope.reports.setViewByMonthDiff = function(monthDiff) {
            var momentOfCurrentFromDate = moment($scope.reports.currentReportFromDate);
            var momentOfCurrentToDate = moment($scope.reports.currentReportToDate);
            var calcFrom;
            var calcTo;

            var endOfLastMonth = moment().subtract(1, 'month').endOf('month').startOf('day');
            /* This handles the case of going forward from full month to month to date */
            if ((monthDiff === 1)&&(momentOfCurrentToDate.isSame(endOfLastMonth))) {
                calcTo = moment().startOf('day');
            }
            else {
                calcTo = momentOfCurrentToDate.add(monthDiff, 'months').endOf('month').startOf('day');
            }
            calcFrom = momentOfCurrentFromDate.add(monthDiff, 'months'); 

            $scope.reports.currentReportFromDate = calcFrom.toDate();
            $scope.reports.currentReportToDate = calcTo.toDate();
            $scope.reports.updateToFromAndMinMaxDates();
        };

        $scope.reports.openReportsDatePickers = function(event, from) {
            event.preventDefault();
            event.stopPropagation();

            $scope.reports.reportsFromDatePickerOpened = from;
            $scope.reports.reportsToDatePickerOpened = !from;
        };

        $scope.reports.monthPickerOptions = {
            minMode: 'month'
        };

        $scope.reports.getPercentageCompleteForCurrentReportWithIndex = function(goal, monthIndex) {
            var returnPercentage;

            /* If the recurrenceFormat includes the day's date then the percentage complete for the month is calculated else it is queried */
            if (goalFactory.allGoalTypes[goal.goalTypeID].recurranceFormat === "DD-MMM-YYYY") {

                var completions = $scope.reports.getGoalCompletionNumberForCurrentReportMonthsWithIndex(goal, monthIndex);
                var daysInTheMonth = $scope.reports.getDaysForCurrentReportMonthsWithIndex(monthIndex);
                returnPercentage = Math.round((completions / daysInTheMonth)*100) + "";
            }
            else {
                var dateFromIndex = goalFactory.getEndOfMonthDateFromDateUsingMonthDiff($scope.reports.currentReportToDate, monthIndex);
                returnPercentage = goalFactory.getGoalCompletionPercentageInRecurrenceOnDate(goal, dateFromIndex);
            }
            return returnPercentage;
        };

        $scope.reports.getRewardsForGoalOnCurrentReportWithIndex = function(goal, monthIndex) {
            var dateFromIndex = goalFactory.getEndOfMonthDateFromDateUsingMonthDiff($scope.reports.currentReportToDate, monthIndex);
            return goalFactory.getRewardsForGoalInRecurrenceOnDate(goal, dateFromIndex);
        };

        $scope.reports.rewardTextChanged = function(goal, reward, monthIndex) {
            var dateFromIndex = goalFactory.getEndOfMonthDateFromDateUsingMonthDiff($scope.reports.currentReportToDate, monthIndex);
            var goalRecurrenceStringOnDate = goalFactory.getGoalRecurrenceStringOnDate(goal, dateFromIndex);
            var rewardsRef = goalFactory.getRewardsRefUsingRecurrenceString(goal, goalRecurrenceStringOnDate);

            rewardsRef.child(reward.id).set(reward);
        };

        $scope.reports.getDaysForCurrentReportMonthsWithIndex = function(monthIndex) {
            return goalFactory.getReportDaysUsingDateWithMonthDiff($scope.reports.currentReportToDate, monthIndex);
        };

        $scope.reports.getGoalCompletionNumberForCurrentReportMonthsWithIndex = function(goal, monthIndex) {
            var startOfIndexedMonth = goalFactory.getStartOfMonthDateFromDateUsingMonthDiff($scope.reports.currentReportToDate, monthIndex);
            var endOfIndexedMonth = goalFactory.getEndOfMonthDateFromDateUsingMonthDiff($scope.reports.currentReportToDate, monthIndex);

            return goalFactory.getGoalCompletionsForDateRange(goal, startOfIndexedMonth, endOfIndexedMonth);
        };

        $scope.reports.getMonthStringUsingCurrentToAndDiff = function(monthDiff) {
            var calculatedDate = goalFactory.getMomentFromDateUsingMonthDiff($scope.reports.currentReportToDate, monthDiff);
            return calculatedDate.format("MMM-YYYY");
        };

        $scope.reports.getDateStringWithGoalAndIndex = function(goal, monthIndex) {
            var momentToCheck = goalFactory.getMomentFromDateUsingMonthDiff($scope.reports.currentReportToDate, monthIndex);
            var dateStringFormat = goalFactory.getGoalsTypeRecurrenceFormat(goal);
            return momentToCheck.format(dateStringFormat);
        };

        $scope.reports.getDateFromDateUsingMonthDiff = function (date, monthDiff) {
            return goalFactory.getDateFromDateUsingMonthDiff(date, monthDiff);
        };


        var updateReportDatePickerMinAndMax = function() {
            $scope.reports.currentReportMaxFromDate = moment($scope.reports.currentReportToDate).format(goalFactory.datePickerFormatString);
            $scope.reports.currentReportMinToDate = moment($scope.reports.currentReportFromDate).format(goalFactory.datePickerFormatString);
        };

        var updateFromDate = function() {
            $scope.reports.numberOfMonthsCurrentlyInReportView = moment($scope.reports.currentReportToDate).diff($scope.reports.currentReportFromDate, 'month');
            $scope.reports.reportMonthCounterArray.splice(0);
            for (var index = $scope.reports.numberOfMonthsCurrentlyInReportView; index >= 0; index--) {
                $scope.reports.reportMonthCounterArray.push(index);
            }
            $scope.reports.numberOfYearsCurrentlyInReportView = (moment($scope.reports.currentReportToDate)).startOf('year').diff((moment($scope.reports.currentReportFromDate).startOf('year')), 'year');
            $scope.reports.reportYearCounterArray.splice(0);
            for (index = 0; index <= $scope.reports.numberOfYearsCurrentlyInReportView; index++) {
                $scope.reports.reportYearCounterArray.push(index);
            }
        };
        var updateToDate = function () {
            if ((moment($scope.reports.currentReportToDate).format('MM-YYYY')) === (moment().format('MM-YYYY'))) {
                    $scope.reports.currentReportToDate = moment().startOf('day').toDate();
            }
            else {
                $scope.reports.currentReportToDate = moment($scope.reports.currentReportToDate).endOf('month').startOf('day').toDate();
            }
        };

        $scope.reports.updateToFromAndMinMaxDates = function() {
            updateToDate();
            updateFromDate();
            updateReportDatePickerMinAndMax();

            $scope.reports.rewardTableParams.reload();
            $scope.reports.claimTableParams.reload();
            $scope.reports.coachingTableParams.reload();
        };

        $scope.reports.toggleGoalReportDetails = function() {
            $scope.reports.goalReportShowDetails = !$scope.reports.goalReportShowDetails;
        };

        //TODO: this is a temporary measure
        $scope.reports.getCurrentReportGoals = function(goalTypeID, userID) {
            if (userID === userFactory.currentUser.id) {
                if (!goalFactory.currentUserGoals) { return {}; }
                if (goalFactory.currentUserGoals[goalTypeID] === undefined) { return {}; }
                return goalFactory.currentUserGoals[goalTypeID];
            }
            else {
                if (goalFactory.allPublicGoals[userID] === undefined) { return {}; }
                if (goalFactory.allPublicGoals[userID][goalTypeID] === undefined) { return {}; }
                return goalFactory.allPublicGoals[userID][goalTypeID];
            }
        };

    });

})();
