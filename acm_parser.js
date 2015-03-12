(function(){
	var acm_parser = {};

	function parseAuthors(authors_string) {
		var author, authors, authors_names, first, i, index, last, _i, _len;
		authors = authors_string.split(";").map(function(element) {
			return element.trim();
		});
		authors_names = [];
		for (i = _i = 0, _len = authors.length; _i < _len; i = ++_i) {
			author = authors[i];
			index = author.indexOf(",");
			first = author.slice(0, index);
			last = author.slice(index + 1, +(author.length - 1) + 1 || 9e9);
			authors_names.push("" + first + " " + last);
		}
		return authors_names.join("\n");
	};

	function parseYear(text) {
		var matches, result;
		matches = text.match("[0-9]{4}");
		result = null;
		if (matches) {
			result = matches[matches.length - 1];
		}
		return result;
	};

	acm_parser.name = 'acm_parser';

	acm_parser.can_parse = function(document_info){
		return document_info.url.indexOf("http://dl.acm.org/citation.cfm") == 0;
	};

	acm_parser.parse = function(params, callback) {
		var authorsMeta, dateMeta, publisherMeta, firstpageMeta, conferenceMeta, journalMeta, lastpageMeta, titleMeta;
		var details = {
			'url': params.url
		};
		if (params.title) details.title = params.title;
		var queries = [
			'meta[name=citation_journal_title]',
			'meta[name=citation_conference]',
			'meta[name=citation_publisher]',
			'meta[name=citation_authors]',
			'meta[name=citation_title]',
			'meta[name=citation_volume]',
			'meta[name=citation_issue]',
			'meta[name=citation_issn]',
			'meta[name=citation_firstpage]',
			'meta[name=citation_lastpage]',
			'meta[name=citation_date]'
		];
		article_parser.query_document(params.tabId, queries, function(response){
			var q = response.queries;
			if (q[0]){
				details.journal = $(q[0]).attr('content');
			}
			if (q[1]){
				details.conference = $(q[1]).attr('content');
			}
			if (q[2]){
				details.publisher = $(q[2]).attr('content');
			}
			if (q[3]){
				details.authors = parseAuthors($(q[3]).attr('content'));
			}
			if (q[4]){
				details.title = $(q[4]).attr('content');
			}
			if (q[5]){
				details.volume = $(q[5]).attr('content');
			}
			if (q[6]){
				details.issue = $(q[6]).attr('content');
			}
			if (q[7]){
				details.issn = $(q[7]).attr('content');
			}
			if (q[8] && q[9]){
				details.pages = $(q[8]).attr('content') + '-' + $(q[9]).attr('content');
			}
			if (q[10]){
				details.year = parseYear($(q[10]).attr('content'));
			}
			callback(details);
		});
	};

	article_parser.add_parser(acm_parser);
})();
