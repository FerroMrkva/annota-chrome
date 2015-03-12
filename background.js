var bookmarks = {};

function setBookmarkInfo(details, override){
	if (bookmarks[details.url] === undefined){
		bookmarks[details.url] = details;
		bookmarks[details.url]._set_count = 1;
		return;
	}
	var bookmark = bookmarks[details.url];
	for (var field in details){
		if (bookmark[field] === undefined || override)
			bookmark[field] = details[field];
	}
	bookmark._set_count++;
	localStorage[details.url] = JSON.stringify(bookmark);
}

function setIcon(tabId, bookmarked){
	chrome.browserAction.setIcon({
		'path': bookmarked ? 'data/Annota-48.png' : 'data/Annota2.png',
		'tabId': tabId
	});
}

function reloadBookmark(tabId, url, callback){
	$.ajax({
		'url': urls.bookmark_find,
		'data': { 'url': url },
		'dataType': 'json'
	}).done(function(bookmark_info){
		if (bookmark_info.bookmarked){
			bookmark_info.url = url;
			// the page is already bookmarked, override all info
			setBookmarkInfo(bookmark_info, true);
			//console.log(bookmark_info);
			// set icon to bookmarked
			setIcon(tabId, true);
		} else {
			setBookmarkInfo({
				'url': url,
				'bookmarked': false
			});
		}
		if (callback) callback(bookmark_info);
	}).fail(function(){
		if (callback) callback({
			'url': url
		});
	});
}

function addBookmark(tabId, details, callback){
	var bookmark_data = bookmarks[details.url];
	if (bookmark_data === undefined || bookmark_data._set_count < 2) {
		setTimeout(10, function(){
			addBookmark(details, callback);
		});
		return;
	}
	setIcon(tabId, true);
	bookmark_data.bookmarked = true;
	setBookmarkInfo(bookmark_data, true);
	setBookmarkInfo(details, true);
	bookmark_data = bookmarks[details.url];
	$.ajax({
		'url': urls.bookmarks,
		'type': 'POST',
		'data': bookmark_data
	}).done(function(bookmark_data){
		reloadBookmark(tabId, details.url, function(bookmark_data){
			setBookmarkInfo(bookmark_data, true);
			if (callback) callback(bookmark_data);
			chrome.notifications.create('a', {
				'type': 'basic',
				'iconUrl': 'data/Annota.png',
				'title': 'Bookmark ' + (callback ? 'added' : 'updated'),
				'message':
					'You have successfully ' +
					(callback ? 'added a bookmark to ' : 'updated a bookmark in ') +
					'Annota.'
			}, function(){});
		});
	}).fail(function(e){
		console.error('Failed to create bookmark');
		console.error(e);
		if (callback) {
			setIcon(tabId, false);
			callback('failed');
		}
		chrome.notifications.create('b', {
			'type': 'basic',
			'iconUrl': 'data/Annota.png',
			'title': 'Error',
			'message':
				'There was an error while ' +
				(callback ? 'adding' : 'updating') +
				' bookmark to Annota. Please reload the page and try again or ' +
				(callback ? 'add' : 'update') +
				' it directly in <a href="' +
				(callback ? urls.base :
				 urls.base_bookmarks + '/' + bookmark_data.bookmark_id + '/edit') +
				'">Annota</a>.'
		}, function(){});
	});
}

function removeBookmark(tabId, url){
	var id = bookmarks[url].id;
	$.ajax({
		'url': urls.bookmarks + '/' + id,
		'type': 'DELETE'
	}).done(function(){
		setIcon(tabId, false);
		bookmarks[url].bookmarked = false;
		setBookmarkInfo(bookmarks[url]);
		chrome.notifications.create('a', {
			'type': 'basic',
			'iconUrl': 'data/Annota.png',
			'title': 'Bookmark removed',
			'message': 'You have successfully removed a bookmark.'
		}, function(){});
	}).fail(function(e){
		console.error('failed to remove bookmark');
		console.error(e);
		chrome.notifications.create('b', {
			'type': 'basic',
			'iconUrl': 'data/Annota.png',
			'title': 'Error',
			'message': 'There was an error while removing bookmark from Annota. Please reload the page and try again or remove it directly in <a href="' + urls.base + '">Annota</a>.'
		}, function(){});
	});
}

