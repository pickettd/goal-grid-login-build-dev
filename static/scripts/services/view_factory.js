(function () {
    'use strict';

    angular.module('goalgrid').factory('viewFactory', ['$q', '$firebaseObject', 'firebaseFactory', function($q, $firebaseObject, firebaseFactory) {
        var viewFactory = {};

        var defaultViewsRef = firebaseFactory.firebaseRef.child('defaultViews');
        var thisUserViewsRef = firebaseFactory.thisUserRef.child('viewData/views');
        viewFactory.allViews = {};
        var hardCodedGoalViews = {
            1: { 'id': 1,
                'name': 'Day',
                'isInitial': true,
                'templateURL': 'static/views/builtin_goal_views/sortable_single_type.html',
                'changeDate': true,
                'editPercentages': false,
                'showViewNameInTitle': true,
                'boldGoalText': true,
                'useFluidContainerStyle': false,
                'goalArraysByType': [],
                'goalTypeIDs': [1],
                'pictureIDs': {
                    left: {
                        first: [1,2,3,4],
                        second: [5,6,7,8]
                    },
                    right: {
                        first: [9,10,11,12],
                        second: [13,14,15,16]
                    }
                }
               },
            2: { 'id': 2,
                'name': 'Month',
                'templateURL': 'static/views/builtin_goal_views/sortable_single_type.html',
                'changeDate': true,
                'showCompletionDates': true,
                'editPercentages': true,
                'showViewNameInTitle': true,
                'editPercentageButtons': ['0', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100'],
                'boldGoalText': true,
                'useFluidContainerStyle': false,
                'goalArraysByType': [],
                'goalTypeIDs': [2],
                'pictureIDs': {
                    left: {
                        first: [11,12,13,14],
                        second: [15,16,6,5]
                    },
                    right: {
                        first: [2,3,1,4],
                        second: [8,9,10,7]
                    }
                }
            },
            3: { 'id': 3,
                'name': 'Year',
                'templateURL': 'static/views/builtin_goal_views/sortable_single_type.html',
                'changeDate': true,
                'showCompletionDates': true,
                'editPercentages': true,
                'showViewNameInTitle': true,
                'editPercentageButtons': ['0', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100'],
                'boldGoalText': true,
                'useFluidContainerStyle': false,
                'goalArraysByType': [],
                'goalTypeIDs': [3],
                'pictureIDs': {
                    left: {
                        first: [7,2,9,4],
                        second: [10,6,12,5]
                    },
                    right: {
                        first: [3,14,11,5],
                        second: [1,8,10,13]
                    }
                }
               },
            4: { 'id': 4,
                'name': 'Life',
                'templateURL': 'static/views/builtin_goal_views/sortable_single_type.html',
                'changeDate': true,
                'showCompletionDates': true,
                'editPercentages': true,
                'showViewNameInTitle': true,
                'editPercentageButtons': ['0', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100'],
                'boldGoalText': true,
                'useFluidContainerStyle': false,
                'goalArraysByType': [],
                'goalTypeIDs': [4],
                'pictureIDs': {
                    left: {
                        first: [3,14,11,10],
                        second: [13,8,1,12]
                    },
                    right: {
                        first: [7,2,9,4],
                        second: [5,6,10,13]
                    }
                }
               },
            5: { 'id': 5,
                'name': 'Grid',
                'templateURL': 'static/views/builtin_goal_views/sortable_grid_generic.html',
                'changeDate': false,
                'showViewNameInTitle': false,
                'useFluidContainerStyle': false,
                'goalArraysByType': [],
                'goalTypeIDs': [1,2,3,4],
                'pictureIDs': {
                    left: {
                        first: [1,2,3,4,5,6,7,8],
                        second: []
                    },
                    right: {
                        first: [9,10,11,12,13,14,15,16],
                        second: []
                    }
                },
            },
            6: { 'id': 6, 'name': 'Images', 'templateURL': 'static/views/builtin_goal_views/images_packery.html',
                'showViewNameInTitle': false,
                'hideDateControls': true,
                'hideGridControls': true,
                'isPackeryView': true
               }
        };
        var hardCodedReportViews = {};
        viewFactory.currentView = {};
        viewFactory.currentView.goalArraysByType = {};

        // This function checks if a view only has one goal type in it and if so it returns that type ID
        // If not then it returns null
        viewFactory.getViewSingleGoalTypeID = function(view) {
            if (view.goalTypeIDs) {
                var theLength = 0;
                var theKey = 0;
                // It is possible that goalTypeIDs may be an array or it may be an associative object
                if (view.goalTypeIDs.length !== undefined) {
                    theLength = view.goalTypeIDs.length;
                    theKey = 0;
                }
                // If goalTypeIDs is an associative object then we should use Object.keys to find the single key
                else {
                    var theKeys = Object.keys(view.goalTypeIDs);
                    theLength = theKeys.length;
                    theKey = theKeys[0];
                }
                if (theLength !== undefined && theLength === 1 && theKey !== undefined && view.goalTypeIDs[theKey] !== undefined) {
                    return view.goalTypeIDs[theKey];
                }
                else {
                    return null;
                }
            }
            else {
                return null;
            }
        };

        viewFactory.setCurrentView = function(viewId) {
            viewFactory.currentView = viewFactory.allViews[viewId];
        };

        viewFactory.replacePicID = function(viewID, left, primaryColumn, picIndex, newPicID) {
            if ((left !== undefined)&& (primaryColumn !== undefined)) {
                var theView = viewFactory.allViews[viewID];

                if (!theView.pictureIDs) {
                    return;
                }

                if (left) {
                    if (!theView.pictureIDs.left) {
                        return;
                    }

                    if (primaryColumn) {
                        if (!theView.pictureIDs.left.first) {
                            return;
                        }

                        if (picIndex === -1) {
                            theView.pictureIDs.left.first.push(newPicID);
                        }
                        else {
                            theView.pictureIDs.left.first[picIndex] = newPicID;
                        }
                    }
                    else {
                        if (!theView.pictureIDs.left.second) {
                            return;
                        }

                        if (picIndex === -1) {
                            theView.pictureIDs.left.second.push(newPicID);
                        }
                        else {
                            theView.pictureIDs.left.second[picIndex] = newPicID;
                        }
                    }
                }
                else {
                    if (!theView.pictureIDs.right) {
                        return;
                    }

                    if (primaryColumn) {
                        if (!theView.pictureIDs.right.first) {
                            return;
                        }

                        if (picIndex === -1) {
                            theView.pictureIDs.right.first.push(newPicID);
                        }
                        else {
                            theView.pictureIDs.right.first[picIndex] = newPicID;
                        }
                    }
                    else {
                        if (!theView.pictureIDs.right.second) {
                            return;
                        }

                        if (picIndex === -1) {
                            theView.pictureIDs.right.second.push(newPicID);
                        }
                        else {
                            theView.pictureIDs.right.second[picIndex] = newPicID;
                        }
                    }
                }
                viewFactory.savePicturesOrdersinView(theView);
            }
        };

        viewFactory.removePicFromView = function(viewID, left, primaryColumn, picIndex) {
            if ((left !== undefined)&& (primaryColumn !== undefined)) {
                var theView = viewFactory.allViews[viewID];

                if (!theView.pictureIDs) {
                    return;
                }

                if (left) {
                    if (!theView.pictureIDs.left) {
                        return;
                    }

                    if (primaryColumn) {
                        if (!theView.pictureIDs.left.first) {
                            return;
                        }

                        theView.pictureIDs.left.first.splice(picIndex, 1);
                    }
                    else {
                        if (!theView.pictureIDs.left.second) {
                            return;
                        }

                        theView.pictureIDs.left.second.splice(picIndex, 1);
                    }
                }
                else {
                    if (!theView.pictureIDs.right) {
                        return;
                    }

                    if (primaryColumn) {
                        if (!theView.pictureIDs.right.first) {
                            return;
                        }

                        theView.pictureIDs.right.first.splice(picIndex, 1);
                    }
                    else {
                        if (!theView.pictureIDs.right.second) {
                            return;
                        }

                        theView.pictureIDs.right.second.splice(picIndex, 1);
                    }
                }
                viewFactory.savePicturesOrdersinView(theView);
            }
        };

        viewFactory.addPicToView = function(viewID, left, primaryColumn, newPic) {
            if ((left !== undefined)&& (primaryColumn !== undefined)) {
                var theView = viewFactory.allViews[viewID];

                if (!theView.pictureIDs) {
                    theView.pictureIDs = {};
                }

                if (left) {
                    if (!theView.pictureIDs.left) {
                        theView.pictureIDs.left = {};
                    }

                    if (primaryColumn) {
                        if (!theView.pictureIDs.left.first) {
                            theView.pictureIDs.left.first = [];
                        }

                        theView.pictureIDs.left.first.push(newPic.id);
                    }
                    else {
                        if (!theView.pictureIDs.left.second) {
                            theView.pictureIDs.left.second = [];
                        }

                        theView.pictureIDs.left.second.push(newPic.id);
                    }
                }
                else {
                    if (!theView.pictureIDs.right) {
                        theView.pictureIDs.right = {};
                    }

                    if (primaryColumn) {
                        if (!theView.pictureIDs.right.first) {
                            theView.pictureIDs.right.first = [];
                        }

                        theView.pictureIDs.right.first.push(newPic.id);
                    }
                    else {
                        if (!theView.pictureIDs.right.second) {
                            theView.pictureIDs.right.second = [];
                        }

                        theView.pictureIDs.right.second.push(newPic.id);
                    }
                }
                viewFactory.savePicturesOrdersinView(theView);
            }
        };

        viewFactory.removePictureFromAllViews = function(pictureID) {
            angular.forEach(viewFactory.allViews, function(view) {
                var findLeftFirst;
                var findLeftSecond;
                var findRightFirst;
                var findRightSecond;

                if (view.pictureIDs) {
                    if (view.pictureIDs.left) {
                        if (view.pictureIDs.left.first) {
                            findLeftFirst = view.pictureIDs.left.first.indexOf(pictureID);
                            if(findLeftFirst !== -1){
                                view.pictureIDs.left.first.splice(findLeftFirst, 1);
                            }
                        }
                        if (view.pictureIDs.left.second) {
                            findLeftSecond = view.pictureIDs.left.second.indexOf(pictureID);
                            if(findLeftSecond !== -1){
                                view.pictureIDs.left.second.splice(findLeftSecond, 1);
                            }
                        }
                    }
                    if (view.pictureIDs.right) {
                        if (view.pictureIDs.right.first) {
                            findRightFirst = view.pictureIDs.right.first.indexOf(pictureID);
                            if(findRightFirst !== -1){
                                view.pictureIDs.right.first.splice(findRightFirst, 1);
                            }
                        }
                        if (view.pictureIDs.right.second) {
                            findRightSecond = view.pictureIDs.right.second.indexOf(pictureID);
                            if(findRightSecond !== -1){
                                view.pictureIDs.right.second.splice(findRightSecond, 1);
                            }
                        }
                    }
                    viewFactory.savePicturesOrdersinView(view);
                }
            });
        };

        viewFactory.addGoalToAllViews = function(goal) {
            var goalTypeID = goal.goalTypeID;
            angular.forEach(viewFactory.allViews, function(view) {
                if (_.contains(view.goalTypeIDs, goalTypeID)) {
                    if (view.goalArraysByType === undefined) {view.goalArraysByType = {};}
                    if (view.goalIDsArraysByType === undefined) {view.goalIDsArraysByType = {};}
                    if (view.goalArraysByType[goalTypeID] === undefined) {view.goalArraysByType[goalTypeID] = [];}
                    if (view.goalIDsArraysByType[goalTypeID] === undefined) {view.goalIDsArraysByType[goalTypeID] = [];}
                    view.goalArraysByType[goalTypeID].push(goal);
                    view.goalIDsArraysByType[goalTypeID].push(goal.id);
                    thisUserViewsRef.child(view.id+'/goalIDsArraysByType/'+goalTypeID).set(view.goalIDsArraysByType[goalTypeID]);
                }
            });
        };

        viewFactory.removeGoalFromAllViews = function(goalID, goalTypeID) {
            angular.forEach(viewFactory.allViews, function(view) {
                if (_.contains(view.goalTypeIDs, goalTypeID)) {
                    /* This searches the array of goals for the goal id to be removed */
                    var goalIndex = _.findIndex(view.goalArraysByType[goalTypeID], function(goalItem)
                                        { return goalItem.id == goalID; });
                    if (goalIndex !== -1) {
                        view.goalArraysByType[goalTypeID].splice(goalIndex, 1);
                    }
                    var goalIDIndex = _.findIndex(view.goalIDsArraysByType[goalTypeID], function(existingGoalID) {
                        return existingGoalID == goalID;
                    });
                    if (goalIDIndex !== -1) {
                        view.goalIDsArraysByType[goalTypeID].splice(goalIDIndex, 1);
                        thisUserViewsRef.child(view.id+'/goalIDsArraysByType/'+goalTypeID).set(view.goalIDsArraysByType[goalTypeID]);
                    }
                }
            });
        };

        viewFactory.getAllViews = function() {
            var defObj = $q.defer();

            thisUserViewsRef.once("value", function(snapshot) {
                viewFactory.allViews = {};
                angular.forEach(snapshot.val(), function(view) {
                    if (view.id) {
                        viewFactory.allViews[view.id] = view;
                    }
                });
                defObj.resolve(viewFactory.allViews);
            });

            return defObj.promise;
        };

        viewFactory.updateView = function(updatedView) {
            var defObj = $q.defer();

            viewFactory.allViews[updatedView.id].url = updatedView.url;
            defObj.resolve(viewFactory.allViews[updatedView.id]);

            return defObj.promise;
        };

        // Item is the goal that is was dragged and dropped
        // indexFrom is the index in the goal list where it was before
        // indexTo is the index in the goal list where it was dragged to
        // In this function we update the goal ID list to reflect the new order and save it to Firebase
        viewFactory.reorderGoalsinCurrentView = function(item, indexFrom, indexTo) {
            var view = viewFactory.currentView;
            var goalTypeID = item.goalTypeID;

            view.goalIDsArraysByType[goalTypeID].splice(indexFrom, 1);
            view.goalIDsArraysByType[goalTypeID].splice(indexTo, 0, item.id);
            thisUserViewsRef.child(view.id+'/goalIDsArraysByType/'+goalTypeID).set(view.goalIDsArraysByType[goalTypeID]);
        };

        viewFactory.savePicturesOrdersinView = function(view) {
            if (view.pictureIDs) {
                thisUserViewsRef.child(view.id+'/pictureIDs').set(view.pictureIDs);
            }
        };

        return viewFactory;
    }]);

})();
