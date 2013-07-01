function code_activate(id) {
	active_div = document.getElementById('div_code_header_' + id)
	active_div.focus()
	code_context_menu()
}

function code_onclick(target) {
	if(collapse_collapsible(target) == 'visible') {
		active_div = $('#' + target.id.replace('expand_', '').replace('_main_', '_body_'))
		active_div.focus()
	} else {
		active_div = null
	}
}

function code_context_menu() {
	var menu = '<div class="context_menu_header">Code</div>\
		<ul class="context_menu_list">\
		<li onmousedown="return false;" onmouseup="return false;">New code cell</li>\
	</ul>'
	$('#context_menu').html(menu)
}

function code_keypress(event) {
	if (event.which === 13 && event.shiftKey) {	// Enter
		code_data(event.target)
		create_and_insert('code_main')
		return false
	}
	else if (event.which === 13) {				// Enter
		code_data(event.target)
		return false
	}
	return true
}

function code_data(div_data) {
	var message = create_message(div_data, "code")
	message.body = 'div_code_body_' + get_num(div_data)
	message.date = 'div_code_date_' + get_num(div_data)
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), message_handler)
}

function code_sanitise(block) {
	block.content.code_header.content = block.content.code_header.content.replace('<br>', '')
	$('<div id="temp_div"/>').appendTo("#docmain").hide().html(block.content.code_body.content)
	block.content.code_body.content = $('#temp_div').find('.highlight').text()
	$("#temp_div").remove()	
	return block
}
