var bookmark = {};
var tab;
var groups = [];

(function onStart(){
	chrome.tabs.query({
	 	'currentWindow': true,
		'active': true
	}, function (tabArray) {
		tab = tabArray[0];
		bookmark = localStorage[tab.url];
		bookmark = bookmark ? JSON.parse(bookmark) : {};
		init();
	});
})();

(function checkLoggedIn(){
	$.ajax({
		'url': urls.session,
		'dataType': 'json'
	}).done(function(loggedIn){
		if (!loggedIn){
			chrome.browserAction.setPopup({'popup': 'login.html'});
			window.location.href = 'login.html';
		}
	});
})();

function tagSource(search, showChoices){
	var This = this;
	$.ajax({
		'url': urls.tags_autocomplete + '?q=' + search.term,
		'dataType': 'json'
	}).done(function(choices){
		showChoices(This._subtractArray(choices, This.assignedTags()));
	});
}

function groupsSource(search, showChoices){
	var This = this;
	$.ajax({
		'url': urls.groups,
		'dataType': 'json'
	}).done(function(choices){
		groups = choices.filter(function(tag){
			return tag.name.indexOf(search.term) != -1;
		});
		var auto_tags = groups.map(function(tag){
			return tag.name;
		});
		showChoices(This._subtractArray(auto_tags, This.assignedTags()));
	});
}

function add_focus(item, container){
	return item.focus(function(){
		container.addClass("form-control-focus");
	}).focusout(function(){
		container.removeClass("form-control-focus");
	});
}

function update_bookmark_data(bookmark_data) {
	if (bookmark_data.title){
		$('#title').prop('value', bookmark_data.title);
	}
	if (bookmark_data.tags){
		bookmark_data.tags.forEach(function(tag){
			$('#tag_list').tagit('createTag', tag);
		});
	}
	if (bookmark_data.note){
		$('#note').prop('value', bookmark_data.note);
	}
	if (bookmark_data.public_note){
		$('#public_note').prop('value', bookmark_data.public_note);
	}
	if (bookmark_data.read_later !== undefined){
		$('#read_later').prop('checked', bookmark_data.read_later);
	}
	if (bookmark_data.public !== undefined){
		$('#public').prop('checked', bookmark_data.public);
	}
}

function get_bookmark_data(){
	bookmark.url = tab.url;
	bookmark.title = $('#title').prop('value');
	//bookmark.tags = $('#tag_list').tagit('assignedTags');
	bookmark.tags = $('#tag_list .tagit-label').toArray().map(function(item){
		return $(item).text();
	});
	bookmark.tag_count = bookmark.tags.length;
	bookmark.note = $('#note').prop('value');
	bookmark.public_note = $('#public_note').prop('value');
	bookmark.read_later = $('#read_later').prop('checked');
	bookmark.public = $('#public').prop('checked');
	//bookmark.group_share_list = $('#group_share_list').tagit('assignedTags');
	bookmark.group_share_list = $('#group_share_list .tagit-label').toArray().map(function(item){
		var name = $(item).text();
		return groups.filter(function(group){
			return group.name == name;
		})[0];
	});
	bookmark.group_share_comment = $('#comment').prop('value');
	return bookmark;
}

