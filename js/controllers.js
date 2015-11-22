var kvilleSchedulerApp = angular.module('kville-scheduler', []);

/**
global function called when google's api loads
*/
function gLoad(){
	angular.element(document).ready(function () {	
		window.onLoad();
	});
}

kvilleSchedulerApp.controller('EventCenter', function ($scope) {

	$scope.beginTentCreate = function() {
		
	}

});

kvilleSchedulerApp.controller('GoogleAuthCenter', ['$scope','gDriveCenter', 'parseCenter', function ($scope, gDriveCenter, parseCenter) {
	var CLIENT_ID = '861781706221-jbrikss56654b88j6q03m0e0efd19g5k.apps.googleusercontent.com';
	var SCOPES = ['https://www.googleapis.com/auth/drive'];

	$scope.authValid = false;
	$scope.tentId = null;

	$scope.onLoad = function() {
		$scope.checkAuth();
	}
	window.onLoad = $scope.onLoad;

	$scope.authenticate = function() {
		gapi.auth.authorize(
			{client_id: CLIENT_ID, scope: SCOPES, immediate: false},
			$scope.handleAuthResult);
	}

	/**
	* Check if current user has authorized this application.
	*/
	$scope.checkAuth = function () {
		gapi.auth.authorize(
			{client_id: CLIENT_ID, scope: SCOPES.join(' '), immediate: true},
			$scope.handleAuthResult);
	}

	/**
	* Handle response from authorization server.
	*
	* @param {Object} authResult Authorization result.
	*/
	$scope.handleAuthResult = function(authResult) {
		if (authResult && !authResult.error) {
			$scope.$apply(function() {
				$scope.authValid = true;
			});
			gDriveCenter.callScriptFunction('getAllDocumentIds');
		} 
		else {
			console.log(authResult);
		}
	}

}]);


kvilleSchedulerApp.factory('parseCenter', function(){
	var service = {};
	
	Parse.initialize("lnhmq8I9pfJtKHM5QkwoDghTSb3e0YJ74tWDZqe0", "g7LOnC1d5PBeCtVWb8Y3E47ir9xyhDEl8AjFuyj9");

	service.callCloudFunction = function(func){

	}

	return service;
});

kvilleSchedulerApp.factory('gDriveCenter', function(){
	var service = {};

    var scriptId = "M1s7xcfLTNa0sj06JM6RTcmpgqzTiy9x4";

    service.callScriptFunction = function(func){
		// Create an execution request object.
		var request = {
			'function': func
		};

		// Make the API request.
		var op = gapi.client.request({
			'root': 'https://script.googleapis.com',
			'path': 'v1/scripts/' + scriptId + ':run',
			'method': 'POST',
			'body': request
		});

		op.execute(function(resp) {
			if (resp.error && resp.error.status) {
				// The API encountered a problem before the script
				// started executing.
				console.log(resp.error);
			} else if (resp.error) {
				// The API executed, but the script returned an error.
				console.log(resp.error);
			} else {
				console.log(resp.response.result);
				return resp.response.result;
			}
		});
	}

	return service;
});