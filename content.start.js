chrome.runtime.sendMessage({
	'command': 'getBookmarkInfo',
	'url': document.URL
});