function init(){
	$('.h4').prop('tooltipText', 'Go to Annota homepage').click(function(){
		chrome.tabs.create({'url': urls.base });
	});

	// logout handler
	$('#logout_button').click(function(){
		$.ajax({
			'url': urls.logout
		}).done(function(){
			// set icon to unbookmarked
			chrome.browserAction.setIcon({'path':'data/Annota2.png'}, function(){
				chrome.browserAction.setPopup({'popup':'login.html'});
				window.location.href='login.html';
			});
		});
	});

	add_focus($('#title'), $('#title-container'));

	// init tags form input
	$('#tag_list').tagit({
		allowSpaces: true,
		fieldName: "tag_string",
		placeholderText: "Tags",
		singleField: true,
		singleFieldNode: $('#tag_string'),
		tagSource: tagSource
	});
	add_focus($('#tag_list input').addClass('form-control'), $('#tag_list')).autocomplete("option", "delay", 0);
	$('#tags-ajax-loader').appendTo('#tag_list');

	//// recommend to users
	//$('#target_user_ids').select2({
    //multiple: true,
    //minimumInputLength: 1,
    //ajax: {
      //url: "<%= autocomplete_users_path %>",
      //dataType: 'json',
      //data: function (term, page) {
        //return {
          //q: term // search term
        //};
      //},
      //results: function (data, page) {
        //return {results: data};
      //}
    //},
    //formatResult: function(user) {
      //var markup = "<div class='user-recommendation-result'>";
      //markup    +=   "<div class='user-avatar'><img src='" + user.avatar_url + "'/></div>";
      //markup    +=   "<div class='user-info'>"
      //markup    +=     "<div class='user-name'><strong>" + user.name + "</strong></div>";
      //markup    +=     "<div class='user-email'>" + user.email + "</div>";
      //markup    +=   "</div>"
      //markup    +=   "<div class='clearfix'></div>"
      //markup    += "</div>";
      //return markup;
    //},
    //formatSelection: function(user) {
      //return user.name;
    //},
    //dropdownCssClass: "bigdrop",
    //escapeMarkup: function (u) { return u; } // disable markup escaping
  //});
	
	$('#commit').click(function(){
		chrome.runtime.sendMessage({
			'command': 'addBookmark',
			'tabId': tab.id,
			'details': get_bookmark_data(),
			'sendQuickResponse': true
		}, function(){
			window.close();
		});
	});
	
	// init shared in groups form input
	$('#group_share_list').tagit({
		allowSpaces: true,
		fieldName: "group_share_string",
		placeholderText: "Share in group",
		singleField: true,
		singleFieldNode: $('#tag_string'),
		tagSource: groupsSource
	});
	$('#group_share_list input').addClass('form-control').focus(function(){
		$('#group_share_list').addClass("form-control-focus");
		$('#group_share_list input').autocomplete('search');
	}).focusout(function(ev){
		$('#group_share_list').removeClass("form-control-focus");
	}).autocomplete("option", "minLength", 0).autocomplete("option", "autoFocus", true).autocomplete("option", "delay", 0);
	
	$('#group_share').click(function(){
		$('#share .tagit-new input').prop('disabled', true);
		$('#comment').prop('disabled', true);
		$('#group_share').prop('disabled', true);
		$('#group_share').prop('value', 'Sharing...');
		chrome.runtime.sendMessage({
			'command': 'shareInGroup',
			'tabId': tab.id,
			'details': get_bookmark_data(),
			'sendQuickResponse': true
		}, function(){
			//window.close();
			$('#group_share_list').tagit('removeAll');
			$('#comment').prop('value', '');
			$('#share .tagit-new input').prop('disabled', false);
			$('#comment').prop('disabled', false);
			$('#group_share').prop('disabled', false);
			$('#group_share').prop('value', 'Share');
		});
	});

	// add bookmark
	$('.ajax-loader').css('display', 'none');
	update_bookmark_data(bookmark);
	if (bookmark.bookmarked) {
		$('#popup_header .h4').text('Bookmark in Annota');
	} else {
		$('#popup_header .ajax-loader').css('display', 'block');
		chrome.runtime.sendMessage({
			'command': 'addBookmark',
			'tabId': tab.id,
			'details': {
				'url': tab.url
			},
			'sendQuickResponse': false
		}, function(bookmark_info){
			if (bookmark_info == 'failed') window.close();
			$('#popup_header .h4').text('Bookmark added in Annota!');
			$('#popup_header .ajax-loader').css('display', 'none');
			bookmark = bookmark_info;
			//console.log(bookmark);
			update_bookmark_data(bookmark);
		});
	}

	// cancel removes bookmark
	$('#cancel_button').click(function(){
		chrome.runtime.sendMessage({
			'command': 'removeBookmark',
			'url': tab.url,
			'tabId': tab.id
		}, function(){
			window.close();
		});
	});
}
