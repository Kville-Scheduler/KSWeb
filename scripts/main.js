var googleAuth = require(['googleAuth']);

var currentTime = new moment();




$(document).ready(function(){
	var tentId = location.search.split('?id=')[1];
	//getTentForId(tentId);

	/**
	* Open Oauth window after google connect button click
	*/
	$("#connect-google-button").click(function() {
		googleAuth.authorize();
	});
});






function loadRosterForTime(date){

}

function availableSlotsForTime(hour){

}