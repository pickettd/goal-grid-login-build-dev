(function () {
    'use strict';

    var directiveModule = angular.module('angularjs-dropdown-multiselect', []);

    directiveModule.directive('ngDropdownMultiselect', ['$filter', '$document', '$compile', '$parse',
        function ($filter, $document, $compile, $parse) {

            return {
                restrict: 'AE',
                scope: {
                    selectedModel: '=',
                    options: '=',
                    extraSettings: '=',
                    events: '=',
                    searchFilter: '=?',
                    translationTexts: '=',
                    groupByChoices: '=',
                    groupBy: '@'
                },
                template: function (element, attrs) {
                    var checkboxes = attrs.checkboxes ? true : false;
                    var groups = attrs.groupBy ? true : false;

                    var template = '<div class="multiselect-parent btn-group dropdown-multiselect">';
                    template += '<button type="button" class="dropdown-toggle" ng-class="settings.buttonClasses" ng-click="toggleDropdown()">{{getButtonText()}}&nbsp;<span class="caret"></span></button>';
                    template += '<ul class="dropdown-menu dropdown-menu-form" ng-style="{display: open ? \'block\' : \'none\', height : settings.scrollable ? settings.scrollableHeight : \'auto\', overflow: settings.scrollable ? \'scroll\' : \'auto\' }" style="min-width: 275px" >';
                    if (groups) {
                        template += '<li ng-repeat="groupChoice in groupByChoices"><a href="#"><span data-ng-click="selectOnlyGroup(groupChoice.name)"><span class="glyphicon glyphicon-search"></span>  Show only {{groupChoice.name}}</span><type="button" class="btn btn-link" ng-click="toggleGroupVisible(groupChoice.name)"><span class="glyphicon glyphicon-plus"></span></button></a>';
                        template += '<ul ng-show="visibleOptions.length && groupVisibility[groupChoice.name]">';
                        template += '<li role="presentation" ng-repeat="option in visibleOptions | filter: groupMatch(groupChoice.name)">';
                        template += '<a href="#" style="text-decoration: none; color: black;" role="menuitem" tabindex="-1" ng-click="setSelectedItem(getPropertyForObject(option,settings.idProp))">';
                        if (checkboxes) {
                            template += '<div class="checkbox"><label><input class="checkboxInput" type="checkbox" ng-click="checkboxClick($event, getPropertyForObject(option,settings.idProp))" ng-checked="isChecked(getPropertyForObject(option,settings.idProp))" /> {{getPropertyForObject(option, settings.displayProp)}}</label></div></a>';
                        } else {
                            template += '<span data-ng-class="{\'glyphicon glyphicon-ok\': isChecked(getPropertyForObject(option,settings.idProp))}"></span> {{getPropertyForObject(option, settings.displayProp)}}</a>';
                        }
                        template += '  -  <a href="#" data-ng-click="setOnlySelected(getPropertyForObject(option,settings.idProp))">Show Only</a>';
                        template += '</li>';
                        template += '<li class="divider"></li></ul>';
                        template += '</li>';
                    }
                    template += '<li ng-hide="!settings.showCheckAll || settings.selectionLimit > 0"><a href="#" data-ng-click="selectAll()"><span class="glyphicon glyphicon-ok"></span>  {{texts.checkAll}}</a>';
                    template += '<li ng-show="settings.showUncheckAll && selectedModel.length"><a href="#" data-ng-click="deselectAll();"><span class="glyphicon glyphicon-remove"></span>  {{texts.uncheckAll}}</a></li>';
                    if (groups) {
                        template += '<li ng-show="settings.enableSearch" class="divider"></li>';
                    }
                    else {
                        template += '<li ng-show="(settings.showCheckAll || settings.showCheckAll) && settings.enableSearch" class="divider"></li>';             }
                    template += '<li ng-show="settings.enableSearch"><div class="dropdown-header"><input type="text" class="form-control" style="width: 100%;" ng-model="searchFilter" placeholder="{{texts.searchPlaceholder}}" /></li>';

                    // Everything below here is for the search list (everything above is for the groups lists)
                    template += '<span ng-show="settings.enableSearch && searchFilter.length">';
                    template += '<li class="divider"></li>';

                    if (groups) {
                        template += '<li ng-repeat-start="option in orderedItems | filter: searchFilter" ng-show="getPropertyForObject(option, settings.groupBy) !== getPropertyForObject(orderedItems[$index - 1], settings.groupBy)" role="presentation" class="dropdown-header">';
                        template += '<span>{{ getGroupTitle(getPropertyForObject(option, settings.groupBy)) }}';
                        template += '<span ng-hide="getGroupTitle(getPropertyForObject(option, settings.groupBy))">&lt;No group set&gt;</span>';
                        // The following commented out code was used for checking all in a group
                        /*
                        template += '<span ng-hide="searchFilter || !settings.allowCheckGroup || settings.selectionLimit > 0">|<a href="#" data-ng-click="selectGroup(getGroupTitle(getPropertyForObject(option, settings.groupBy)))">|<span class="glyphicon glyphicon-ok"></span>  {{texts.checkAll}}</a></span>';
                        */
                        template += '</span></li>';
                        template += '<li ng-repeat-end role="presentation" class="dropdown-header">';
                    } else {
                        template += '<li role="presentation" ng-repeat="option in orderedItems | filter: searchFilter">';
                    }

                    template += '<a href="#" style="text-decoration: none; color: black;" role="menuitem" tabindex="-1" ng-click="setSelectedItem(getPropertyForObject(option,settings.idProp))">';

                    if (checkboxes) {
                        template += '<div class="checkbox"><label><input class="checkboxInput" type="checkbox" ng-click="checkboxClick($event, getPropertyForObject(option,settings.idProp))" ng-checked="isChecked(getPropertyForObject(option,settings.idProp))" /> {{getPropertyForObject(option, settings.displayProp)}}</label></div></a>';
                    } else {
                        template += '<span data-ng-class="{\'glyphicon glyphicon-ok\': isChecked(getPropertyForObject(option,settings.idProp))}"></span> {{getPropertyForObject(option, settings.displayProp)}}</a>';
                    }
                    template += '  -  <a href="#" data-ng-click="setOnlySelected(getPropertyForObject(option,settings.idProp))">Show Only</a>';

                    template += '</li>';
                    template += '</span>';

                    template += '<li class="divider" ng-show="settings.selectionLimit > 1"></li>';
                    template += '<li role="presentation" ng-show="settings.selectionLimit > 1"><a role="menuitem">{{selectedModel.length}} {{texts.selectionOf}} {{settings.selectionLimit}} {{texts.selectionCount}}</a></li>';

                    template += '</ul>';
                    template += '</div>';

                    element.html(template);
                },
                link: function ($scope, $element, $attrs) {
                    var $dropdownTrigger = $element.children()[0];

                    $scope.groupVisibility = {};

                    $scope.groupMatch = function( criteria) {
                        return function( item ) {
                            var groupTitle = $scope.getGroupTitle($scope.getPropertyForObject(item, $scope.settings.groupBy));
                            return ((groupTitle === "")||(groupTitle === criteria));
                        };
                    };

                    var resetGroupVisibility = function() {
                        angular.forEach($scope.groupByChoices, function (group) {
                            $scope.groupVisibility[group.name] = 0;
                        });
                    };

                    var areAllGroupsInvisible = function() {
                        var returnValue = true;
                        angular.forEach($scope.groupByChoices, function (group) {
                            if ($scope.groupVisibility[group.name] === 1)
                                returnValue = false;
                        });
                        return returnValue;
                    };

                    var markAllGroupsVisible = function() {
                        angular.forEach($scope.groupByChoices, function (group) {
                            $scope.groupVisibility[group.name] = 1;
                        });
                    };
                    resetGroupVisibility();

                    $scope.visibleOptions = [];
                    $scope.orderedItems = [];

                    angular.extend($scope.visibleOptions, $scope.options || []);

                    $scope.toggleDropdown = function () {
                        $scope.open = !$scope.open;
                    };

                    $scope.checkboxClick = function ($event, id) {
                        $scope.setSelectedItem(id);
                        $event.stopImmediatePropagation();
                    };

                    $scope.externalEvents = {
                        onItemSelect: angular.noop,
                        onItemSelectWithGroup: angular.noop,
                        onItemDeselect: angular.noop,
                        onSelectAll: angular.noop,
                        onDeselectAll: angular.noop,
                        onSelectGroup: angular.noop,
                        onInitDone: angular.noop,
                        onMaxSelectionReached: angular.noop
                    };

                    $scope.settings = {
                        dynamicTitle: true,
                        scrollable: false,
                        scrollableHeight: '300px',
                        closeOnBlur: true,
                        displayProp: 'label',
                        idProp: 'id',
                        externalIdProp: 'id',
                        enableSearch: false,
                        selectionLimit: 0,
                        showCheckAll: true,
                        showUncheckAll: true,
                        allowCheckGroup: true,
                        closeOnSelect: false,
                        buttonClasses: 'btn btn-default',
                        closeOnDeselect: false,
                        groupBy: $attrs.groupBy || undefined,
                        groupByTextProvider: null,
                        smartButtonMaxItems: 0,
                        defaultSort: $attrs.groupBy || undefined,
                        smartButtonTextConverter: angular.noop
                    };

                    $scope.texts = {
                        checkAll: 'Check All',
                        uncheckAll: 'Uncheck All',
                        selectionCount: 'checked',
                        selectionOf: '/',
                        searchPlaceholder: 'Search...',
                        buttonDefaultText: 'Select',
                        dynamicButtonTextSuffix: 'checked'
                    };

                    $scope.searchFilter = $scope.searchFilter || '';

                    if (angular.isDefined($scope.settings.groupBy)) {
                        // The following code was used when the search section and group listing were merged
                        /*
                        $scope.$watch('searchFilter', function (newValue, oldValue) {
                            if (angular.isDefined(newValue)) {
                                if ((newValue !== "")&&(oldValue === "")) {
                                    $scope.visibleOptions = [];
                                    angular.extend($scope.visibleOptions,$scope.orderedItems);
                                    markAllGroupsVisible();
                                }
                                if ((newValue === "")&&(oldValue !== "")) {
                                    $scope.visibleOptions = [];
                                    resetGroupVisibility();
                                }
                            }
                        });
                        */

                        $scope.$watchCollection('options', function (newValue) {
                            if (angular.isDefined(newValue)) {
                                $scope.orderedItems = $filter('orderBy')(newValue, $scope.settings.defaultSort);
                                $scope.visibleOptions = [];
                                $scope.selectedModel = [];
                                angular.extend($scope.selectedModel, $scope.options);
                                resetGroupVisibility();
                            }
                        });
                    }

                    angular.extend($scope.settings, $scope.extraSettings || []);
                    angular.extend($scope.externalEvents, $scope.events || []);
                    angular.extend($scope.texts, $scope.translationTexts);
                    angular.extend($scope.selectedModel, $scope.options);

                    $scope.singleSelection = $scope.settings.selectionLimit === 1;

                    function getFindObj(id) {
                        var findObj = {};

                        if ($scope.settings.externalIdProp === '') {
                            findObj[$scope.settings.idProp] = id;
                        } else {
                            findObj[$scope.settings.externalIdProp] = id;
                        }

                        return findObj;
                    }

                    function clearObject(object) {
                        for (var prop in object) {
                            delete object[prop];
                        }
                    }

                    if ($scope.singleSelection) {
                        if (angular.isArray($scope.selectedModel) && $scope.selectedModel.length === 0) {
                            clearObject($scope.selectedModel);
                        }
                    }

                    if ($scope.settings.closeOnBlur) {
                        $document.on('click', function (e) {
                            var target = e.target.parentElement;
                            var parentFound = false;

                            while (angular.isDefined(target) && target !== null && !parentFound) {
                                if (_.contains(target.className.split(' '), 'multiselect-parent') && !parentFound) {
                                    if(target === $dropdownTrigger) {
                                        parentFound = true;
                                    }
                                }
                                target = target.parentElement;
                            }

                            if (!parentFound) {
                                $scope.$apply(function () {
                                    $scope.open = false;
                                });
                            }
                        });
                    }

                    $scope.getGroupTitle = function (groupValue) {
                        if ($scope.settings.groupByTextProvider !== null) {
                            return $scope.settings.groupByTextProvider(groupValue);
                        }

                        return groupValue;
                    };

                    $scope.getButtonText = function () {
                        var selectedModelKeys = _.keys($scope.selectedModel);
                        if ($scope.settings.dynamicTitle && angular.isDefined($scope.selectedModel)) {
                            if ($scope.settings.smartButtonMaxItems > 0) {
                                var itemsText = [];

                                angular.forEach($scope.options, function (optionItem) {
                                    if ($scope.isChecked($scope.getPropertyForObject(optionItem, $scope.settings.idProp))) {
                                        var displayText = $scope.getPropertyForObject(optionItem, $scope.settings.displayProp);
                                        var converterResponse = $scope.settings.smartButtonTextConverter(displayText, optionItem);

                                        itemsText.push(converterResponse ? converterResponse : displayText);
                                    }
                                });

                                if ($scope.selectedModel.length > $scope.settings.smartButtonMaxItems) {
                                    itemsText = itemsText.slice(0, $scope.settings.smartButtonMaxItems);
                                    itemsText.push('...');
                                }

                                return itemsText.join(', ');
                            } else {
                                var totalSelected;

                                if ($scope.singleSelection) {
                                    totalSelected = ($scope.selectedModel !== null && angular.isDefined($scope.selectedModel[$scope.settings.idProp])) ? 1 : 0;
                                } else {
                                    totalSelected = angular.isDefined($scope.selectedModel) ? $scope.selectedModel.length : 0;
                                }

                                var orderedItemsLength = angular.isDefined($scope.orderedItems) ? $scope.orderedItems.length : 0;
                                return $scope.texts.buttonDefaultText + ' ('+ totalSelected + '/' + orderedItemsLength + $scope.texts.dynamicButtonTextSuffix + ')';
                            }
                        } else {
                            return $scope.texts.buttonDefaultText;
                        }
                    };

                    $scope.getPropertyForObject = function (object, property) {
                        var arrayOfProperties = property.split('.');
                        var currentObject = object;
                        for(var index = 0; index < arrayOfProperties.length; index++) {
                            if ((!angular.isDefined(currentObject)) || (!currentObject.hasOwnProperty(arrayOfProperties[index]))) {
                                return '';
                            }
                            currentObject = currentObject[arrayOfProperties[index]];
                        }
                        return currentObject;
                    };

                    $scope.selectAll = function () {
                        $scope.deselectAll(true);
                        $scope.externalEvents.onSelectAll();

                        angular.forEach($scope.options, function (value) {
                            $scope.setSelectedItem(value[$scope.settings.idProp], true);
                        });
                    };

                    $scope.selectOnlyGroup = function (groupName) {
                        $scope.deselectAll(true);
                        $scope.selectGroup(groupName);
                    };

                    $scope.selectGroup = function (groupName) {
                        $scope.externalEvents.onSelectGroup(groupName);

                        angular.forEach($scope.options, function (value) {
                            var thisGroupName = $scope.getPropertyForObject(value, $scope.groupBy);
                            if ((thisGroupName === "")||(thisGroupName === groupName)) {
                                $scope.setSelectedItem(value[$scope.settings.idProp], true, false);
                            }
                        });
                    };

                    $scope.toggleGroupVisible = function (groupName) {
                        // First we check if we are making it visible or hiding it
                        if ($scope.groupVisibility[groupName] === 0) {
                            // This means we are making the group visible
                            angular.forEach($scope.orderedItems, function (value) {
                                var thisGroupName = $scope.getPropertyForObject(value, $scope.groupBy);
                                if (thisGroupName === "") {
                                    if (!(_.contains($scope.visibleOptions, value))) {
                                        $scope.visibleOptions.push(value);
                                    }
                                }
                                else if (thisGroupName === groupName) {
                                    $scope.visibleOptions.push(value);
                                }
                            });
                            $scope.visibleOptions = $filter('orderBy')($scope.visibleOptions, $scope.settings.defaultSort);

                            $scope.groupVisibility[groupName] = 1;
                        }
                        else {
                            $scope.groupVisibility[groupName] = 0;
                            var allGroupsInvisible = areAllGroupsInvisible();
                            for (var index = $scope.visibleOptions.length - 1; index >= 0; index--)
                            {
                                var value = $scope.visibleOptions[index];
                                var thisGroupName = $scope.getPropertyForObject(value, $scope.groupBy);
                                if ((thisGroupName === groupName)||((thisGroupName === "")&&(allGroupsInvisible))) {
                                    $scope.visibleOptions.splice(index,1);
                                }
                            }
                        }
                    };

                    $scope.deselectAll = function (sendEvent) {
                        if (angular.isUndefined(sendEvent)) { sendEvent = true; }

                        if (sendEvent) {
                            $scope.externalEvents.onDeselectAll();
                        }

                        if ($scope.singleSelection) {
                            clearObject($scope.selectedModel);
                        } else {
                            $scope.selectedModel.splice(0, $scope.selectedModel.length);
                        }
                    };

                    $scope.setOnlySelected = function (id) {
                        $scope.deselectAll(true);
                        $scope.setSelectedItem(id, true);
                    };

                    $scope.setSelectedItem = function (id, dontRemove, sendEventWithoutGroup) {
                        var findObj = getFindObj(id);
                        var finalObj = null;
                        if (angular.isUndefined(sendEventWithoutGroup)) { sendEventWithoutGroup = true; }

                        if ($scope.settings.externalIdProp === '') {
                            finalObj = _.find($scope.options, findObj);
                        } else {
                            finalObj = findObj;
                        }

                        if ($scope.singleSelection) {
                            clearObject($scope.selectedModel);
                            angular.extend($scope.selectedModel, finalObj);
                            $scope.externalEvents.onItemSelect(finalObj);

                            return;
                        }

                        dontRemove = dontRemove || false;

                        var exists = _.findIndex($scope.selectedModel, findObj) !== -1;

                        if (!dontRemove && exists) {
                            $scope.selectedModel.splice(_.findIndex($scope.selectedModel, findObj), 1);
                            if (sendEventWithoutGroup) { $scope.externalEvents.onItemDeselect(findObj); }
                        } else if (!exists && ($scope.settings.selectionLimit === 0 || $scope.selectedModel.length < $scope.settings.selectionLimit)) {
                            $scope.selectedModel.push(finalObj);
                            if (sendEventWithoutGroup) { $scope.externalEvents.onItemSelect(finalObj); }
                            else { $scope.externalEvents.onItemSelectWithGroup(finalObj); }
                        }
                    };

                    $scope.isChecked = function (id) {
                        if ($scope.singleSelection) {
                            return $scope.selectedModel !== null && angular.isDefined($scope.selectedModel[$scope.settings.idProp]) && $scope.selectedModel[$scope.settings.idProp] === getFindObj(id)[$scope.settings.idProp];
                        }

                        return _.findIndex($scope.selectedModel, getFindObj(id)) !== -1;
                    };

                    $scope.externalEvents.onInitDone();
                }
            };
    }]);
}());
