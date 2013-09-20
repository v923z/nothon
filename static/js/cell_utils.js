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
		var addresses = new Array()
		var counter = 0
		console.log($(this).prev().attr('href'))
		$('input:checked').each( function() {
			$(this).next().removeClass('toc_copy')
			$(this).prop('checked', false)
			console.log($(this).next().attr('href'))
			addresses[counter] = $(this).next().attr('href').replace('?name=', '')
			counter++
		})
		message.addresses = addresses
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
}
