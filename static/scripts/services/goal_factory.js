(function () {
    'use strict';

    angular.module('goalgrid').factory('goalFactory', ['$q', '$filter', '$firebaseObject', 'accountFactory', 'firebaseFactory', function($q, $filter, $firebaseObject, accountFactory, firebaseFactory) {
        var goalFactory = {};

        var defaultGoalTypesRef = firebaseFactory.firebaseRef.child('defaultGoalTypes');
        var thisUserGoalDataRef = firebaseFactory.thisUserRef.child('goalData');
        var thisUserGoalsRef = thisUserGoalDataRef.child('goals');
        goalFactory.linkSettings = {};

        //TODO: this is just for demo data
        var momentStartToday = moment().startOf('day');
        var momentStartMonth = moment().startOf('month');
        var momentStartYear = moment().startOf('year');
        var momentStartTwoYears = moment().startOf('year').subtract(1, 'years');
        var hardCodedCompletedStartDateRanges = {
            1: { range: 0 },
            2: { range: momentStartMonth.diff(momentStartToday, 'days') },
            3: { range: momentStartYear.diff(momentStartToday, 'days') },
            4: { range: momentStartTwoYears.diff(momentStartToday, 'days') }
        };
        var hardCodeDailyCompletedToday = moment().startOf('day').toDate();

        //TODO: will want to put something in here like a 'timeUnit' property?
        var hardCodedGoalTypes = {
            1: {"id": 1, "name": "Day", "recurranceFormat": "DD-MMM-YYYY", "defaultColor": "Lime",
                "displayPercentage": false},
            2: {"id": 2, "name": "Month", "recurranceFormat": "MMM-YYYY", "defaultColor": "MistyRose",
                "displayPercentage": true},
            3: {"id": 3, "name": "Year", "recurranceFormat": "YYYY", "defaultColor": "Cyan",
                "displayPercentage": true},
            4: {"id": 4, "name": "Life", "recurranceFormat": "none", "defaultColor": "MediumSpringGreen",
                "displayPercentage": true}
        };
        goalFactory.hardCodedGoalCategoryColors = {
            1: {
                "id": 1,
                "category": "Physical / Health",
                "color": "#CBB0F3"
            },
            2: {
                "id": 2,
                "category": "Mind / Intellect",
                "color": "#B0B1F4"
            },
            3: {
                "id": 3,
                "category": "Work / Career",
                "color": "#EBCCA5"
            },
            4: {
                "id": 4,
                "category": "Financial",
                "color": "#EFB0A9"
            },
            5: {
                "id": 5,
                "category": "Social / Community",
                "color": "#F4F3B0"
            },
            6: {
                "id": 6,
                "category": "Family",
                "color": "#B1F4AF"
            },
            7: {
                "id": 7,
                "category": "Spiritual",
                "color": "#B0F4F3"
            },
            8: {
                "id": 8,
                "category": "Personal / Other",
                "color": "#F1F2F3"
            },
          };
        goalFactory.colorPaletteChoices = [
            ['White', 'Lime', 'MistyRose', 'Cyan', 'MediumSpringGreen'],
            ['DarkOrange', 'DeepPink', 'Yellow', 'Chartreuse', 'CornFlowerBlue'],
            ['SkyBlue', 'Aquamarine', 'Coral', 'CornSilk', 'Fuchsia'],
            ['Gold', 'GreenYellow', 'HoneyDew', 'Khaki', 'LightSteelBlue'],
            ['PaleTurquoise', 'Orange', 'Tomato', 'Wheat', 'Thistle']
        ];
        /*
            Idea so far is goals object is first indexed by user id, then goal type id, and then goal id.
        */
        // TODO: probably will want to put something in here like 'inactiveDate'?
        var hardCodedGoals = {
            1: {
                1: {
                    1: {"id": 1, "userID": 1, "goalTypeID": 1,
                        "rewards": [],
                        "goalText": "Private daily not done",
                        "linkedGoalIds": [],
                        "private": true, "completed": false},
                    2: {"id": 2, "userID": 1, "goalTypeID": 1,
                        "rewards": [],
                        "goalText": "Daily that is done",
                        "linkedGoalIds": [],
                        "private": false, "completed": true}
                },
                2: {
                    3: {"id": 3, "userID": 1, "goalTypeID": 2,
                        "rewards": [],
                        "goalText": "Private Monthly not done",
                        "linkedGoalIds": [],
                        "private": true, "completed": false},
                    4: {"id": 4, "userID": 1, "goalTypeID": 2,
                        "rewards": [],
                        "goalText": "Private Monthly that is done",
                        "linkedGoalIds": [],
                        "private": true, "completed": true}
                },
                3: {
                    5: {"id": 5, "userID": 1, "goalTypeID": 3,
                        "rewards": [],
                        "goalText": "Private Yearly not done",
                        "linkedGoalIds": [],
                        "private": true, "completed": false},
                    6: {"id": 6, "userID": 1, "goalTypeID": 3,
                        "rewards": [],
                        "goalText": "Private Yearly that is done",
                        "linkedGoalIds": [],
                        "private": true, "completed": true}
                },
                4: {
                    7: {"id": 7, "userID": 1, "goalTypeID": 4,
                        "rewards": [],
                        "goalText": "Private Lifetime not done",
                        "linkedGoalIds": [],
                        "private": true, "completed": false},
                    8: {"id": 8, "userID": 1, "goalTypeID": 4,
                        "rewards": [],
                        "goalText": "Private Lifetime that is done",
                        "linkedGoalIds": [],
                        "private": true, "completed": true},
                    9: {"id": 9, "userID": 1, "goalTypeID": 4,
                        "rewards": [],
                        "goalText": "Private Lifetime not done",
                        "linkedGoalIds": [],
                        "private": true, "completed": false},
                    10: {"id": 10, "userID": 1, "goalTypeID": 4,
                         "rewards": [],
                         "goalText": "Private Lifetime that is done",
                         "linkedGoalIds": [],
                         "private": true, "completed": true},
                    11: {"id": 11, "userID": 1, "goalTypeID": 4,
                         "rewards": [],
                         "goalText": "Private Lifetime not done",
                         "linkedGoalIds": [],
                         "private": true, "completed": false},
                    12: {"id": 12, "userID": 1, "goalTypeID": 4,
                         "rewards": [],
                         "goalText": "Private Lifetime that is done",
                         "linkedGoalIds": [],
                         "private": true, "completed": true},
                    13: {"id": 13, "userID": 1, "goalTypeID": 4,
                         "rewards": [],
                         "goalText": "Private Lifetime not done",
                         "linkedGoalIds": [],
                         "private": true, "completed": false},
                    14: {"id": 14, "userID": 1, "goalTypeID": 4,
                         "rewards": [],
                         "goalText": "Private Lifetime that is done",
                         "linkedGoalIds": [],
                         "private": true, "completed": true}
                }
            },
            3: {
                1: {
                    15: {"id": 15, "userID": 3, "goalTypeID": 1,
                         "rewards": [],
                        "goalText": "30 minutes of yoga or treadmill",
                         "linkedGoalIds": [{"id": 17}, {"id": 22}, {"id": 27}],
                         'linkColor': 'darkorange',
                        "private": true, "completed": false},
                    16: {"id": 16, "userID": 3, "goalTypeID": 1,
                         "rewards": [],
                        "goalText": "Visualize success and be in peak state before all appointments",
                         "linkedGoalIds": [],
                        "private": false, "completed": true},
                    17: {"id": 17, "userID": 3, "goalTypeID": 1,
                         "rewards": [],
                         "goalText": "Eat healthy at least one meal",
                         "linkedGoalIds": [{"id": 15}, {"id": 22}, {"id": 27}],
                         'linkColor': 'darkorange',
                         "private": true, "completed": false},
                    18: {"id": 18, "userID": 3, "goalTypeID": 1,
                         "rewards": [],
                         "goalText": "Properly hydrate every 2 hours",
                         "linkedGoalIds": [],
                         "private": true, "completed": true},
                    19: {"id": 19, "userID": 3, "goalTypeID": 1,
                         "rewards": [],
                         "goalText": "Be smiling when meeting each new client",
                         "linkedGoalIds": [],
                         "private": false, "completed": false},
                    20: {"id": 20, "userID": 3, "goalTypeID": 1,
                         "rewards": [],
                         "goalText": "1 hour of quality time with the children",
                         "linkedGoalIds": [],
                         "private": true, "completed": true}
                },
                2: {
                    21: {"id": 21, "userID": 3, "goalTypeID": 2,
                         "rewards": [],
                        "goalText": "Finish studying this month's script",
                         "linkedGoalIds": [],
                        "private": false, "completed": false},
                    22: {"id": 22, "userID": 3, "goalTypeID": 2,
                         "rewards": [{"id": 22, "rewardText": "Massage"}],
                         "goalText": "Lose 5 pounds",
                         "linkedGoalIds": [{"id": 15},{"id": 17},{"id": 27}],
                         'linkColor': 'darkorange',
                         "private": true, "completed": true},
                    23: {"id": 23, "userID": 3, "goalTypeID": 2,
                         "rewards": [],
                         "goalText": "Help new sales personnel by sharing my office with them",
                         "linkedGoalIds": [],
                         "private": false, "completed": true},
                    24: {"id": 24, "userID": 3, "goalTypeID": 2,
                         "rewards": [{"id": 24, "rewardText": "Dinner at Mala"}, {"id": 25, "rewardText": "New Shoes"}, {"id": 26, "managerID": "2", "rewardText": "Manager created reward"}],
                         "goalText": "$300,000 in sales volume",
                         "linkedGoalIds": [{"id": 26}, {"id": 32}],
                         'linkColor': 'deeppink',
                         "private": false, "completed": false},
                    25: {"id": 25, "userID": 3, "goalTypeID": 2,
                         "rewards": [],
                        "goalText": "Work one Sunday each month in the homeless shelter",
                         "linkedGoalIds": [],
                        "private": true, "completed": false}
                },
                3: {
                    26: {"id": 26, "userID": 3, "goalTypeID": 3,
                         "rewards": [{"id": 28, "rewardText": "New Car!"}],
                        "goalText": "$3,000,000 in sales volume",
                         "linkedGoalIds": [{"id": 24},{"id": 32}],
                         'linkColor': 'deeppink',
                        "private": false, "completed": false},
                    27: {"id": 27, "userID": 3, "goalTypeID": 3,
                         "rewards": [{"id": 29, "rewardText": "Massage"}],
                        "goalText": "Complete the Maui Marathon",
                         "linkedGoalIds": [{"id": 15}, {"id": 17}, {"id": 22}],
                         'linkColor': 'darkorange',
                        "private": true, "completed": true},
                    28: {"id": 28, "userID": 3, "goalTypeID": 3,
                         "rewards": [],
                         "goalText": "Learn how to stand-up paddle",
                         "linkedGoalIds": [],
                         "private": true, "completed": true},
                    29: {"id": 29, "userID": 3, "goalTypeID": 3,
                         "rewards": [],
                         "goalText": "Take the family on vacation to Italy",
                         "linkedGoalIds": [],
                         "private": true, "completed": true}
                },
                4: {
                    30: {"id": 30, "userID": 3, "goalTypeID": 4,
                         "rewards": [],
                        "goalText": "Teach at a college",
                         "linkedGoalIds": [],
                        "private": true, "completed": false},
                    31: {"id": 31, "userID": 3, "goalTypeID": 4,
                         "rewards": [{"id": 33, "rewardText": "Dinner at Mala"}, {"id": 34, "rewardText": "New couch"}],
                        "goalText": "Become the Director of Sales",
                         "linkedGoalIds": [],
                        "private": false, "completed": true},
                    32: {"id": 32, "userID": 3, "goalTypeID": 4,
                         "rewards": [],
                        "goalText": "Net worth = $10,000,000",
                         "linkedGoalIds": [{"id": 24}, {"id": 26}],
                         'linkColor': 'deeppink',
                        "private": true, "completed": false}
                }
            }
        };

        goalFactory.currentUserGoals = {};
        /*
        The following object holds all goals returned by the server (including other users' non-private goals if you're a manager).
        */
        goalFactory.visibleGoalsFlatObject = {};
        goalFactory.allPublicGoals = {};
        goalFactory.newGoal = {};
        goalFactory.currentUserAllGoalsFlatArray = [];
        goalFactory.allGoalTypes = hardCodedGoalTypes;
        goalFactory.defaultNoLinkPathColor = "lightgrey";
        goalFactory.newlinkPathColorIndex = 10;
        goalFactory.datePickerFormatString = 'DD-MMMM-YYYY';
        goalFactory.currentEdit = {};
        goalFactory.currentGoalModalType = {};
        // No more linking
        //goalFactory.linkGroups = {};
        goalFactory.unclaimedRewardIDs = [];
        /* the hardcoded links will result in groups like so:
        'darkorange': [{"id": 15}, {"id": 17}, {"id": 22}, {"id": 27}],
        'deeppink': [{"id": 24}, {"id": 26}, {"id": 32}]
        */

        goalFactory.getGoalFirebaseRefFromGoal = function(goal){
            return thisUserGoalsRef.child(goal.goalTypeID).child(goal.id);
        };

        goalFactory.getGoalCompletionStructureRef = function(goal, goalRecurrenceStringOnDate){
            return goalFactory.getGoalFirebaseRefFromGoal(goal).child('completed/dates/'+goalRecurrenceStringOnDate);
        };

        goalFactory.getRewardsRefUsingRecurrenceString = function(goal, goalRecurrenceStringOnDate){
            return goalFactory.getGoalCompletionStructureRef(goal, goalRecurrenceStringOnDate).child('/rewards');
        };

        /*
        Note that the inputDate is date and time (and Firebase represents them as timestamp values).
        This function makes sure that the input date is valid for the goal's
        inactiveBefore and inactiveAfter values. The optional timeUnit parameter can be string like 'day', 'month', etc.
        */
        goalFactory.isGoalActiveOnDate = function(goal, inputDate, timeUnit) {
            var validForInactiveBefore = true;
            var validForInactiveAfter = true;
            var momentOfInputDate = moment(inputDate);
            if (timeUnit === undefined) {
                timeUnit = 'millisecond';
            }

            if (goal.inactiveBeforeTimestamp) {
                validForInactiveBefore = momentOfInputDate.isAfter(goal.inactiveBeforeTimestamp, timeUnit);
                if ((!validForInactiveBefore)&&(momentOfInputDate.isSame(goal.inactiveBeforeTimestamp, timeUnit))) {
                    validForInactiveBefore = true;
                }
            }
            if (goal.inactiveAfterTimestamp) {
                validForInactiveAfter = momentOfInputDate.isBefore(goal.inactiveAfterTimestamp, timeUnit);
                if ((!validForInactiveAfter)&&(momentOfInputDate.isSame(goal.inactiveAfterTimestamp, timeUnit))) {
                    validForInactiveAfter = true;
                }
            }

            return (validForInactiveBefore && validForInactiveAfter);
        };

        /*
        Daily goals can't have rewards right now, so that logic is hardcoded into this function.
        This function accepts an initial date and an array of month indices to retrieve claim status objects
        */
        goalFactory.getGoalRewardObjectArray = function(inputDate, monthIndexArray) {
            var returnArray = [];

            angular.forEach(goalFactory.currentUserAllGoalsFlatArray, function(goal) {
                if (goal.goalTypeID !== 1) {
                    var monthIndexArrayForGoal = goalFactory.getRecurrenceArrayForGoalBasedOnStartDateAndMonthIndexArray(goal, inputDate, monthIndexArray);
                    angular.forEach(monthIndexArrayForGoal, function(monthIndex) {
                        var thisDate = goalFactory.getDateFromDateUsingMonthDiff(inputDate, monthIndex);

                        angular.forEach(goalFactory.getRewardsForGoalInRecurrenceOnDate(goal, thisDate), function(reward) {
                            var goalRewardObject = {};

                            var thisProgress = goalFactory.getGoalCompletionPercentageInRecurrenceOnDate(goal, thisDate);
                            var thisProgressDateString = goalFactory.getGoalProgressStringInRecurrenceOnDate(goal, thisDate);
                            var thisClaimDate = goalFactory.getGoalRewardClaimedDateInRecurrenceOnDate(goal, reward, thisDate);

                            goalRewardObject.goal = goal;
                            goalRewardObject.reward = reward;
                            goalRewardObject.progress = thisProgress;
                            goalRewardObject.progressDateString = thisProgressDateString;
                            goalRewardObject.claimDate = thisClaimDate;
                            goalRewardObject.monthIndex = monthIndex;

                            returnArray.push(goalRewardObject);
                        });
                    });
                }
            });
            return returnArray;
        };

        goalFactory.removeRewardIDFromUnclaimedList = function(rewardID) {
            var indexOfRewardID = _.indexOf(goalFactory.unclaimedRewardIDs, rewardID);
            if (indexOfRewardID !== -1) {
                goalFactory.unclaimedRewardIDs.splice(indexOfRewardID, 1);
            }
        };

        goalFactory.addRewardIDToUnclaimedList = function(rewardID) {
            goalFactory.unclaimedRewardIDs.push(rewardID);
        };

        goalFactory.addRewardToGoalInRecurrenceOnDate = function(goal, rewardText, addToUnclaimedList, inputDate) {
            var goalRecurrenceStringOnDate = goalFactory.getGoalRecurrenceStringOnDate(goal, inputDate);

            if (goal.completed === undefined) {
                goal.completed = {};
            }
            if ((goal.completed.dates === undefined)){
                goal.completed.dates = {};
            }
            if (goal.completed.dates[goalRecurrenceStringOnDate] === undefined) {
                goal.completed.dates[goalRecurrenceStringOnDate] = {};
            }
            if (goal.completed.dates[goalRecurrenceStringOnDate].rewards === undefined) {
                goal.completed.dates[goalRecurrenceStringOnDate].rewards = {};
            }

            var newRewardRef = goalFactory.getRewardsRefUsingRecurrenceString(goal, goalRecurrenceStringOnDate).push();
            var newReward = {id: newRewardRef.key, rewardText: rewardText};

            goal.completed.dates[goalRecurrenceStringOnDate].rewards[newReward.id] = newReward;
            newRewardRef.set(newReward);

            if (addToUnclaimedList) {
                goalFactory.addRewardIDToUnclaimedList(newReward.id);
            }
        };

        goalFactory.removeRewardFromGoalInRecurrenceOnDate = function(goal, reward, inputDate) {
            var goalRecurrenceStringOnDate = goalFactory.getGoalRecurrenceStringOnDate(goal, inputDate);

            goalFactory.removeRewardIDFromUnclaimedList(reward.id);

            if (goal.completed === undefined) {
                return;
            }
            if ((goal.completed.dates === undefined)){
                return;
            }
            if (goal.completed.dates[goalRecurrenceStringOnDate] === undefined) {
                return;
            }
            if (goal.completed.dates[goalRecurrenceStringOnDate].rewards === undefined) {
                return;
            }
            delete goal.completed.dates[goalRecurrenceStringOnDate].rewards[reward.id];
            goalFactory.getRewardsRefUsingRecurrenceString(goal, goalRecurrenceStringOnDate).child(reward.id).set(null);
        };

        /*
        This function is used in the reports_tables view to determine what css class to assign to the <td>
        elements inside of a percentage-based goal report table. It is also used in the main Monthly/Yearly/Lifetime views.
        Returning nothing or an empty string means the element will just have a blank, white background.
        columnIndex is the column index in the table being created (in the reports controller it has to subtract one),
        monthIndex is a setting for reports with multiple months shown
        considerLinkColor is a setting to determine if the goal's custom color should be used (reporting) or if link color is a factor (grid view)
        */
        goalFactory.colorPercentageSquare = function(columnIndex, goal, monthIndex, referenceDate, considerLinkColor) {
            var percentage = (columnIndex)*10;

            if (percentage < 0) {
                return '';
            }

            var dateFromIndex = goalFactory.getEndOfMonthDateFromDateUsingMonthDiff(referenceDate, monthIndex);
            var goalCompletionPercentage = goalFactory.getGoalCompletionPercentageInRecurrenceOnDate(goal, dateFromIndex);

            if (percentage > parseInt(goalCompletionPercentage)) {
                return '';
            }

            return 'background-color: '+goalFactory.getGoalColor(goal)+' !important;';
        };

        /*
        getGoalColor is used to figure out what color a goal should be depending on link path coding setting
        and the goal type color settings.
        */
        goalFactory.getGoalColor = function(goal) {
            if (goal.category) {
                goal.coloredByLinkPath = false;
                var retCol = goalFactory.hardCodedGoalCategoryColors[goal.category.id].color;
                return retCol;
            } else {
                var currentGoalType = goalFactory.allGoalTypes[goal.goalTypeID];
                return currentGoalType.defaultColor;
            }
        };

        /*
        recolorGoals looks through all goals and recolors depending on the function of getGoalColor.
        This function used to be important for the flowchart link view approach but is less often used now with link groups.
        */
        goalFactory.recolorGoals = function() {
            angular.forEach(goalFactory.currentUserAllGoalsFlatArray, function (goal) {
                var oldColor = goal.color;
                var theColor = goalFactory.getGoalColor(goal);
                goal.color = theColor;
                // Commenting out the save to Firebase functionality because
                // this setting is not going to be commonly used. And only applies
                // to the grid view.
                /*if (theColor !== oldColor) {
                    (goalFactory.getGoalFirebaseRefFromGoal(goal)).child('color').set(theColor);
                }*/
            });
            //thisUserGoalDataRef.child('linkSettings/colorCodeByLinkPath').set(goalFactory.linkSettings.colorCodeByLinkPath);
        };

        goalFactory.resetNewGoal = function (goalTypeID) {
            var goalType = goalFactory.allGoalTypes[goalTypeID];
            goalFactory.newGoal.goalTypeID = goalTypeID;
            goalFactory.newGoal.completed = {};
            goalFactory.newGoal.private = false;
            // No more linkgroups
            /*
            if (goalFactory.newGoal.linkedGoalIds) {
                goalFactory.newGoal.linkedGoalIds.splice(0);
            }
            else {
                goalFactory.newGoal.linkedGoalIds = [];
            }*/
            goalFactory.newGoal.goalText = '';
            goalFactory.newGoal.customColor = goalType.defaultColor;
            // No more link groups
            //goalFactory.newGoal.linkColor = undefined;
            goalFactory.newGoal.singleGoalCompletion = true;
            goalFactory.newGoal.hideInRewards = true;
            if (goalType.recurByDefault) {
                goalFactory.newGoal.singleGoalCompletion = false;
            }
            else {
                goalFactory.newGoal.singleGoalCompletion = true;
            }
            
            // Check for type of goal and create appropirate recur obj defaults
            if (goalType.name !== 'Lifetime') {
                goalFactory.newGoal.recur = {};
                goalFactory.newGoal.recur.frequencyCount = 1;
            }
            if (goalType.name === 'Activities') {
                goalFactory.newGoal.recur.repeatType = 'days';
            }
            else if (goalType.name === 'Monthly') {
                goalFactory.newGoal.recur.repeatType = 'months';
            }
            else if (goalType.name === 'Yearly') {
                goalFactory.newGoal.recur.repeatType = 'years';
            }

            if (goalType.autoHideIncompleteOneTimeGoalsByDefault) {
                goalFactory.newGoal.autoHideIncompleteOneTimeGoals = true;
            }
            else {
                goalFactory.newGoal.autoHideIncompleteOneTimeGoals = false;
            }
            if (goalType.displayPercentage) {
                goalFactory.newGoal.checkboxCompletion = false;
            }
            else {
                goalFactory.newGoal.checkboxCompletion = true;
            }
        };
        goalFactory.resetGoalModal = function (goalTypeID) {
            goalFactory.currentGoalModalType = goalFactory.allGoalTypes[goalTypeID];
            goalFactory.resetNewGoal(goalTypeID);
            goalFactory.currentEdit = {};
        };

        /* Goal and date helper functions */
        goalFactory.getGoalsTypeRecurrenceFormat = function(goal) {
            return goalFactory.allGoalTypes[goal.goalTypeID].recurranceFormat;
        };
        goalFactory.getReportDaysUsingDateWithMonthDiff = function(date, monthIndex) {
            var endOfIndexedMonth;
            var startOfIndexedMonth;

            /* If the monthIndex is 0 then this call is expecting today's date instead of the end of this month */
            if (monthIndex === 0) {
                endOfIndexedMonth = moment(date).startOf('day');
                startOfIndexedMonth = moment(goalFactory.getStartOfMonthDateFromDateUsingMonthDiff(date, monthIndex));
                /* Add one to get literal days because the diff is not inclusive */
                return (endOfIndexedMonth.diff(startOfIndexedMonth, 'days'))+1;
            }
            else {
                /* The procedure is first to get the month we care about,
                then add a month, and calculate the number in the month of the last day */
                var monthMoment = goalFactory.getMomentFromDateUsingMonthDiff(date, monthIndex);
                monthMoment.add(1, 'month');
                return (new Date(monthMoment.year(), monthMoment.month(), 0)).getDate();
            }
        };
        goalFactory.isGoalYearlyOrLifeTime = function(goal) {
            return ((goalFactory.isGoalLifeTime(goal))||(goalFactory.isGoalYearly(goal)));
        };
        goalFactory.isGoalDaily = function(goal) {
            return (goalFactory.allGoalTypes[goal.goalTypeID].recurranceFormat === 'DD-MMM-YYYY');
        };
        goalFactory.isGoalMonthly = function(goal) {
            return (goalFactory.allGoalTypes[goal.goalTypeID].recurranceFormat === 'MMM-YYYY');
        };
        goalFactory.isGoalYearly = function(goal) {
            return (goalFactory.allGoalTypes[goal.goalTypeID].recurranceFormat === 'YYYY');
        };
        goalFactory.isGoalLifeTime = function(goal) {
            return (goalFactory.allGoalTypes[goal.goalTypeID].recurranceFormat === 'none');
        };
        goalFactory.getDateFromDateUsingMonthDiff = function(date, monthIndex) {
            return goalFactory.getMomentFromDateUsingMonthDiff(date, monthIndex).toDate();
        };
        goalFactory.getMomentFromDateUsingMonthDiff = function(date, monthDiff) {
            var calculatedDate = moment(angular.copy(date)).subtract(monthDiff, 'months');
            return calculatedDate;
        };
        goalFactory.getStartOfMonthDateFromDateUsingMonthDiff = function(date, monthIndex) {
            var startOfCurrentToMonth = moment(date).startOf('month').toDate();
            return goalFactory.getDateFromDateUsingMonthDiff(startOfCurrentToMonth, monthIndex);
        };
        goalFactory.getEndOfMonthDateFromDateUsingMonthDiff = function(date, monthIndex) {
            var startOfCurrentToMonth = moment(date).endOf('month').startOf('day').toDate();
            return goalFactory.getDateFromDateUsingMonthDiff(startOfCurrentToMonth, monthIndex);
        };
        /*--------------------------------*/

        goalFactory.getGoalRecurrenceStringOnDate = function(goal, inputDate) {
            var thisGoalTypeRecurranceFormatString = goalFactory.getGoalsTypeRecurrenceFormat(goal);
            var goalRecurrenceStringOnDate;
            // The singleGoalCompletion property means that the goal's progress/completion/rewards
            // should be treated the same as lasting a lifetime (ie, "one-time" or "recur-until-complete").
            if (goal.singleGoalCompletion) {
                goalRecurrenceStringOnDate = '0';
            }
            else if (!thisGoalTypeRecurranceFormatString || thisGoalTypeRecurranceFormatString === 'none')
                goalRecurrenceStringOnDate = '0';
            else
                goalRecurrenceStringOnDate = moment(inputDate).format(thisGoalTypeRecurranceFormatString);
            return goalRecurrenceStringOnDate;
        };

        /*
        This function takes a goal, a startDate, and an array of possibly relevant month indices. The function
        will use a combination of the goal's active date ranges and the recurrence format of the goal
        to return a filtered array of month indices where the goal was active and where it had unique
        recurrence string values. Note that it is just used by reports, so it only works for month-based views.
        */
        goalFactory.getRecurrenceArrayForGoalBasedOnStartDateAndMonthIndexArray = function(goal, startDate, monthIndexArray) {
            var returnArray = [];
            var recurrenceColection = {};

            angular.forEach(monthIndexArray, function(monthIndex) {
                var dateToCheck = goalFactory.getEndOfMonthDateFromDateUsingMonthDiff(startDate, monthIndex);
                var recurrenceStringOnDate = goalFactory.getGoalRecurrenceStringOnDate(goal, dateToCheck);
                var isGoalActiveInMonth = goalFactory.isGoalActiveOnDate(goal, dateToCheck, 'month');
                var validMonth = isGoalActiveInMonth && !recurrenceColection[recurrenceStringOnDate];

                // One-time goals ignore the unique recurrence requirement because they have
                // one recurrence but can have multiple months
                if (goal.singleGoalCompletion) {
                    validMonth = isGoalActiveInMonth;
                }

                if (validMonth) {
                    recurrenceColection[recurrenceStringOnDate] = true;
                    returnArray.push(monthIndex);
                }
            });

            return returnArray;
        };

        /* This function isn't used currently but can be used in the case that the view needs ng-model for a percentage */
        /*
        goalFactory.getGoalRecurrenceStringOnDateFromGoalType = function(goalTypeID, inputDate) {
            var placeholderGoal = {};
            placeholderGoal.goalTypeID = goalTypeID;
            return goalFactory.getGoalRecurrenceStringOnDate(placeholderGoal, inputDate);
        };
        */

        goalFactory.isGoalCompleteOnDate = function(goal, inputDate) {
            var goalRecurrenceStringOnDate = goalFactory.getGoalRecurrenceStringOnDate(goal, inputDate);
            if ((goal.completed === undefined)||(goal.completed.dates === undefined))
                return false;
            else if ((goal.completed.dates[goalRecurrenceStringOnDate])&&(goal.completed.dates[goalRecurrenceStringOnDate].percentage === "100"))
                return true;
            else
                return false;
        };

        /*
        The inputDate is used to find the key in the goal completion structure for what completion/date the reward was earned.
        But then the time right now is used as the value so that in the future we can run reports to see when the reward was marked claimed.
        If there is already a value for this claim then it should be deleted (to toggle the reward to unclaimed).
        goalRewardObject is optional and will only be used in the claim report view to update the view
        */
        goalFactory.toggleGoalRewardClaimedForDate = function(goal, reward, inputDate, goalRewardObject) {
            var goalRecurrenceStringOnDate = goalFactory.getGoalRecurrenceStringOnDate(goal, inputDate);

            /*
            if (goal.completed.dates[goalRecurrenceStringOnDate] === undefined) {
                console.error('Failed to toggle reward claimed status for reward that doesn\'t exist');
                return;
            }
            else if (goal.completed.dates[goalRecurrenceStringOnDate].rewards === undefined) {
                console.error('Failed to toggle reward claimed status for reward that doesn\'t exist');
                return;
            }
            else if (goal.completed.dates[goalRecurrenceStringOnDate].rewards[reward.id] === undefined) {
                console.error('Failed to toggle reward claimed status for reward that doesn\'t exist');
                return;
            }
            else {*/
            if (goal.completed.dates[goalRecurrenceStringOnDate]) {
                //if (goal.completed.dates[goalRecurrenceStringOnDate].rewards[reward.id].claimDate) {
                if (goal.completed.dates[goalRecurrenceStringOnDate][reward.id]) {
                    delete goal.completed.dates[goalRecurrenceStringOnDate][reward.id];
                    //delete goal.completed.dates[goalRecurrenceStringOnDate].rewards[reward.id].claimDate;
                    if (goalRewardObject) { delete goalRewardObject.claimDate; }
                    goalFactory.unclaimedRewardIDs.push(reward.id);
                }
                else {
                    var claimDate = new Date();
                    //goal.completed.dates[goalRecurrenceStringOnDate].rewards[reward.id].claimDate = claimDate;
                    goal.completed.dates[goalRecurrenceStringOnDate][reward.id] = claimDate;
                    if (goalRewardObject) { goalRewardObject.claimDate = claimDate; }
                    goalFactory.removeRewardIDFromUnclaimedList(reward.id);
                }
            }
        };

        goalFactory.getGoalRewardClaimedDateInRecurrenceOnDate = function(goal, reward, inputDate) {
            var goalRecurrenceStringOnDate = goalFactory.getGoalRecurrenceStringOnDate(goal, inputDate);
            if (goal.completed.dates[goalRecurrenceStringOnDate] === undefined) {
                return false;
            }
            // Though this code is currently unused - it is intended to replace the current rewards storage pattern
            /*else if (goal.completed.dates[goalRecurrenceStringOnDate].rewards === undefined) {
                return false;
            }
            else if (goal.completed.dates[goalRecurrenceStringOnDate].rewards[reward.id] === undefined) {
                return false;
            }
            */
            else {
                return goal.completed.dates[goalRecurrenceStringOnDate][reward.id];
                //return goal.completed.dates[goalRecurrenceStringOnDate].rewards[reward.id].claimDate;
            }
        };

        /*
        Based on the goal period of the goal (day, month, etc) and an inputDate this function
        will return either the timestamp of the first millisecond in the goal's period of the inputDate
        or it will return the timestamp of the last millisecond of the goal's period if parameter end is true
        */
        var getEndOrStartOfGoalsPeriodUsingDate = function(goal, inputDate, end) {
            var returnTimestamp = null;
            var momentOfDate = moment(inputDate);
            var periodOfGoal = null;
            if (goalFactory.isGoalDaily(goal)) {
                periodOfGoal = 'day';
            }
            else if (goalFactory.isGoalMonthly(goal)) {
                periodOfGoal = 'month';
            }
            else if (goalFactory.isGoalYearly(goal)) {
                periodOfGoal = 'year';
            }
            if (periodOfGoal) {
                if (end === 'end') {
                    returnTimestamp = momentOfDate.endOf(periodOfGoal).valueOf();
                }
                else {
                    returnTimestamp = momentOfDate.startOf(periodOfGoal).valueOf();
                }
            }
            return returnTimestamp;
        };
        goalFactory.getEndOrStartOfGoalsPeriodUsingDate = getEndOrStartOfGoalsPeriodUsingDate;

        goalFactory.markGoalProgressOnDate = function(goal, progress, inputDate) {
            var goalRecurrenceStringOnDate = goalFactory.getGoalRecurrenceStringOnDate(goal, inputDate);
            var needToAddRewardsToUnclaimed = false;
            var needToRemoveRewardsFromUnclaimed = false;
            var timeRightNow = new Date();

            if (goal.completed === undefined) {
                goal.completed = {};
                goal.completed.dates = {};
            }
            if (goal.completed.dates === undefined) {
                goal.completed.dates = {};
            }

            if (goal.completed.dates[goalRecurrenceStringOnDate]) {
                if (goal.completed.dates[goalRecurrenceStringOnDate].percentage === '100') {
                    if (progress !== '100') {
                        needToRemoveRewardsFromUnclaimed = true;
                    }
                }
                else if (progress === '100') {
                    needToAddRewardsToUnclaimed = true;
                }
            }
            else {
                goal.completed.dates[goalRecurrenceStringOnDate] = {};
                if (progress === '100') {
                    needToAddRewardsToUnclaimed = true;
                }
            }

            // Note that the input date was used to calculate recurrence but the current
            // system datetime is used in the actual object
            goal.completed.dates[goalRecurrenceStringOnDate].date = timeRightNow;
            goal.completed.dates[goalRecurrenceStringOnDate].percentage = progress;
            if (needToAddRewardsToUnclaimed || needToRemoveRewardsFromUnclaimed) {
                angular.forEach(goal.completed.dates[goalRecurrenceStringOnDate].rewards, function(reward) {
                    if (needToAddRewardsToUnclaimed) {
                        goalFactory.unclaimedRewardIDs.push(reward.id);
                    }
                    if (needToRemoveRewardsFromUnclaimed) {
                        goalFactory.removeRewardIDFromUnclaimedList(reward.id);
                    }
                });
            }

            var thisProgressRef = goalFactory.getGoalCompletionStructureRef(goal, goalRecurrenceStringOnDate);
            thisProgressRef.child('date').set(timeRightNow.getTime());
            thisProgressRef.child('percentage').set(progress);

            if (goal.singleGoalCompletion) {
                if (progress === '100') {
                    goal.inactiveAfterTimestamp = getEndOrStartOfGoalsPeriodUsingDate(goal, inputDate, 'end');
                }
                else if (progress === '0'){
                    goal.inactiveAfterTimestamp = null;
                }
                goalFactory.getGoalFirebaseRefFromGoal(goal).child('inactiveAfterTimestamp').set(goal.inactiveAfterTimestamp);
            }
        };

        goalFactory.getGoalCompletionPercentageInRecurrenceOnDate = function(goal, inputDate) {
            var goalRecurrenceStringOnDate = goalFactory.getGoalRecurrenceStringOnDate(goal, inputDate);

            if ((goal.completed === undefined)||(goal.completed.dates === undefined)) {
                return '0';
            }
            else if (goal.completed.dates[goalRecurrenceStringOnDate] === undefined) {
                return '0';
            }
            else if (goal.completed.dates[goalRecurrenceStringOnDate].percentage === undefined) {
                return '0';
            }
            else {
                return goal.completed.dates[goalRecurrenceStringOnDate].percentage;
            }
        };

        goalFactory.getRewardsForGoalInRecurrenceOnDate = function(goal, inputDate) {
            var goalRecurrenceStringOnDate = goalFactory.getGoalRecurrenceStringOnDate(goal, inputDate);

            if ((goal.completed === undefined)||(goal.completed.dates === undefined)) {
                return {};
            }
            else if (goal.completed.dates[goalRecurrenceStringOnDate] === undefined) {
                return {};
            }
            else {
                return goal.completed.dates[goalRecurrenceStringOnDate].rewards;
            }
        };

        /*
        Note that the goalFactory.getGoalProgressStringInRecurrenceOnDate function returns the date string that progress was made
        (not necessarily the date it was 100%)
        */
        goalFactory.getGoalProgressStringInRecurrenceOnDate = function(goal, inputDate) {
            var goalRecurrenceStringOnDate = goalFactory.getGoalRecurrenceStringOnDate(goal, inputDate);

            if ((goal.completed === undefined)||(goal.completed.dates === undefined)) {
                return '';
            }
            else if ((goal.completed.dates[goalRecurrenceStringOnDate]) === undefined)
                return '';
            else
                return(moment(goal.completed.dates[goalRecurrenceStringOnDate].date).format('DD-MMM-YYYY'));
        };

        /*  This code goes through each of the hardcoded goals and replaces the simple true/false for completion
            with a string of today's date with the goal type's recurrence format the as a key and an object of
            the completion date and percentage of 100 for the value.
        */
        /*
        angular.forEach(hardCodedGoals, function(userWithGoals) {
            angular.forEach(userWithGoals, function(goalType) {
                angular.forEach(goalType, function(goal) {
                    var randValue;
                    var daysInThePast;
                    var completedDate;
                    var goalRecurrenceStringOnDate;

                    // Good chance to set a goal's color to default here
                    goal.color = getGoalColor(goal);
                    goalFactory.getGoalColor(goal) = goal.color;
                    if (goal.linkColor) {
                        if (!goalFactory.linkGroups[goal.linkColor]) {
                            goalFactory.linkGroups[goal.linkColor] = [];
                        }
                        goalFactory.linkGroups[goal.linkColor].push({id: goal.id});
                    }

                    if (goal.completed) {
                        goal.completed = {};
                        goal.completed.dates = {};

                        randValue = Math.random() * hardCodedCompletedStartDateRanges[goal.goalTypeID].range;
                        daysInThePast = Math.round(randValue);
                        completedDate = (moment().startOf('day').add(daysInThePast, 'days')).toDate();

                        goalRecurrenceStringOnDate = goalFactory.getGoalRecurrenceStringOnDate(goal, completedDate);
                        goal.completed.dates[goalRecurrenceStringOnDate] = {};
                        goal.completed.dates[goalRecurrenceStringOnDate].date = completedDate.getTime();
                        goal.completed.dates[goalRecurrenceStringOnDate].percentage = "100";
                        if (goal.rewards.length) {
                            goal.completed.dates.rewards = {};
                        }
                        angular.forEach(goal.rewards, function(reward) {
                            goal.completed.dates.rewards[reward.id] = reward;
                            var claimed = (Math.random() <= 0.5);
                            if (claimed) {
                                goal.completed.dates[goalRecurrenceStringOnDate][reward.id] = completedDate.getTime();
                            }
                            else {
                                goalFactory.unclaimedRewardIDs.push(reward.id);
                            }
                        });
                    }
                    else {
                        goal.completed = {};
                        goal.completed.dates = {};
                        if (hardCodedGoalTypes[goal.goalTypeID].displayPercentage) {
                            randValue = Math.random() * hardCodedCompletedStartDateRanges[goal.goalTypeID].range;
                            daysInThePast = Math.round(randValue);
                            completedDate = (moment().startOf('day').add(daysInThePast, 'days')).toDate();

                            goalRecurrenceStringOnDate = goalFactory.getGoalRecurrenceStringOnDate(goal, completedDate);
                            goal.completed.dates[goalRecurrenceStringOnDate] = {};
                            goal.completed.dates[goalRecurrenceStringOnDate].date = completedDate.getTime();
                            if (Math.random() >= 0.5) {
                                goal.completed.dates[goalRecurrenceStringOnDate].percentage = "50";
                            }
                            else {
                                goal.completed.dates[goalRecurrenceStringOnDate].percentage = "0";
                            }
                        }
                    }
                    //TODO: I think we want all GG operations to eventually happen on a flat object
                    //(instead of on the object structured inside of user and goal type ids). That will
                    //take a little refactoring so for now we can use a temporary extra variable for
                    //linking.
                    goalFactory.visibleGoalsFlatObject[goal.id] = goal;
                });
            });
        });
        */

        goalFactory.getGoalCompletionsForDateRange = function(goal, start, end) {
            var completionCounter = 0;
            if (goal.completed) {
                angular.forEach(goal.completed.dates, function (key, dateString) {
                    if ((key.percentage)&&(key.percentage === "100")) {
                        var momentToCompare = moment(key.date);
                        var momentOfStart = moment(start);
                        var momentOfEnd = moment(end);

                        if ((momentToCompare.diff(momentOfStart, 'days') >= 0)&&(momentToCompare.diff(momentOfEnd, 'days') <= 0)) {
                            completionCounter++;
                        }
                    }
                });
            }
            return completionCounter;
        };

        goalFactory.getGoalTypes = function() {
            var defObj = $q.defer();
            // Putting this code here to make sure FB locations are right
            thisUserGoalDataRef = firebaseFactory.thisUserRef.child('goalData');
            thisUserGoalsRef = thisUserGoalDataRef.child('goals');
            thisUserGoalDataRef.once("value", function(snapshot) {
              var thisUserGoalDataObj = snapshot.val();
              if (thisUserGoalDataObj && thisUserGoalDataObj.linkSettings) {
                  goalFactory.linkSettings.colorCodeByLinkPath = thisUserGoalDataObj.linkSettings.colorCodeByLinkPath;
              }
          });

            defaultGoalTypesRef.once("value", function(snapshot) {
                goalFactory.allGoalTypes = {};
                var index = 1;
                angular.forEach(snapshot.val(), function(goalType) {
                    if (goalType.id) {
                        goalFactory.allGoalTypes[goalType.id] = goalType;
                        index = goalType.id;
                    }
                });
                // Check if 1 is a proper id for a goal type, else use the last one we know is valid
                if (goalFactory.allGoalTypes[1]) {
                    index = 1;
                }
                goalFactory.currentGoalModalType = goalFactory.allGoalTypes[index];

                defObj.resolve(goalFactory.allGoalTypes);
            });

            return defObj.promise;
        };

        goalFactory.currentUserGoals = {};

        goalFactory.getAllPublicGoals = function() {
            var defObj = $q.defer();

            if ((accountFactory.currentUserData.role == 'admin') || (accountFactory.currentUserData.role == 'manager')) {
                goalFactory.allPublicGoals = {};

          // All of this code was written around the idea of restructuring the firebase structure and may be used in the future
            if ((accountFactory.currentUserData.groups && accountFactory.currentUserData.groups.managerOf)||(accountFactory.currentUserData.role == 'admin')) {
                var groupIDsToCheck = {};
                if (accountFactory.currentUserData.role === 'admin') {
                    angular.forEach(accountFactory.allGroups, function(group) {
                        groupIDsToCheck[group.id] = true;
                    });
                }
                else {
                    groupIDsToCheck = accountFactory.currentUserData.groups.managerOf;
                }
                angular.forEach(groupIDsToCheck, function(value, groupID) {
                    var thisGroup = accountFactory.allGroups[groupID];
                    if (thisGroup.members) {
                        angular.forEach(thisGroup.members, function(value, userID) {
                            goalFactory.allPublicGoals[userID] = {};
                            firebaseFactory.usersRef.child(userID).once("value", function(snapshot) {
                                if (snapshot) {
                                    var user = snapshot.val();
                                    var thisUserGoalTypes = {};
                                    if (user.goalData) {
                                        thisUserGoalTypes = user.goalData.goals;
                                    }
                                    angular.forEach(thisUserGoalTypes, function(goalType) {
                                        angular.forEach(goalType, function(goal) {
                                            if (!goal.private) {
                                                if (goalFactory.allPublicGoals[user.userData.id] === undefined) {
                                                    goalFactory.allPublicGoals[user.userData.id]= {};
                                                }
                                                if (goalFactory.allPublicGoals[user.userData.id][goal.goalTypeID] === undefined) {
                                                    goalFactory.allPublicGoals[user.userData.id][goal.goalTypeID] = {};
                                                }
                                                goalFactory.allPublicGoals[user.userData.id][goal.goalTypeID][goal.id] = goal;
                                            }
                                        });
                                    });
                                }
                            });
                        });
                    }
                });
                }

                firebaseFactory.usersRef.once("value", function(snapshot) {
                    var usersObj = snapshot.val();
                    angular.forEach(usersObj, function(user) {
                        if (user.id) {
                            goalFactory.allPublicGoals[user.userData.id] = {};
                            var thisUserGoalTypes = {};
                            if (user.goalData) {
                                thisUserGoalTypes = user.goalData.goals;
                            }
                            angular.forEach(thisUserGoalTypes, function(goalType) {
                                angular.forEach(goalType, function(goal) {
                                    if (!goal.private) {
                                        if (goalFactory.allPublicGoals[user.userData.id][goal.goalTypeID] === undefined) {
                                            goalFactory.allPublicGoals[user.userData.id][goal.goalTypeID] = {};
                                        }
                                        goalFactory.allPublicGoals[user.userData.id][goal.goalTypeID][goal.id] = goal;
                                    }
                                });
                            });
                        }
                    });

                    defObj.resolve(goalFactory.allPublicGoals);
                });
            }
            else {
                goalFactory.allPublicGoals = {};
                defObj.resolve(goalFactory.allPublicGoals);
            }

            return defObj.promise;
        };

        // Visible goals will eventually be based on the date of the view (because of inactive status)
        goalFactory.getVisibleGoals = function(user) {
            var defObj = $q.defer();
            if (user.managerOf) {
            }
            else {
                thisUserGoalDataRef.child('goals').once("value", function(snapshot) {
                    var thisUserGoalsResult = snapshot.val();
                    goalFactory.currentUserGoals = {};
                    if (thisUserGoalsResult) {
                        goalFactory.currentUserGoals = thisUserGoalsResult;
                    }
                    angular.forEach(goalFactory.currentUserGoals, function(goalType, recurrenceKey) {
                        angular.forEach(goalType, function(goal) {
                            goalFactory.currentUserAllGoalsFlatArray.push(goal);
                            goalFactory.visibleGoalsFlatObject[goal.id] = goal;
                            // No more link groups
                            /*
                            if (goal.linkColor) {
                                if (!goalFactory.linkGroups[goal.linkColor]) {
                                    goalFactory.linkGroups[goal.linkColor] = [];
                                }
                                goalFactory.linkGroups[goal.linkColor].push({id: goal.id});
                            }*/
                        });
                    });
                });
            }
            defObj.resolve(goalFactory.currentUserGoals);
            return defObj.promise;
        };

        /*
        This function takes a goal type as input and returns a new array of the user's goals without that goal type in it.
        */
        goalFactory.filterOutOneTypeOfGoal = function(goalTypeID) {
            return $filter('filter')(goalFactory.currentUserAllGoalsFlatArray, {goalTypeID: "!"+goalTypeID}, false);
        };

        /*
        This function takes a goal type as input and returns a new array of the user's goals of that type.
        */
        goalFactory.filterOnTypeOfGoal = function(goalTypeID) {
            return $filter('filter')(goalFactory.currentUserAllGoalsFlatArray, {goalTypeID: goalTypeID}, false);
        };

        // No longer used because we don't have link groups anymore
        /*var removeGoalFromLinkGroup = function (linkGroup, goalID) {
            if (goalFactory.linkGroups[linkGroup]) {
                _.remove(goalFactory.linkGroups[linkGroup], { 'id': goalID });
                angular.forEach(goalFactory.linkGroups[linkGroup], function(linkedGoalID) {
                    var linkedGoal = goalFactory.visibleGoalsFlatObject[linkedGoalID.id];
                    _.remove(linkedGoal.linkedGoalIds, { 'id': goalID });
                });
            }
        };
        var addGoalToLinkGroup = function (linkGroup, goalID) {
            if (!goalFactory.linkGroups[linkGroup]) {
                goalFactory.linkGroups[linkGroup] = [];
            }
            angular.forEach(goalFactory.linkGroups[linkGroup], function(linkedGoalID) {
                var linkedGoal = goalFactory.visibleGoalsFlatObject[linkedGoalID.id];
                if (linkedGoal.linkedGoalIds === undefined) {linkedGoal.linkedGoalIds = [];}
                linkedGoal.linkedGoalIds.push({ id: goalID });
            });
            goalFactory.linkGroups[linkGroup].push({ id: goalID });
        };
        */

        goalFactory.addGoal = function (goal, viewDateAdded) {
            var defObj = $q.defer();
            goal.id = thisUserGoalsRef.push().key;
            goal.completed = {};
            goal.completed.dates = {};

            // No more link groups
            /*
            if (goal.linkColor) {
                if (!goalFactory.linkGroups[goal.linkColor]) {
                    goalFactory.linkGroups[goal.linkColor] = [];
                }

                goal.linkedGoalIds = angular.copy(goalFactory.linkGroups[goal.linkColor]);

                addGoalToLinkGroup(goal.linkColor, goal.id);
            }
            else {
                goal.linkColor = null;
                goal.linkedGoalIds = [];
            }
            */
            goal.color = goalFactory.getGoalColor(goal);

            if (goalFactory.currentUserGoals[goal.goalTypeID] === undefined) {
                goalFactory.currentUserGoals[goal.goalTypeID] = {};
            }
            // Use the Firebase-specific server time for goal creation timestamp
            goal.createdTimestamp = firebase.database.ServerValue.TIMESTAMP;
            if (goal.singleGoalCompletion) {
                // If it is a one-time goal then it is inactive before the beginning of the current goal period
                goal.inactiveBeforeTimestamp = getEndOrStartOfGoalsPeriodUsingDate(goal, viewDateAdded, 'start');
                var goalType = goalFactory.allGoalTypes[goal.goalTypeID];
                if (goal.autoHideIncompleteOneTimeGoals) {
                    goal.inactiveAfterTimestamp = getEndOrStartOfGoalsPeriodUsingDate(goal, viewDateAdded, 'end');
                }
            }
            else {
                // If the goal isn't one-time then we don't care about this setting so we should save space
                delete goal.autoHideIncompleteOneTimeGoals;
            }

            goalFactory.currentUserGoals[goal.goalTypeID][goal.id] = goal;
            goalFactory.visibleGoalsFlatObject[goal.id] = goal;
            goalFactory.currentUserAllGoalsFlatArray.push(goal);
            goalFactory.getGoalFirebaseRefFromGoal(goal).set(goal);

            defObj.resolve(goal);
            return defObj.promise;
        };

        goalFactory.updateGoal = function(updatedGoal) {
            var defObj = $q.defer();
            var oldGoal = goalFactory.currentUserGoals[updatedGoal.goalTypeID][updatedGoal.id];

            /*
            This logic is no longer used as we don't have link groups anymore
            */
            /*if (oldGoal.linkColor != updatedGoal.linkColor) {

                if (oldGoal.linkColor) {
                    removeGoalFromLinkGroup(oldGoal.linkColor, updatedGoal.id);
                }

                if (updatedGoal.linkColor) {
                    if (!goalFactory.linkGroups[updatedGoal.linkColor]) {
                        goalFactory.linkGroups[updatedGoal.linkColor] = [];
                    }

                    updatedGoal.linkedGoalIds = angular.copy(goalFactory.linkGroups[updatedGoal.linkColor]);

                    addGoalToLinkGroup(updatedGoal.linkColor, updatedGoal.id);
                }
                else {
                    if (goalFactory.linkSettings.colorCodeByLinkPath) {
                        updatedGoal.color = goalFactory.allGoalTypes[updatedGoal.goalTypeID].defaultColor;
                    }
                    updatedGoal.linkedGoalIds = [];
                }
            }*/
            updatedGoal.color = goalFactory.getGoalColor(updatedGoal);

            /* Use assign instead of merge because merge doesn't handle the case of removing a linked goal */
            _.assign(goalFactory.currentUserGoals[updatedGoal.goalTypeID][updatedGoal.id], updatedGoal);
            goalFactory.getGoalFirebaseRefFromGoal(updatedGoal).set(updatedGoal);

            defObj.resolve(updatedGoal);
            return defObj.promise;
        };

        goalFactory.toggleGoalInactiveAfter = function(goal, inactiveAfterTimestamp) {
            if (goal.inactiveAfterTimestamp) {
                goal.inactiveAfterTimestamp = null;
            }
            else {
                goal.inactiveAfterTimestamp = inactiveAfterTimestamp;
            }
            goalFactory.getGoalFirebaseRefFromGoal(goal).child('inactiveAfterTimestamp').set(goal.inactiveAfterTimestamp);
        };

        goalFactory.findAllRewardIDsForGoal = function(goal) {
            var returnArray = [];

            if ((!goal.completed)||(!goal.completed.dates)) {
                return returnArray;
            }

            angular.forEach(goal.completed.dates, function(goalCompletionObject) {
                angular.forEach(goalCompletionObject.rewards, function(reward) {
                    returnArray.push(reward.id);
                });
            });

            return returnArray;
        };

        goalFactory.deleteGoal = function(goalID) {
            var goalToRemove = goalFactory.visibleGoalsFlatObject[goalID];

            // No more link groups
            /*if (goalToRemove.linkColor) {
                removeGoalFromLinkGroup(goalToRemove.linkColor, goalID);
            }*/

            angular.forEach(goalFactory.findAllRewardIDsForGoal(goalToRemove), function(rewardID) {
                goalFactory.removeRewardIDFromUnclaimedList(rewardID);
            });

            var goalTypeID = goalToRemove.goalTypeID;
            delete goalFactory.currentUserGoals[goalTypeID][goalID];
            delete goalFactory.visibleGoalsFlatObject[goalID];
            _.remove(goalFactory.currentUserAllGoalsFlatArray, { 'id': goalID });
            goalFactory.getGoalFirebaseRefFromGoal({id: goalID, goalTypeID: goalTypeID}).set(null);
        };

        return goalFactory;
    }]);

})();
