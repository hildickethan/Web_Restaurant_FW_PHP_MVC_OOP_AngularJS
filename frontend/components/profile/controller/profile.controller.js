/**
  * @this vm
  * @ngdoc controller
  * @name restaurantangular.controller:profileCtrl
  *
  * @description
  * Controller for the profile
*/
restaurantangular.controller('profileCtrl', function ($scope,$rootScope,services,userdata,toastr) {
    // TABS
    // tab navigation
    $scope.tab = 1;

    $scope.setTab = function (tabId) {
        $scope.tab = tabId;
    };

    $scope.isSet = function (tabId) {
        return $scope.tab === tabId;
    };

    // DROPZONE
    // dropzone.js configuration
    $scope.dropzoneConfig = {
        'options': {
          'url': 'backend/api/profile/upload-true',
          addRemoveLinks: true,
          acceptedFiles: 'image/*,.jpeg,.jpg,.png'
        },
        'eventHandlers': {
            'sending': function (file, xhr, formData) {
            //   console.log('sending');
            },
            'success': function (file, response) {
                response = JSON.parse(response);
                if (!response.result) {
                    toastr.error(response.error,"Error");
                } else {
                    var filename = response.data.substring(19);
                    // don't remember what this is but it was necessary
                    $scope.$apply(function(){
                        $scope.filename = 'backend/'+filename;
                    });
                    console.log($scope.filename);
                }
            },
            'removedfile': function (file, serverFilename) {
                // Delete file
                services.deleteF('profile','avatar').then(function(response){
                    console.log(response);
                    delete $scope.filename;
                });
            }
        }
    };
    
    // TAB 1, UPDATE
    ///////////////////////////////////

    /**
      * @ngdoc method
      * @name profileCtrl#update
      *
      * @methodOf
      * restaurantangular.controller:profileCtrl
      *
      * @description
      * Updates whatever the user has changed
    */
    $scope.update = function() {
        var extension = `username-${userdata.user.username}`;
        var data = {
            token: userdata.user.token
        };
        if(!$scope.profileF){
            $scope.profileF = {};
        }
        if ($scope.country.value != null && $scope.country.value.name != userdata.user.country){
            $scope.profileF.country = $scope.country.value.name;
        } else {
            delete $scope.profileF.country;
        }
        if ($scope.state.value != null && $scope.state.value.name != userdata.user.state){
            $scope.profileF.state = $scope.state.value.name;
        } else {
            delete $scope.profileF.state;
        }
        angular.forEach($scope.profileF, function(value, key) {
            if (value == ""){
                delete data[key];
            } else if (key != 'password2'){
                data[key] = value;
            } 
        });
        if ($scope.filename){
            data.avatar = $scope.filename;
        }
        console.log(data);
        
        updateProfile(extension,data);
    };

    // Initial country and state setting
    var country = null;
    var state = null;
    services.getResource('countries.json').then(function(response){
        angular.forEach(response, function(obj, key) {
            if (obj.name == userdata.user.country){
                country = obj;
                if (userdata.user.state != ""){
                    services.getResource(`countries/${country.filename}.json`).then(function(response2){
                        angular.forEach(response2, function(obj, key) {
                            if (obj.name == userdata.user.state){
                                state = obj;
                            }
                        });
                        extend(response,country,state);
                    });
                } else {
                    extend(response,country,state);
                }
            } else {
                extend(response,country,state);
            }
        });
    });

    /**
      * @ngdoc method
      * @name profileCtrl#extend
      *
      * @methodOf
      * restaurantangular.controller:profileCtrl
      *
      * @description
      * Uses angular.extend to the extend the $scope to a directive
      * 
      * @param {object} response all countries
      * @param {object} country users country
      * @param {object} state users state
    */
    function extend(response,country,state){
        angular.extend($scope,{
            country : {
                label : 'Country',
                values : response,
                value : country
            },
            state : {
                label : 'State',
                values : [],
                value : state
            }
        });
    }
    
    /**
      * @ngdoc method
      * @name profileCtrl#updateProfile
      *
      * @methodOf
      * restaurantangular.controller:profileCtrl
      *
      * @description
      * Function to make the requests
      * - Sends PUT request with the provided params
      * - Checks if it returns a token
      * - Refreshes with new token
      * 
      * - Logs out and throws to home if token is expired
      * 
      * @param {string} extension the GET variables
      * @param {object} data the POST data
    */
    function updateProfile(extension,data) {
        services.put('login',data,extension).then(function(response){
            if (response['token']){
                localStorage.setItem('token',response['token']);
                angular.forEach(data, function(value, key) {
                    if (key == 'avatar') {
                        $rootScope.user[key] = $scope.filename;
                        userdata.user[key] = $scope.filename;
                    } else if (key == 'token') {
                        $rootScope.user[key] = response['token'];
                        userdata.user[key] = response['token'];
                    } else {
                        $rootScope.user[key] = value;
                        userdata.user[key] = value;
                    }
                });
                toastr.success('Profile updated successfully','Success');
            } else {
                if (response == '"Expired token"'){
                    toastr.error('Expired token, please log back in', 'Error');
                    services.deleteF('login','logout').then(function(response){
                        if(response == "success"){
                            $rootScope.loggedin=false;
                            userdata = "";
                            localStorage.removeItem('token');
                            location.href = "#/";
                        }
                    });
                }
            }
        });
    }

   
});
