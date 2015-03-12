var article_parser = (function(){
	var parsers = [];
	return {
		query_document: function(tabId, queries, callback){
			chrome.tabs.sendMessage(tabId, {
				'command': 'query_document',
				'queries': queries
			}, function(response){
				callback({
					'url': response.url,
					'title': response.title,
					'contentType': response.contentType,
					'referrer': response.referrer,
					'queries': response.queries
				});
			});
		},
		add_parser: function(parser){
			parsers.push(parser);
		},
		parse: function(params, callback){
			for(var i=0;i<parsers.length;++i){
				var parser = parsers[i];
				if (parser.can_parse(params)){
					parser.parse(params, callback);
					return;
				}
			}
			callback(params);
		}
	};
})();
