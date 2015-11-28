var kvilleSchedulerApp = angular
	.module('kville-scheduler', ['ngAnimate','datetimepicker']);

kvilleSchedulerApp.controller('EventCenter', ['$scope', 'GoogleAuthCenter', 'parseCenter', function ($scope, authCenter, parseCenter) {
	$scope.welcomeContentShown;
	$scope.datetime = '05/13/2015 8:30 AM';
	//these options are immutable
	$scope.datetimeOptions = {inline:true,sideBySide:true};

	var blackStartDate;
	var blueStartDate;
	var whiteStartDate;
	var whiteEndDate;

	$scope.createTent = function() {
		$scope.welcomeContentShown = false;
		parseCenter.getCurrentSeason().then(
			function(object){
				blackStartDate = parseCenter.parseToMoment(object.get('blackStart'));
				blueStartDate = parseCenter.parseToMoment(object.get('blueStart'));
				whiteStartDate = parseCenter.parseToMoment(object.get('whiteStart'));
				whiteEndDate = parseCenter.parseToMoment(object.get('whiteEnd'));
				$scope.$apply(function() {
					$scope.datetime = blackStartDate;
					//breaking out of angular to set min and max dates
					//because our directive doesn't support it
					$('#datetimepicker').data('DateTimePicker').minDate(blackStartDate);
					$('#datetimepicker').data('DateTimePicker').maxDate(whiteEndDate);
				});
			},
			function(error){
				console.log(error);
			});
	}

	$scope.googleLogin = function() {
		authCenter.authenticate();
	}

}]);

kvilleSchedulerApp.factory('GoogleAuthCenter', ['gDriveCenter', 'parseCenter', function (gDriveCenter, parseCenter) {
	var service = {};

	var CLIENT_ID = '181880965150-5t82e2cbf47v2s6obh44ed56b6mljrpt.apps.googleusercontent.com';
	var SCOPES = ['https://www.googleapis.com/auth/drive','profile'];

	service.authenticate = function() {
		gapi.auth.authorize(
			{client_id: CLIENT_ID, scope: SCOPES, immediate: false},
			service.handleAuthResult);
	}

	/**
	* Check if current user has authorized this application.
	*/
	service.checkAuth = function () {
		gapi.auth.authorize(
			{client_id: CLIENT_ID, scope: SCOPES.join(' '), immediate: true},
			service.handleAuthResult);
	}

	/**
	* Handle response from authorization server.
	*
	* @param {Object} authResult Authorization result.
	*/
	service.handleAuthResult = function(authResult) {
		if (authResult && !authResult.error) {
			console.log(authResult);
			//gDriveCenter.callScriptFunction('getAllDocumentIds');
		} 
		else {
			console.log(authResult);
		}
	}

	return service;
}]);


kvilleSchedulerApp.factory('parseCenter', function(){
	var service = {};
	
	Parse.initialize("lnhmq8I9pfJtKHM5QkwoDghTSb3e0YJ74tWDZqe0", "g7LOnC1d5PBeCtVWb8Y3E47ir9xyhDEl8AjFuyj9");

	service.getCurrentSeason = function(){
		return service.callCloudFunction('getCurrentSeason');
	}

	service.callCloudFunction = function(func,params){
		return Parse.Cloud.run(func,params);
	}

	service.parseToMoment = function(date){
		//make date timezone agnostic
		return moment(date).utcOffset(0);
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