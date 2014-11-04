function insert_head() {
	var id = get_max_index('head_main') + 1
	head_context_menu()
	insert_new_cell(head_html(id), 'div_head_header_' + id)
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
		<li onmousedown="return false;" onmouseup="return popout_cell()">Pop out cell</li>\
	</ul>'
	$('#context_menu').html(menu)
}

function head_keypress(event) {
	if (event.which === 13 && event.shiftKey) {	// Enter
		head_data(event.target)
		insert_head()
		return false
	}
	else if (event.which === 13) {				// Enter
		head_data(event.target)
		return false
	}
	generate_toc()
	return true
}

function head_data(div_data) {
	var message = create_message(div_data, "head")
	message.body = 'div_head_body_' + get_num(div_data)
	message.container = 'div_head_container_' + get_num(div_data)
	message.date = 'div_head_date_' + get_num(div_data)
	message.sub_type = 'notebook'
	message.content = message.content.replace('<br>', '')
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), message_handler)
}

function head_sanitise(block) {
	return block
}


function head_render(json) {
	add_new_cell(head_html(json.count))
	$('#div_head_header_' + json.count).html(json.content.head_header.content)
	$('#div_head_date_' + json.count).html(json.content.head_date.content)
	$('#div_head_body_' + json.count).html(json.content.head_body.content)
}

function head_html_x(count) {
	var $main = $('<div></div>').addClass('head_main')
				.attr({'id': 'div_head_main_' + count, 
					'data-type': 'head', 
					'data-count': count
				}).data({'sanitise': function(block) { 
						return head_sanitise(block) 
					}
				})

	$('<div></div>').appendTo($main).addClass('button_expand').
	attr('id', 'expand_div_head_main_' + count)
	.click(function(event) { head_onclick(event) })

	$('<input type="text"/>').appendTo($main).addClass('head_header')
	.attr({'id': 'input_head_header_' + count, 
	'data-type': 'head',
	'data-count': count, 
	'data-save': true,
	'data-main': 'div_head_main_' + count})
	.keyup(function(event) { head_keypress(event) })

	$('<textarea></textarea>').appendTo($main).addClass('head_body')
	.attr({'id': 'textarea_head_body_' + count,
	'data-type': 'head',
	'data-count': count, 
	'data-save': true, 
	'data-searchable': true, 
	'data-main': 'div_head_main_' + count})	
	return $main
}
