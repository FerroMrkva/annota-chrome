$(document).ready(function(){
	chrome.runtime.sendMessage({
		'command': 'parseDocument',
		'url': document.URL,
		'title': document.title
	});
});

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
    if (request.command == 'getDocumentData'){
			var response = {
				'contentType': document.contentType,
				'html': document.documentElement.outerHTML,
				'referrer': document.referrer
			};
			if (request.queries){
				response.queries = [];
				request.queries.foreach(function(query){
					response.queries.push($(document).find(query));
				});
			}
      sendResponse(response);
		}
    if (request.command == 'query_document'){
			var response = {
				'contentType': document.contentType,
				'referrer': document.referrer
			};
			response.queries = [];
			var doc = $(document);
			request.queries.forEach(function(query){
				var q = doc.find(query);
				response.queries.push(q.length ? q[0].outerHTML : '');
			});
      sendResponse(response);
		}
  }
);
