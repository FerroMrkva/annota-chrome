$('.h4').prop('tooltipText', 'Go to Annota homepage').click(function(){
	chrome.tabs.create({'url': urls.base });
});

(function checkLoggedIn(){
	$.ajax({
		'url': urls.session,
		'dataType': 'json'
	}).done(function(loggedIn){
		if (loggedIn){
			chrome.browserAction.setPopup({'popup':'popup.html'});
			window.location.href='popup.html';
		}
		init();
	});
})();

function init(){
	$('#new_user_session').ajaxForm({
		'url': urls.session,
	 	'type': 'post',
		'complete': function(){
			chrome.browserAction.setPopup({'popup':'init.html'});
			window.location.href='init.html';
		}
	});
}
