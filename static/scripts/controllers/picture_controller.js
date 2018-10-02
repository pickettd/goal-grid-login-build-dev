(function () {
    'use strict';

    angular.module('goalgrid')
    .controller('PictureCtrl', function ($scope, pictureFactory, viewFactory, Upload, modalData) {
        $scope.pictureModal = {};

        $scope.pictureModal.modalData = modalData;

        $scope.pictureModal.resetPictureModal = function() {
            $scope.main.pictureForModal = {
                selectionType: 'file'
            };
            $scope.pictureModal.selectExisting = false;
        };

        $scope.pictureModal.convertFileToDataURL = function(file) {
            if (file) {
                Upload.base64DataUrl(file).then(function(url){
                    $scope.main.pictureForModal.src = url;
                    $scope.main.pictureForModal.filename = file.name;
                });
            }
        };

        $scope.pictureModal.updatePictureSlot = function() {
            viewFactory.replacePicID(modalData.currentView.id, modalData.viewLeft, modalData.viewFirstColumn, modalData.picListIndex, $scope.pictureModal.selectedID);
            $scope.$close();
        };

        $scope.pictureModal.clearPictureSlot = function() {
            viewFactory.removePicFromView(modalData.currentView.id, modalData.viewLeft, modalData.viewFirstColumn, modalData.picListIndex);
            $scope.$close();
        };

        $scope.pictureModal.updateModalPicture = function() {
            // If the picture has an id then this is an update operation, else it is a new picture
            if ($scope.main.pictureForModal.id) {
                pictureFactory.updatePicture($scope.main.pictureForModal);
            }
            else {
                // View Left and View First Column helper variables are added here so that the picture
                // can be added to the correct location in the view after the id is assigned by Firebase
                // (note that these helper variables are removed before the picture is stored).
                pictureFactory.addPicture($scope.main.pictureForModal).then(function (newPic) {
                    $scope.main.addPicToThisView(modalData.viewLeft, modalData.viewFirstColumn, newPic);
                    // The modal library adds a $close() function to scope - we want to close after add/edit
                    $scope.$close();
                });
            }
        };

        $scope.pictureModal.deleteModalPicture = function() {
            viewFactory.removePictureFromAllViews($scope.main.pictureForModal.id);
            pictureFactory.deletePicture($scope.main.pictureForModal.id).then(function() {
                // The modal library adds a $close() function to scope - we want to close after add/edit
                $scope.$close();
            });
        };
    });

})();
