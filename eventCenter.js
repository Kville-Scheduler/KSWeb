var currentTime = new moment();


function incrementMinutes(delta){
	currentTime.add(delta, 'm');
	return currentTime.format('hh:mm A');
}

function decrementMinutes(delta){
	return incrementMinutes(-delta);
}