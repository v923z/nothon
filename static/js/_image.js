function fetch_image(id) {
	var filename = $('#image_path_' + id).val()
	var pieces = filename.toLowerCase().split('.')
	var ext = pieces[pieces.length-1]
	if(['.png', '.jpg', '.jpeg', '.tif', '.tiff', '.bmp', '.svg'].indexOf('.' + ext) < 0) {
		alert('Not an image file!')
	}
	else {
		image_data(document.getElementById('image_' + id), filename)
		$('#image_control_' + id).hide()
	}
	return false
}

function insert_image() {
	var id = Math.floor(Math.random()*1000000)
	document.execCommand('insertHTML', false, image_html(id))
	$('.image_button').click( function() {
			var id = $(this).attr('id').replace('image_button_', '')
			$('#image_control_' + id).show()
			$('#image_path_' + id).focus()
	});
	$('.image_image').hover( function() {
		var id = $(this).attr('id').replace('image_', 'image_info_')
		$('#' + id).show()
	}, function() {
		var id = $(this).attr('id').replace('image_', 'image_info_')
		$('#' + id).hide()
	});
	$('.image_path').keypress(function (e) {
		if (e.which == 13) {
			fetch_image($(this).attr('id').replace('image_path_', ''))
			return false;
		}
	});
	$('#image_path_' + id).focus()
	return false
}

function image_data(div_data, filename) {
	var message = create_message(div_data, "image")
	message.filename = filename
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), image_handler)
}

function image_handler(message) {
	message_handler(message)
}
