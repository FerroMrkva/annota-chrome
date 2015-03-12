var urls = {};

(function() {
	function get_urls(base, api_version) {
		if (api_version === undefined) api_version = '';
		return {
			base: base,
			base_bookmarks: base + '/bookmarks',
			help: base + '/help',
			login: base + '/log-in',
			logout: base + '/log-out',
			session: base + '/user_sessions',
			bookmark_find: base + '/api' + api_version + '/bookmarks/find',
			bookmark_upload: base + '/api' + api_version + '/bookmarks/upload',
			tags_autocomplete: base + '/api' + api_version + '/tags/autocomplete',
			tags: base + '/api' + api_version + '/tags',
			bookmarks: base + '/api' + api_version + '/bookmarks',
			highlights: base + '/api' + api_version + '/highlights',
			groups: base + '/api' + api_version + '/groups',
			groups_exist: base + '/api' + api_version + '/groups/exist',
			groups_share: base + '/api' + api_version + '/groups/share',
			useractions_leave: base + '/api' + api_version + '/user_actions/leave',
			useractions_related: base + '/api' + api_version + '/user_actions/related',
			useractions_related_scored: base + '/api' + api_version + '/user_actions/related_scored',
			useractions_tab_swith: base + '/api' + api_version + '/user_actions/tab_switch',
			useractions_search: base + '/api' + api_version + '/user_actions/search',
			useractions_acm_tab: base + '/api' + api_version + '/user_actions/acm_tab',
			search_keyword: base + '/api' + api_version + '/search/keyword',
			search_read_later: base + '/api' + api_version + '/search/read_later',
			search_related: base + '/api' + api_version + '/search/related',
			version: base + '/downloads/version.json'
		};
	};
	var api_version = '/v2';
	annota_urls = {
		production: get_urls('http://annota.fiit.stuba.sk', api_version),
		localhost: get_urls('http://localhost:3000', api_version),
		test_experiment: get_urls('http://annota-test.fiit.stuba.sk/experiment', api_version),
		test_staging: get_urls('http://annota-test.fiit.stuba.sk/staging', api_version)
	};
	urls = annota_urls.test_staging;
})();

