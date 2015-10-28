$(document).ready(function(){

	/* scrolling support for desktop web */
	$('#dummy-scroll-box').bind('DOMMouseScroll MouseScrollEvent MozMousePixelScroll wheel scroll', function(e){

	    var evt = window.event || e //equalize event object     
	    evt = evt.originalEvent ? evt.originalEvent : evt; //convert to originalEvent if possible               
	    var delta = evt.detail ? evt.detail*(-40) : evt.wheelDelta //check for detail first, because it is used by Opera and FF

	    if(delta > 0) {
	        $('#time-label').html(decrementMinutes(1));
	    }
	    else{
	        $('#time-label').html(incrementMinutes(1));
	    }   
	});

	/* touch support for mobile safari */
	var lastY;
	$(document).bind('touchmove', function(e){
		var currentY = e.originalEvent.touches[0].clientY;
	     if(currentY > lastY){
	         $('#time-label').html(decrementMinutes(1));
	     }else if(currentY < lastY){
	         $('#time-label').html(incrementMinutes(1));
	     }
	     lastY = currentY;
	     //oh yea, and block the page bounce nonsense
	     e.preventDefault();
	});

	// TODO: momentum scrolling
	$(document).bind('touchend', function(e){

	});

})

$(window).scroll(function(){
	var st = $(this).scrollTop();

	console.log("scroll");
});