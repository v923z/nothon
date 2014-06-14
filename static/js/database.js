var _listing = new Object()

function arxiv_query(search_string) {
	// Produces the json representation of an arxiv query
	// Searching can be done by passing the particular query terms in the url as in 
	// http://export.arxiv.org/api/query?search_query=all:electron&start=0&max_results=1
	// http://arxiv.org/help/api/index
	// http://arxiv.org/help/api/user-manual
	
	// These are the query methods that can be passed to arxiv
	//ti	Title
	//au 	Author
	//abs 	Abstract
	//co 	Comment
	//jr 	Journal Reference
	//cat 	Subject Category
	//rn 	Report Number
	//id 	Id (use id_list instead)
	//all 	All of the above 
	// Note that at the moment, we support searching for names only!
	var url = 'http://export.arxiv.org/api/query?search_query=' + search_string

	for (var key in _listing) delete _listing[key]
	var counter = 0
	var date = new Date()
	
	$.get(url, function (data, success) {
		if(success !== 'success') {
			$('#database_search_results').html('<p>Could not process request: ' + success + '</p>')
			return null
		}
		$(data).find('entry').each(function () { 			
			var el = $(this)
			var entry = new Object()
			counter += 1
			var _key = el.find('id').text().split('/')
			entry['key'] = _key[_key.length-1]
			entry['title'] = $.trim(el.find('title').text())
			var _authors = new Array()
			el.find('author').each(function() { 
				_authors.push($(this).text().trim())
			})
			el.find('link').each(function() {
				if($(this).attr('title') === 'pdf') {
					entry['pdf'] = $(this).attr('href')
				} else if($(this).attr('title') === 'doi') {
					entry['doi'] = $(this).attr('href')
				} else {
					entry['url'] = $(this).attr('href')
				}
			})
			entry['author'] = _authors.join(' and ')
			entry['abstract'] = $.trim(el.find('summary').text())
			//entry['url'] = el.find('id').text()
			entry['journal'] = 'arxiv'
			entry['pages'] = '...'
			var month = (100 + date.getMonth() + 1).toString().slice(1,3)
			var day = (100 + date.getDate()).toString().slice(1,3)
			entry['timestamp'] = date.getFullYear() + '.' + month + '.' + day
			entry['year'] = date.getFullYear()
			_listing[entry['key']] = entry
		})
	}, 'xml')
	return _listing
}

function render_results(json) {
	// Renders the feed in html
	var all_html = ''
	for(var key in json) {
		var entry = json[key]
		var html = "<div class='arxiv-entry' id='" + entry.key + "'>"
		html += "<div class='arxiv-title'>" + entry.title
		html += "<a href='" + entry.pdf + "' target='_blank'> " + entry.key + "</a></div>"
		html += "<div class='arxiv-authors'>" + entry.author + "</div>"
		html += "<button type='button' id='button-" + entry.key +"' onmouseup='return insert_into_bibliography(this)'>Insert</button>"
		html += "<div class='arxiv-abstract'>" + entry.abstract + "</div>"
		html += "</div>"
		all_html += html
	}
	return all_html
}

function search_database(method) {
	$('#database_search_dialog').dialog({
		dialogClass: 'no-close ui-dialog',
		autoOpen: 	true,
		height:		250,
		width:		900,
		modal:		false,
		draggable:	true,
		hide:		'fade',
		title:		method + ' search',
		buttons:	{
			'Search' : function(){ _search() },
			'Cancel' : function(){ $(this).dialog('close') }
		}
	})
	if($('#database_search_dialog').is(':empty')) {
		// we should preserve the previous state, if the dialog has already been populated
		$('#database_search_dialog')
		.append('<p class="database_search_label">Author  </p>')
		.append('<form action="#" onsubmit="return _search()"><input id="database_search_author" /></form>')
		.append('<br><p class="database_search_label">Title  </p>')
		.append('<form action="#" onsubmit="return _search()"><input id="database_search_title" /></form>')
		.append('<select id="select_title"><option value="AND">AND</option><option value="OR">OR</option><option value="ANDNOT">ANDNOT</option></select>')
		.append('<br><p class="database_search_label">Abstract  </p>')
		.append('<form action="#" onsubmit="return _search()"><input id="database_search_abstract" /></form>')
		.append('<select id="select_abstract"><option value="AND">AND</option><option value="OR">OR</option><option value="ANDNOT">ANDNOT</option></select>')
		.append('<div id="database_search_results"></div>')
	}
}

function replace_arxiv_escape_character(string) {
	return string.replace(/\"/g, '%22')
				.replace(/\(/g, '%28')
				.replace(/\)/g, '%29')
}

function _search() {
	var method = $('#database_search_dialog').dialog('option', 'title')
	var author = $('#database_search_author').val()
	var title = $('#database_search_title').val()
	var abstract = $('#database_search_abstract').val()
	var dialog_title = $('#database_search_dialog').dialog('option', 'title') + ' - loading...'
	$('#database_search_dialog').dialog('option', {'title': dialog_title})
	
	var search_items = new Array();
	console.log($('#select_author').val())
	if(method === 'arxiv search') {
		if(author.length > 0) {
			search_items.push('au:' + replace_arxiv_escape_character(author))
		}
		if(title.length > 0) {
			if(search_items.length > 0) {
				search_items.push($('#select_title option:selected').text())
			}
			search_items.push('ti:' + replace_arxiv_escape_character(title))
		}
		if(abstract.length > 0) {
			if(search_items.length > 0) {
				search_items.push($('#select_abstract option:selected').text())
			}
			search_items.push('abs:' + replace_arxiv_escape_character(abstract))
		}
		console.log(search_items.join('+'))
		var entries = arxiv_query(search_items.join('+'))
	} else if(method === 'crossref search') {
		var entries = crossref_query(author)
	}
	
	// It is unclear, what the timeout should really be...
	window.setTimeout(function(){ insert_entries(entries) }, 1000)
	return false
}

function insert_entries(entries) {
	// Takes json representation returned from the query handler, and 
	// places the results into the modal window
	var title = $('#database_search_dialog').dialog('option', 'title')
	$('#database_search_dialog').dialog('option', {'title': title.replace(' - loading...', '')})

	var html
	if(entries) {
		html = render_results(entries)
	} else {
		html = '<p>No entries returned</p>'
	}
	$('#database_search_results').html(html)
}


function insert_into_bibliography(button) {
	// Inserts an arxiv/doi.org entry into the bibliography list
	var entry = _listing[$(button).attr('id').replace('button-', '')]
	add_row("#publication_list", 'article')
	var uuid = get_active_paper()
	for(var key in entry) {
		bibliography[uuid][key] = entry[key]
	}
	fill_in_row(uuid)
	fill_in_fields(uuid)
}

function crossref_query(name) {
	// for names for now
	var url = 'http://api.crossref.org/works?query=' + name
	for (var key in _listing) delete _listing[key]
	var counter = 0
	var date = new Date()
	$('#database_search_results').html('<p>Loading...</p>')
	
	$.get(url, function (data, success) {
		if(success !== 'success') {
			$('#database_search_results').html('<p>Could not process request: ' + success + '</p>')
			return null
		}
		console.log(data['message']['items'])
		for(k in data['message']['items']) {
			var _entry = data['message']['items'][k]
			var entry = new Object()
			entry['title'] = _entry['title']
			entry['doi'] = _entry['DOI']
			entry['year'] = _entry['year']			
		}
	}, 'json')
	
}

