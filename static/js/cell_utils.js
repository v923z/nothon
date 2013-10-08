$(document).ready(function () {
	$(':checkbox').prop('checked', false)
	$(':checkbox').change( function(e) {
		if($(this).prop('checked')) {
			$(this).next().addClass('toc_copy')
		}
		else {
			$(this).next().removeClass('toc_copy')
		}
	})
	$('.toc_paste_button').mouseup( function(e) {
		// TODO: bail out immediately, if we are trying to paste to the same notebook!
		// However, this can be a bit more involved, for we can still copy from other notebooks.
		var message = new Object()
		message.command = 'paste_cell'
		message.target = $(this).prev().attr('href').replace('?name=', '')
		message.id = $(this).closest('li').attr('id')
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
	})
	$('.toc_undo_button').mouseup( function(e) {
		var message = new Object()
		message.command = 'remove_cell'
		message.target = $(this).prev().prev().attr('href').replace('?name=', '')
		var addresses = new Array()
		var counter = 0
		$(this).parent().find('.toc_pasted').each( function() {
			console.log($(this).html())
			addresses[counter] = $(this).attr('href').replace('?name=', '')
			$(this).closest('p').remove()
			counter++
		})
		message.addresses = addresses
		undo_data(message)
	})
})

function paste_data(message) {
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), paste_handler)
}

function paste_handler(req) {
	var message = JSON.parse(req.responseText)
	var links = message['links']
	var id = message['id']
	for(i=0; i < links.length; i++) {
		$('#' + id).find('.toc_entry').prepend("<p><input type='checkbox'/><a href='?name=" + message['target'] + '#' + links[i][1] + "' class='toc_link toc_pasted'>" + links[i][0] + "</a>")
	}
}

function undo_data(message) {
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), undo_handler)
}

function undo_handler(req) {
}
