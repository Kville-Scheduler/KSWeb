var CLIENT_ID = '861781706221-jbrikss56654b88j6q03m0e0efd19g5k.apps.googleusercontent.com';
var SCOPES = ['https://www.googleapis.com/auth/drive'];

exports.authorize = function () {
	gapi.auth.authorize(
		{client_id: CLIENT_ID, scope: SCOPES, immediate: false},
		handleAuthResult);
}

/**
* Check if current user has authorized this application.
*/
exports.checkAuth = function () {
	gapi.auth.authorize(
		{client_id: CLIENT_ID, scope: SCOPES.join(' '), immediate: true},
		handleAuthResult);
}

/**
* Handle response from authorization server.
*
* @param {Object} authResult Authorization result.
*/
exports.handleAuthResult = function(authResult) {
	var authorizeDiv = document.getElementById('authorize-div');
	if (authResult && !authResult.error) {
		// Hide auth UI, then load client library.
		authorizeDiv.style.display = 'none';
		callScriptFunction();
	} 
	else {
		// Show auth UI, allowing the user to initiate authorization by
		// clicking authorize button.
		authorizeDiv.style.display = 'inline';
	}
}