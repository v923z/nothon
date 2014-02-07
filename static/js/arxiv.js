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