function shareInGroup(group, url, comment, err, done){
	$.ajax({
		'url': urls.groups_share,
		'type': 'POST',
		'data': {
			'id': group,
			'url': url,
			'comment': comment
		}
	}).done(function(data){
		done(data);
	}).error(err);
}

function shareInGroups(details, callback){
	var groups = details.group_share_list;
	(function go(i){
		if (i == groups.length) {
			if (callback) callback();
			return;
		}
		shareInGroup(groups[i].id, details.url, details.group_share_comment, function(e){
			console.error('failed to share in group ' + groups[i].name);
			console.error(e);
			chrome.notifications.create('b', {
				'type': 'basic',
				'iconUrl': 'data/Annota.png',
				'title': 'Error',
				'message': 'There was an error while sharing bookmark in group ' + groups[i].name + ' on Annota. Please reload the page and try again or share it directly in <a href="' + urls.base + '">Annota</a>.'
			}, function(){});
		}, function(){
			chrome.notifications.create('a', {
				'type': 'basic',
				'iconUrl': 'data/Annota.png',
				'title': 'Sharing bookmark on Annota',
				'message': 'You have successfully shared "' + details.title + '" in group "' + groups[i].name + '" on Annota.'
			}, function(){});
			go(i+1);
		});
	})(0);
}

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.command == 'getBookmarkInfo'){
			// page not loaded yet, meanwhile, get info from server
			reloadBookmark(sender.tab.id, request.url);
		} else if (request.command == 'parseDocument'){
			// page is loaded, parse it
			article_parser.parse({
				'url': request.url,
				'title': request.title,
				'tabId': sender.tab.id
			}, setBookmarkInfo);
		} else if (request.command == 'addBookmark'){
			if (request.sendQuickResponse) sendResponse();
			addBookmark(request.tabId, request.details,
					request.sendQuickResponse ? null : sendResponse);
			return true;
		} else if (request.command == 'removeBookmark'){
			removeBookmark(request.tabId, request.url);
			sendResponse();
			return true;
		} else if (request.command == 'shareInGroup'){
			if (request.sendQuickResponse) sendResponse();
			shareInGroups(request.details,
					request.sendQuickResponse ? null : sendResponse);
			return true;
		}
	}
);

function inject_content_scripts(tabId) {
	chrome.tabs.executeScript(tabId, {
		'file': 'content.start.js',
		'runAt': 'document_start'
	}, function() {
		chrome.tabs.executeScript(tabId, {
			'file': 'external/jquery-2.0.3.min.js',
			'runAt': 'document_end'
		}, function() {
			chrome.tabs.executeScript(tabId, {
				'file': 'content.js',
				'runAt': 'document_end'
			});
		});
	});
}

var tabs_no_cs = [];

// get all tabs without content scripts
chrome.tabs.query({}, function(tabs) {
	tabs.forEach(function(tab) {
		tabs_no_cs[tab.id] = true;
	});
	chrome.tabs.query({
		'active': true
	}, function(current_tabs) {
		current_tabs.forEach(function(tab) {
			if (tabs_no_cs[tab.id]) {
				inject_content_scripts(tab.id);
				delete tabs_no_cs[tab.id];
			}
		});
	});
});

// insert content script if not yet inserted
chrome.tabs.onActivated.addListener(function(activeInfo) {
	if (tabs_no_cs[activeInfo.tabId]) {
		inject_content_scripts(activeInfo.tabId);
		delete tabs_no_cs[activeInfo.tabId];
	}
});
