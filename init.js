(function checkLoggedIn(){
	$.ajax({
		'url': urls.session,
		'dataType': 'json'
	}).done(function(loggedIn){
		if (loggedIn){
			chrome.browserAction.setPopup({'popup':'popup.html'});
			window.location.href='popup.html';
		} else {
			chrome.browserAction.setPopup({'popup':'login.html'});
			window.location.href='login.html';
		}
	}).fail(function(){
		// TODO
		chrome.browserAction.setPopup({'popup':'login.html'});
		window.location.href='login.html';
	});
})();
