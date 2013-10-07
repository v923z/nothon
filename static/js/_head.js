function insert_head() {
	var position = get_insertion_position()
	var id = 1
	if(!position) {
		$('#docmain').prepend(head_html(id))
	} else {
		get_max_index('head_main') + 1
		$('#' + position).after(head_html(id))	
	}
	head_context_menu()
	active_div = activate_element('div_head_header_' + id)
	return false
}

function head_onclick(target) {
	if(collapse_collapsible(target) == 'visible') {
		active_div = $('#' + target.id.replace('expand_', '').replace('_main_', '_body_'))
		active_div.focus()
	} else {
		active_div = null
	}
}

function head_context_menu() {
	var menu = '<div class="context_menu_header">Head</div>\
		<ul class="context_menu_list">\
		<li onmousedown="return false;" onmouseup="return false;">New head cell</li>\
	</ul>'
	$('#context_menu').html(menu)
}

function head_keypress(event) {
	if (event.which === 13 && event.shiftKey) {	// Enter
		head_data(event.target)
		create_and_insert('head_main')
		return false
	}
	else if (event.which === 13) {				// Enter
		head_data(event.target)
		return false
	}
	return true
}

function head_data(div_data) {
	var message = create_message(div_data, "head")
	message.body = 'div_head_body_' + get_num(div_data)
	message.container = 'div_head_container_' + get_num(div_data)
	message.date = 'div_head_date_' + get_num(div_data)
	console.log('here', message.content, message.content.length)
	message.content = message.content.replace('<br>', '')
	console.log(message.content, JSON.stringify(message))
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), message_handler)
}

function head_sanitise(block) {
	block.content.head_header.content = block.content.head_header.content.replace('<br>', '')
	return block
}
