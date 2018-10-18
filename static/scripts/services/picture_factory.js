(function () {
    'use strict';

    angular.module('goalgrid').factory('pictureFactory', ['$q', '$firebaseObject', 'firebaseFactory', function($q, $firebaseObject, firebaseFactory) {
        var pictureFactory = {};

        var picturesRef = firebaseFactory.thisUserRef.child('pictures');
        pictureFactory.allPictures = {};

        var getRefFromPicture = function(picture) {
            return picturesRef.child(picture.id);
        };

        var hardCodedPictures = {
            1: { "id": 1, "goalTypeID": 1, "src": "static/img/1_small.jpg" },
            2: { "id": 2, "goalTypeID": 1, "src": "static/img/2_small.jpg" },
            3: { "id": 3, "goalTypeID": 1, "src": "static/img/3_small.jpg" },
            4: { "id": 4, "goalTypeID": 1, "src": "static/img/4_small.jpg" },
            5: { "id": 5, "goalTypeID": 1, "src": "static/img/5_small.jpg" },
            6: { "id": 6, "goalTypeID": 1, "src": "static/img/6_small.jpg" },
            7: { "id": 7, "goalTypeID": 1, "src": "static/img/7_small.jpg" },
            8: { "id": 8, "goalTypeID": 1, "src": "static/img/8_small.jpg" },
            9: { "id": 9, "goalTypeID": 1, "src": "static/img/9_small.jpg" },
            10: { "id": 10, "goalTypeID": 1, "src": "static/img/10_small.jpg" },
            11: { "id": 11, "goalTypeID": 1, "src": "static/img/11_small.jpg" },
            12: { "id": 12, "goalTypeID": 1, "src": "static/img/12_small.jpg" },
            13: { "id": 13, "goalTypeID": 1, "src": "static/img/13_small.jpg" },
            14: { "id": 14, "goalTypeID": 1, "src": "static/img/14_small.jpg" },
            15: { "id": 15, "goalTypeID": 1, "src": "static/img/15_small.jpg" },
            16: { "id": 16, "goalTypeID": 1, "src": "static/img/16_small.jpg" }
        };

        var hardCodedBigPictures = {
            1: { "id": 1, "goalTypeID": 1, "src": "static/img/1.jpg" },
            2: { "id": 2, "goalTypeID": 1, "src": "static/img/2.jpg" },
            3: { "id": 3, "goalTypeID": 1, "src": "static/img/3.jpg" },
            4: { "id": 4, "goalTypeID": 1, "src": "static/img/4.jpg" },
            5: { "id": 5, "goalTypeID": 1, "src": "static/img/5.jpg" },
            6: { "id": 6, "goalTypeID": 1, "src": "static/img/6.jpg" },
            7: { "id": 7, "goalTypeID": 1, "src": "static/img/7.jpg" },
            8: { "id": 8, "goalTypeID": 1, "src": "static/img/8.jpg" },
            9: { "id": 9, "goalTypeID": 1, "src": "static/img/9.jpg" },
            10: { "id": 10, "goalTypeID": 1, "src": "static/img/10.jpg" },
            11: { "id": 11, "goalTypeID": 1, "src": "static/img/11.jpg" },
            12: { "id": 12, "goalTypeID": 1, "src": "static/img/12.jpg" },
            13: { "id": 13, "goalTypeID": 1, "src": "static/img/13.jpg" },
            14: { "id": 14, "goalTypeID": 1, "src": "static/img/14.jpg" },
            15: { "id": 15, "goalTypeID": 1, "src": "static/img/15.jpg" },
            16: { "id": 16, "goalTypeID": 1, "src": "static/img/16.jpg" }
        };

        var hardCodedMixPictures = {
            1: { "id": 1, "goalTypeID": 1, "src": "static/img/1_med.jpg" },
            2: { "id": 2, "goalTypeID": 1, "src": "static/img/2_small.jpg" },
            3: { "id": 3, "goalTypeID": 1, "src": "static/img/3.jpg" },
            4: { "id": 4, "goalTypeID": 1, "src": "static/img/4.jpg" },
            5: { "id": 5, "goalTypeID": 1, "src": "static/img/5.jpg" },
            6: { "id": 6, "goalTypeID": 1, "src": "static/img/6.jpg" },
            7: { "id": 7, "goalTypeID": 1, "src": "static/img/7_small.jpg" },
            8: { "id": 8, "goalTypeID": 1, "src": "static/img/8.jpg" },
            9: { "id": 9, "goalTypeID": 1, "src": "static/img/9.jpg" },
            10: { "id": 10, "goalTypeID": 1, "src": "static/img/10.jpg" },
            11: { "id": 11, "goalTypeID": 1, "src": "static/img/11.jpg" },
            12: { "id": 12, "goalTypeID": 1, "src": "static/img/12_small.jpg" },
            13: { "id": 13, "goalTypeID": 1, "src": "static/img/13_small.jpg" },
            14: { "id": 14, "goalTypeID": 1, "src": "static/img/14.jpg" },
            15: { "id": 15, "goalTypeID": 1, "src": "static/img/15_small.jpg" },
            16: { "id": 16, "goalTypeID": 1, "src": "static/img/16_small.jpg" }
        };

        pictureFactory.addViewIDToPicture = function(pic, viewID) {
            pictureFactory.allPictures[pic.id].viewIDs[viewID] = true;
            getRefFromPicture(pic).child('viewIDs/'+viewID).set(true);
        };

        pictureFactory.removeViewIDFromPicture = function(pic, viewID) {
            delete pictureFactory.allPictures[pic.id].viewIDs[viewID];
            getRefFromPicture(pic).child('viewIDs/'+viewID).set(null);
        };

        pictureFactory.getPictures = function() {
            var defObj = $q.defer();

            picturesRef.once("value", function(snapshot) {
                var dataFromServer = snapshot.val();
                if (dataFromServer) {
                    pictureFactory.allPictures = dataFromServer;
                }
                defObj.resolve(pictureFactory.allPictures);
            });

            return defObj.promise;
        };

        pictureFactory.updatePicture = function(updatedPicture) {
            var defObj = $q.defer();

            if (updatedPicture.selectionType === 'url') {
                delete updatedPicture.filename;
            }
            _.assign(pictureFactory.allPictures[updatedPicture.id], updatedPicture);
            getRefFromPicture(updatedPicture).set(updatedPicture);
            defObj.resolve(pictureFactory.allPictures[updatedPicture.id]);

            return defObj.promise;
        };

        pictureFactory.addPicture = function(newPicture) {
            var defObj = $q.defer();

            newPicture.id = picturesRef.push().key;
            pictureFactory.allPictures[newPicture.id] = newPicture;
            getRefFromPicture(newPicture).set(newPicture);
            defObj.resolve(pictureFactory.allPictures[newPicture.id]);

            return defObj.promise;
        };

        pictureFactory.deletePicture = function(pictureID) {
            var defObj = $q.defer();
            var deleteObj = {id: pictureID};

            delete pictureFactory.allPictures[pictureID];
            getRefFromPicture(deleteObj).set(null);
            defObj.resolve({});

            return defObj.promise;
        };

        return pictureFactory;
    }]);

})();
