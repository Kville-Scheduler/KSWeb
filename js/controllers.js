var kvilleSchedulerApp = angular
	.module('kville-scheduler', ['ngAnimate','datetimepicker']);

//google must call a global function when it loads, which we redirect to the EventCenter
var scopedLoad
function gLoad() {
	while (scopedLoad == null){
		//this is a (unsafe?) hack, but the assignment of scopedLoad is sometimes not ready in time
	}
	scopedLoad()
}

kvilleSchedulerApp.controller('EventCenter', ['$scope', 'GoogleAuthCenter', 'parseCenter', 'gDriveCenter', function ($scope, authCenter, parseCenter, gDriveCenter) {
	$scope.existingTentId;
	$scope.googleToken = '';
	$scope.gDocsBase = 'https://docs.google.com/spreadsheets/d/%id%/edit'
	$scope.gDocsLink = ''

	$scope.welcomeContentShown = true;
	$scope.doneBuilding = false;
	$scope.tentId = '';

	$scope.datetime = '05/13/2015 8:30 AM';
	//these options are immutable
	$scope.datetimeOptions = {inline:true,sideBySide:true};

	var parseUser;

	var blackStartDate;
	var blueStartDate;
	var whiteStartDate;
	var whiteEndDate;

	$scope.gLoad = function() {
		authCenter.authenticateImmediately(true).then(function(token){
			$scope.googleToken = token;
			showTentingStats();
		}, function(error){
		});
		checkForTent();
	}
	scopedLoad = $scope.gLoad

	checkForTent = function() {
		var query = getQueryParams(document.location.search)
		if (query.tent != null){
			$scope.existingTentId = query.tent
		}
	}

	showTentingStats = function() {
		parseCenter.logIn($scope.googleToken).then(function(user){
			return parseCenter.findTent(query.tent)
		}).then(function(tentObj){
			var gDocId = tentObj.get("gDocId")
			$scope.gDocsLink = $scope.gDocsBase.replace("%id%",gDocId)
		}, function(error){
			console.log(error);
		})
	}

	$scope.visitGoogleDoc = function() {
		window.location = $scope.gDocsLink
	}

	$scope.showTentCalendar = function() {
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

	$scope.createTent = function() {
		var name;
		var gDocId;
		authCenter.authenticate().then(function(authToken){
			return parseCenter.logIn(authToken);
		}).then(function(user){
			parseUser = user;
			return gDriveCenter.getProfileInfo();
		}).then(function(info){
			name = info.data.displayName;
			parseUser.set("name",name);
			return parseUser.save();
		}).then(function(){
			return gDriveCenter.createScheduleDoc();
		}).then(function(docId){
			gDocId = docId
			return parseCenter.createTent(gDocId);
		}).then(function(tentId){
			$scope.tentId = tentId;
			$scope.doneBuilding = true;
			return gDriveCenter.generateSchedule(gDocId,$scope.datetime,blackStartDate,blueStartDate,whiteStartDate,whiteEndDate,name);
		}).then(function(response){
			console.log(response);
		}, function(error){
			alert("We ran into an issue... Error: "+error);
			console.log(error);
		});
	}

	getQueryParams = function getQueryParams(qs) {
	    qs = qs.split('+').join(' ');

	    var params = {},
	        tokens,
	        re = /[?&]?([^=]+)=([^&]*)/g;

	    while (tokens = re.exec(qs)) {
	        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
	    }

	    return params;
	}

}]);

kvilleSchedulerApp.factory('GoogleAuthCenter', ['gDriveCenter', 'parseCenter', '$q', '$http', function (gDriveCenter, parseCenter, $q, $http) {
	var service = {};

	var CLIENT_ID = '181880965150-5t82e2cbf47v2s6obh44ed56b6mljrpt.apps.googleusercontent.com';
	var SCOPES = ['https://www.googleapis.com/auth/drive','https://www.googleapis.com/auth/plus.me','https://spreadsheets.google.com/feeds','https://www.googleapis.com/auth/script.storage','https://www.googleapis.com/auth/script.external_request','https://www.googleapis.com/auth/spreadsheets'];


	/**
	* Authenticate a user
	**/
	service.authenticate = function() {
		return $q(function(resolve,reject){
			service.authenticateImmediately(true).then(function(authToken){
				//immediate auth was successful
				resolve(authToken);
			}, function(error){
				//immediate auth failed, authenticate user
				service.authenticateImmediately(false).then(function(authToken){
					resolve(authToken);
				});
			});
		});
	}

	/**
	* Check if current user has authorized this application or authorize a user
	* @param immediate
	* whether to attempt authorization (false) or check authorization (true)
	*/
	service.authenticateImmediately = function(immediate){
		return $q(function(resolve, reject) {
			gapi.auth.authorize(
				{client_id: CLIENT_ID, scope: SCOPES, immediate: immediate},
				function(authResult){
					if (authResult && !authResult.error) {
						$http.defaults.headers.get = {'Authorization':'Bearer '+authResult.access_token};
						resolve(authResult.access_token);
					} 
					else {
						reject();
					}
				});
		});
	}

	return service;
}]);


kvilleSchedulerApp.factory('parseCenter', ['$q', function ($q) {
	var service = {};
	
	Parse.initialize("lnhmq8I9pfJtKHM5QkwoDghTSb3e0YJ74tWDZqe0", "g7LOnC1d5PBeCtVWb8Y3E47ir9xyhDEl8AjFuyj9");

	service.logIn = function(authToken){
		return $q(function(resolve,reject){
			service.callCloudFunction('authenticatedSignin',{access_token:authToken}).then(function(sessionToken){
				return Parse.User.become(sessionToken);
			}).then(function(user){
				resolve(user);
			}, function(error){
				reject(error);
			});
		});
	}

	service.findTent = function(tentId){
		var query = new Parse.Query("Tent")
		return query.get(tentId);
	}

	service.createTent = function(gDocId){
		return service.callCloudFunction('createTent',{gDocId:gDocId});
	}

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
}]);

kvilleSchedulerApp.factory('gDriveCenter', ['$http','$q', function ($http,$q) {
	var service = {};

    var scriptId = "MAL3MZOYPUIsYwMpyePn0h2pgqzTiy9x4";

    service.createScheduleDoc = function(){
    	return service.callScriptFunction("createSheet");
    }

    service.generateSchedule = function(docId,startDate,blackStartDate,blueStartDate,whiteStartDate,whiteEndDate,username){
    	var params = [docId,startDate,blackStartDate,blueStartDate,whiteStartDate,whiteEndDate,username];
    	return service.callScriptFunction("generateSchedule",params);
    }

    service.getProfileInfo = function(){
    	return $http({
    		method: 'GET',
    		url: 'https://www.googleapis.com/plus/v1/people/me'
    	});
    }

    service.callScriptFunction = function(func,params){
    	return $q(function(resolve,reject){
			// Create an execution request object.
			var request = {
				'function': func,
				'parameters': params
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
					reject(resp.error);
				} else if (resp.error) {
					// The API executed, but the script returned an error.
					reject(resp.error);
				} else {
					resolve(resp.response.result);
				}
			});
		});
	}

	return service;
}]);