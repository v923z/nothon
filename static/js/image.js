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
		buttons:	{
			'Insert' : function(){},
			'Cancel' : function(){ $(this).dialog('close')}
		}
	});
});

function open_image_dialog() {
	$('#image_dialog').dialog('open')
	$('#image_path').val('')
}

function get_image(event) {
	if(event.which === 13) {
		var filename = $('#image_path').val()
		var pieces = filename.toLowerCase().split('.')
		var ext = pieces[pieces.length-1]
		console.log(ext)
		$('#image_dialog').dialog('close')
		if(['.png', '.jpg', '.jpeg', '.tif', '.tiff', '.bmp'].indexOf('.' + ext) < 0) {
			alert('Not an image file!')
		}
		else {
		}
		return false
	}
	return true
}
