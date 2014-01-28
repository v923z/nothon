$(document).ready(function () {
	$('.arxiv-save-button').hover( function() {
		arxiv_save_entry($(this).data('target'))
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
