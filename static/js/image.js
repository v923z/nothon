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
	var im_html = '<br><div class="section_image">\
	<div class="image_info" id="image_info_' + id + '">Image info:</div>\
	<div id="image_control_' + id + '">\
	<button onmouseup="fetch_image(' + id + ');">Button</button>\
	<input id="image_path_' + id + '" type="text"></input>\
	</div>\
	<div class="image_image" id="image_' + id + '" onmouseover="image_mouseover(' + id + ');" onmouseout="image_mouseout(' + id + ');"> </div>\
	<div class="image_caption">Caption</div>\
	</div><br>'
	console.log(im_html)
	document.execCommand('insertHTML', false, im_html)
	// TODO: move cursor to input field
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

function image_mouseover(id) {
	console.log('mouse')
	$('#image_info_' + id).show()
}

function image_mouseout(id) {
	console.log('mouse')
	$('#image_info_' + id).hide()
}
