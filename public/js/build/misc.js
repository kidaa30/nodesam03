function ManualSubmitForm(formId, url, onloadFunc, onerrorFunc){
	$(formId).on('submit', function(e){
		e.preventDefault();
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onload = function(){
			onloadFunc(xmlhttp.responseText);
		};
		xmlhttp.onerror = onerrorFunc || function(){
			onloadFunc("XMLHttpRequest error");
		};;
		xmlhttp.open("POST", url, true);
		xmlhttp.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
		var submitJSON = {};
		$(formId+">input").each(function(){
			submitJSON[this.getAttribute("name")] = this.value;
		});
		xmlhttp.send(JSON.stringify(submitJSON));
		return false;
	});
}

function GotoPage(topage){
	var pageparent = topage.slice(0, topage.lastIndexOf("/")),
		parentSelector = "[data-pagename^=\'" + pageparent + "/\']",
		pageSelector = "[data-pagename=\'" + topage + "\']",
		fadeTime = 100;

	$(parentSelector).each(function(){
		if (this.getAttribute("data-pagename").lastIndexOf("/") === topage.lastIndexOf("/")){
			$(this).fadeOut(fadeTime);
			//$(this).addClass('hidden');
		}
	});
	$(pageSelector).delay(fadeTime+20).fadeIn(fadeTime);//.removeClass('hidden');
}

$("[data-show-topage]").css("cursor","pointer");
$("[data-show-topage]").on('click', function(){
	GotoPage(this.getAttribute("data-show-topage"));
});