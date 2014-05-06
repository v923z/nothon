$(document).ready(function () {
	//$('#paper_save_menu').hide()
	$('.arxiv-save-button').mouseenter( function() {
		//arxiv_save_entry($(this).data('target'))
		//var offset = 
		$(this).find('li').each( function() { $(this).show() })
		//$(this).children().show()
		//offset()
		//console.log(offset.top, offset.left)
		//console.log($('#paper_save_menu').offset().top, $('#paper_save_menu').offset().left)
		//$('#paper_save_menu').offset({top: offset.top, left: offset.left+30})
		//$('#paper_save_menu').slideDown('slow')
	})
	$('.arxiv-save-button').mouseleave( function() {
		$(this).find('li').each( function() { $(this).hide() })
		//var offset = $(this).offset()
		//$('#paper_save_menu').offset({top: offset.top, left: offset.left+30})
		//$('#paper_save_menu').slideUp('slow')
	})
	$('#arxiv-header').html($('#docmain .arxiv-entry').length + (($('#docmain .arxiv-entry').length == 1) ? ' article' : ' articles'))
})

function arxiv_save_entry(what) {
	console.log(what)
	var message = arxiv_message('save_entry')
	$.post('http://127.0.0.1:8080/', JSON.stringify(message, null, 4), function(data) {
		console.log(data.success)
	}, 'json');
}

function arxiv_to_bibtex(what) {
	var entry = arxiv[what]
	var elems = new Array()
	var keys = ['author', 'title', 'journal', 'pages', 'abstract', 'url', 'timestamp', 'year']
	for(i in keys) {
		elems.push('\t' + keys[i] + ' = {' + entry[keys[i]] + '}')
	}
	return '@article{' + entry['arxiv_id'] + ',\n' + elems.join(',\n') + '\n}'
}

function arxiv_message(command) {
	var message = new Object()
	message.date = Date()
	message.type = 'arxiv'
	message.command = command
	return message
}

function toggle_abstract(which) {
	$('#docmain').children().each( function() {
		$(this).children().each( function () {
			if($(this).hasClass('arxiv-abstract')) {
				$(this).toggle()
			}
		})
	})
}

function shuffle_marked() {
	// Moves those entries to the top that are marked, because one 
	// or more keywords are contained in the content of the paper
	$('#docmain').children().each( function() {
		if($(this).hasClass('arxiv-has-keyword')) {
			$(this).prependTo('#docmain')
		}
	})
}

function parse_feed(url) {
	var bibliography = new Object()
	var counter = 0
	var date = new Date()
	$.get(url, function (data) {
		$(data).find('entry').each(function () { 
			var el = $(this)
			var entry = new Object()
			counter += 1
			entry['title'] = el.find('title').text()
			var _authors = new Array()
			el.find('author').each(function () { 
				_authors.push($(this).text().trim())
			})
			entry['author'] = _authors.join(' and ')
			entry['abstract'] = el.find('summary').text()
			entry['url'] = el.find('id').text()
			entry['journal'] = 'arxiv'
			entry['pages'] = '...'
			var month = (100 + date.getMonth() + 1).toString().slice(1,3)
			var day = (100 + date.getDate()).toString().slice(1,3)
			entry['timestamp'] = date.getFullYear() + '.' + month + '.' + day
			entry['year'] = date.getFullYear()
		})
	})
}
