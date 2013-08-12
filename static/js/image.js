var _cleanup = null

$(function() {
	$('#image_dialog').dialog({
		dialogClass: 'no-close ui-dialog',
		autoOpen: 	false,
		height:		100,
		width:		400,
		modal:		true,
		title:		'Image file',
		draggable:	true,
		hide:		'fade',
		close:		function(event, ui) { image_clean_up(_cleanup) },
		buttons:	{
			'Insert' : function(){ return insert_image() },
			'Cancel' : function(){ $(this).dialog('close') }
		}
	});
});

function open_image_dialog() {
	focused = document.activeElement
	$('#image_dialog').dialog('open')
	$('#image_path').val('')
}

function get_image(event) {
	if(event.which === 13) {
		var filename = $('#image_path').val()
		var pieces = filename.toLowerCase().split('.')
		var ext = pieces[pieces.length-1]
		console.log(ext)
		if(['.png', '.jpg', '.jpeg', '.tif', '.tiff', '.bmp'].indexOf('.' + ext) < 0) {
			alert('Not an image file!')
		}
		else {
			fetch_image(filename)
			_cleanup = null
		}
		$('#image_dialog').dialog('close')
		return false
	}
	return true
}

function image_clean_up() {
	if(_cleanup) {
		$(_cleanup).remove()
	}
}

function fetch_image(filename) {
	var message = create_message(target, "image")
	message.filename = filename
	message.target = _cleanup
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), image_handler)
}

function image_handler(message) {
	message_handler(message)
	focused.focus()
	goto_marker('_marker_')
}

function insert_image() {
	var id = Math.floor(Math.random()*1000000)
	var im_html = '<br><div class="section_image" id="image_' + id + '"></div><br><span id="_marker_"></span>'
	document.execCommand('insertHTML', false, im_html)
	_cleanup = 'image_' + id
	return false
}
