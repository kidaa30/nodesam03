/***********************
 * page functions
 ***********************/

$("[data-show-pageparent]").on('click', function(){
	var temp1 = "[data-pageparent=\'" + this.getAttribute("data-show-pageparent") + "\']";
	$(temp1).addClass('hidden');
	var temp2 = temp1 + "[data-pagename=\'" + this.getAttribute("data-show-pagename") + "\']";
	$(temp2).removeClass('hidden');
});