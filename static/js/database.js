function parse_arxiv_feed(url) {
	// Produces the json representation of an arxiv feed given in the url
	// Searching can be done by passing the particular query terms in the url as in 
	// http://export.arxiv.org/api/query?search_query=all:electron&start=0&max_results=1
	// http://arxiv.org/help/api/index
	// http://arxiv.org/help/api/user-manual
	var arxiv_listing = new Object()
	var counter = 0
	var date = new Date()
	$.get(url, function (data, success) {
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
				if($(this).title == 'pdf') {
					entry['pdf'] = $(this).href()
				}
			})
			entry['author'] = _authors.join(' and ')
			entry['abstract'] = $.trim(el.find('summary').text())
			entry['url'] = el.find('id').text()
			entry['journal'] = 'arxiv'
			entry['pages'] = '...'
			var month = (100 + date.getMonth() + 1).toString().slice(1,3)
			var day = (100 + date.getDate()).toString().slice(1,3)
			entry['timestamp'] = date.getFullYear() + '.' + month + '.' + day
			entry['year'] = date.getFullYear()
			arxiv_listing[entry['key']] = entry
		}),
		'xml'
	})
	return arxiv_listing
}

function arxiv_search(name) {
	// These are the query methods that can be passed to arxiv
	//au 	Author
	//abs 	Abstract
	//co 	Comment
	//jr 	Journal Reference
	//cat 	Subject Category
	//rn 	Report Number
	//id 	Id (use id_list instead)
	//all 	All of the above 
	// Note that at the moment, we support searching for names only!
	return parse_arxiv_feed('http://export.arxiv.org/api/query?search_query=au:' + name)
}

function render_results(json) {
	// Renders the feed in html
	var all_html = ''
	console.log('json: ', json)
	console.log('length: ', Object.keys(json).length)
	console.log('keys: ', Object.keys(json))
	console.log('entry: ', json['1207.2090v2'])
	for(var key in json) {
		var entry = json[key]
		var html = "<div class='arxiv-entry' id='" + entry.key + "'>"
		html += "<div class='arxiv-title'>" + entry.title
		html += "<a href='" + entry.pdf + "' target='_blank'> " + entry.key + "</a></div>"
		html += "<div class='arxiv-authors'>" + entry.author + "</div>"
		html += "<div class='arxiv-abstract'>" + entry.abstract + "</div>"
		html += "</div>"
		all_html += html
	}
	console.log(all_html)
	return all_html
}

function search_arxiv() {
	var author = $('#database_search_author').val()
	console.log('Author: ', author)
	var entries = arxiv_search(author)
	var html = render_results(entries)
	$('#database_search_results').html(html)
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
			'Search' : function(){ 
					if(method === 'arxiv') {
						search_arxiv()
					} else if(method === 'doi') {
						
					}
				},
			'Cancel' : function(){ $(this).dialog('close') }
		}
	})
	$('#database_search_dialog').html('<p>Author</p><input id="database_search_author" /><div id="database_search_results"></div>')
}
