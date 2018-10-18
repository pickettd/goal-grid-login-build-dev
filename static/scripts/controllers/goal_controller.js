(function () {
    'use strict';

    angular.module('goalgrid')
    .controller('GoalCtrl', function ($scope, goalFactory, viewFactory, modalData) {
        $scope.goalModal = {};
        $scope.goalModal = {};

        $scope.goalModal.getGoalColor = goalFactory.getGoalColor;
        $scope.goalModal.categoryColors = goalFactory.hardCodedGoalCategoryColors;

        $scope.days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];
        $scope.selectedDays = [];
        $scope.toggleSelectedDays = function toggleSelectedDays(day, selectedDays, recurObj) {
            if (!selectedDays) {
                recurObj.selectedDays = [day];
            }
            else {
                var idx = selectedDays.indexOf(day);
                if (idx > -1) {
                    selectedDays.splice(idx, 1);
                } else {
                    selectedDays.push(day);
                }
            }
          };

        $scope.goalModal.colorPaletteOptions = {
            allowEmpty: true,
            showPaletteOnly: true,
            showInput: true,
            togglePaletteOnly: true,
            preferredFormat: 'name',
            palette: goalFactory.colorPaletteChoices,
            replacerClassName: 'form-control'
        };

        $scope.goalModal.linkColorChoices = goalFactory.colorPaletteChoices;

        $scope.goalModal.allGoalTypes = goalFactory.allGoalTypes;

        $scope.goalModal.modalGoalType = goalFactory.currentGoalModalType;
        $scope.goalModal.linkedGoalsDropdownSettings = {
            displayProp: 'goalText',
            groupByTextProvider: function(groupValue) {
                var goalType = goalFactory.allGoalTypes[groupValue];
                if (goalType) { return goalType.name; }
                else { return ''; }
            },
            enableSearch: true
        };
        $scope.goalModal.linkedGoalsDropdownTexts = {
            buttonDefaultText: 'Select linked goals',
            dynamicButtonTextSuffix: 'linked',
            checkAll: 'Select All',
            uncheckAll: 'Deselect All'
        };
        $scope.goalModal.modalState = modalData;
        if (modalData.editOnly) {
            $scope.goalModal.modalGoals = [goalFactory.visibleGoalsFlatObject[modalData.goal.id]];
        }
        else {
            if (goalFactory.currentUserGoals) {
                $scope.goalModal.modalGoals = goalFactory.currentUserGoals[$scope.goalModal.modalGoalType.id];
            }
            else {
                $scope.goalModal.modalGoals = {};
            }
        }
        $scope.goalModal.modalGoalLinkOptions = goalFactory.filterOutOneTypeOfGoal($scope.goalModal.modalGoalType.id);
        $scope.newGoal = goalFactory.newGoal;
        $scope.currentEdit = goalFactory.currentEdit;

        // No more linking
        /*$scope.goalModal.getLinkedGoals = function(goal) {
            var returnArray = [];

            if (!goal || !goal.linkColor) {
                return [];
            }

            angular.forEach(goalFactory.linkGroups[goal.linkColor], function(goalID) {
                if (goalID.id !== goal.id) {
                    var thisGoal = goalFactory.visibleGoalsFlatObject[goalID.id];
                    returnArray.push(thisGoal);
                }
            });
            return returnArray;
        };*/

        $scope.resetGoalsModal = function () {
            goalFactory.resetGoalModal($scope.goalModal.modalGoalType.id);
            $scope.currentEdit = goalFactory.currentEdit;
            $scope.selectedDays = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];
        };

        $scope.addGoal = function() {
            // If it's a recuring goal add the currentViewDate to the recur object
            // and if repeatType is set to weeks then also add selectedDays
            // check to see if the recur obj exists (but all goal-types besides lifetime should have it by default).
            // Also note that even though we can set a goal to be every week on certain days,
            // the valid check logic only uses days
            if ($scope.newGoal.singleGoalCompletion) {
              delete $scope.newGoal.recur;
            }
            if ($scope.newGoal.singleGoalCompletion === false && $scope.newGoal.recur) {
                // Note that it looks like frequencyCount could be an int or a string
                if ($scope.newGoal.recur.repeatType === 'weeks' && $scope.newGoal.recur.frequencyCount == 1) {
                    $scope.newGoal.recur.selectedDays = $scope.selectedDays;
                }
                var timestampToStart = goalFactory.getEndOrStartOfGoalsPeriodUsingDate($scope.newGoal, modalData.currentViewDate, 'start');
                $scope.newGoal.recur.startDate = timestampToStart;
            }

            $scope.newGoal.goalTypeID = $scope.goalModal.modalGoalType.id;
            var thisGoal = angular.copy($scope.newGoal);
            goalFactory.addGoal(thisGoal, modalData.currentViewDate).then(function() {
                viewFactory.addGoalToAllViews(thisGoal);
                if ($scope.goalModal.modalState.addOnly) {
                    $scope.resetGoalsModal();
                    $scope.$close();
                }
            });
            goalFactory.resetNewGoal($scope.goalModal.modalGoalType.id);
        };

        $scope.editGoal = function(goal) {
            $scope.currentEdit[goal.id] = {};
            $scope.currentEdit[goal.id].goal = angular.copy(goal);
        };

        $scope.saveGoal = function(goal) {
            var thisEditedGoal = $scope.currentEdit[goal.id].goal;

            // Check if its a recurring weekly goal and selectedDays.
            // if (thisEditedGoal.singleGoalCompletion === false && thisEditedGoal.recur) {
            //     if (thisEditedGoal.recur.repeatType === 'weeks') {
            //         thisEditedGoal.recur.selectedDays = $scope.selectedDays;
            //     }
            // }

            goalFactory.updateGoal(thisEditedGoal).then( function () {
                if ($scope.goalModal.modalState.editOnly) {
                    $scope.resetGoalsModal();
                    $scope.$close();
                }
            });
            $scope.currentEdit[goal.id] = {};
        };

        $scope.toggleDeleteGoalMode = function(goalID) {
            $scope.currentEdit[goalID].deleteMode = !$scope.currentEdit[goalID].deleteMode;
        };

        $scope.goalModal.toggleGoalInactiveAfter = function(goal) {
            var timestampNow = moment().valueOf();
            goalFactory.toggleGoalInactiveAfter(goal, timestampNow);
            if (goal.inactiveAfterTimestamp) {
                $scope.currentEdit[goal.id] = {};
                if ($scope.goalModal.modalState.editOnly) {
                    $scope.resetGoalsModal();
                    $scope.$close();
                }
            }
        };

        $scope.deleteGoal = function(goalID, goalTypeID) {
            viewFactory.removeGoalFromAllViews(goalID, goalTypeID);
            goalFactory.deleteGoal(goalID);
            $scope.currentEdit[goalID] = {};
            if ($scope.goalModal.modalState.editOnly) {
                $scope.resetGoalsModal();
                $scope.$close();
            }
        };

        // Reset the new goal whenever we enter this controller if edit is not in progress
        if (angular.equals(goalFactory.currentEdit, {})) {
            $scope.resetGoalsModal();
        }

        /*
        If this controller is created with an add only modal, then we don't know the desired goal type.
        So a select control will be shown that allows selection, a watch is used to update required variables
        so it is designed to reset the whole modal on change.
        */
        if ($scope.goalModal.modalState.addOnly) {
            $scope.$watch("goalModal.modalGoalType.id", function(newGoalTypeID) {
                goalFactory.resetGoalModal(newGoalTypeID);
                $scope.goalModal.modalGoalLinkOptions = goalFactory.filterOutOneTypeOfGoal(newGoalTypeID);
            });
        }

    });


})();
