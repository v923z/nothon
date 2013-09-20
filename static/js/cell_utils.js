$(document).ready(function () {
	$(':checkbox').prop('checked', false)
	$(':checkbox').change( function(e) {
		if($(this).prop('checked')) {
			$(this).next().addClass('toc_copy')
		}
		else {
			$(this).next().removeClass('toc_copy')
		}
		console.log($(this).next().attr('href'))
	})
	$('.toc_paste_button').mouseup( function(e) {
		// TODO: bail out immediately, if we are trying to paste to the same notebook!
		// However, this can be a bit more involved, for we can still copy from other notebooks.
		var message = new Object()
		message.command = 'paste_cell'
		message.target = $(this).prev().attr('href').replace('?name=', '')
		message.id = $(this).closest('li').attr('id')
		console.log($(this).closest('li').attr('id'))
		var addresses = new Array()
		var labels = new Array()
		var counter = 0
		$('input:checked').each( function() {
			$(this).next().removeClass('toc_copy')
			$(this).prop('checked', false)
			addresses[counter] = $(this).next().attr('href').replace('?name=', '')
			labels[counter] = $(this).next().text()
			counter++
		})
		message.addresses = addresses
		message.labels = labels
		paste_data(message)
		console.log(message)
	})
})

function paste_data(message) {
	console.log('pasted')
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), paste_handler)
}

function paste_handler(req) {
	var message = JSON.parse(req.responseText)
	var links = message['links']
	var id = message['id']
	console.log(id)
	for(i=0; i < links.length; i++) {
		console.log("<p><input type='checkbox'/><a href='?name=" + message['target'] + '#' + links[i][1] + " class='toc_pasted'>")
		$('#' + id).find('.toc_entry').prepend("<p><input type='checkbox'/><a href='?name=" + message['target'] + '#' + links[i][1] + "' class='toc_link toc_pasted'>" + links[i][0] + "</a>")
		console.log('?name=' + message['target'] + '#' + links[i][1])
	}
}
