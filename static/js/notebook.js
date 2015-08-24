$(document).ready(function () {

	// We do the rendering here
	var notebook = full_notebook['notebook']
	$('#div_title').html(full_notebook._metadata.title)
	for(i in notebook) {
		eval(notebook[i].type + '_render(notebook[i])')
	}
	

	// TODO: this has to be done in the loop above.
	//$(function() {
		//$("div").each( function() {
			//var props = $(this).data('props')
			//if(check_tag(props, 'collapsed')) {
				//$(this).hide()
				//set_collapse('#' + $(this).data('main'))
			//}
			//if(check_tag(props, 'locked')) $(this).attr('contenteditable', false)
		//});
	//});
	
})
