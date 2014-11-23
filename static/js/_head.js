function insert_head() {
	var id = generate_cell_id()
	head_context_menu()
	insert_new_cell(head_html_x(id), 'div_head_header_' + id)
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
		insert_modified(event.target)
		insert_head()
		return false
	}
	else if (event.which === 13) {				// Enter
		insert_modified(event.target)
		head_data(event.target)
		return false
	}
	generate_toc()
	return true
}

function head_data(target) {
	var message = _create_message('head')
	message.content = $(target).val()
	message.count = $(target).data('count')
	message.sub_type = 'notebook'
    xml_http_post(server_address, JSON.stringify(message), head_handler)
}

function head_handler(req) {
	var message = JSON.parse(req.responseText)
	$('#input_head_date_' + message.count).val(message.date)
	if(message.body.length > 0) {
		$('#textarea_head_body_' + message.count).val(message.body)
		$('#textarea_head_body_' + message.count).show()
	} else {
		$('#textarea_head_body_' + message.count).hide()
		$('#input_head_date_' + message.count).show()
	}
}

function head_sanitise(block) {
	return block
}


function head_render(json) {
	var count = json.count || generate_cell_id()
	add_new_cell(head_html_x(count))
	$('#input_head_header_' + count).val(check(json.content.head_header))
	$('#input_head_date_' + count).html(check(json.content.head_date))
	$('#textarea_head_body_' + count).val(check(json.content.head_body))
	add_modified_created('#div_head_main_' + count, json)
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
	.focus(function() { set_active('input_head_header_' + count) })

	//$('<input type="text"/>').appendTo($main).addClass('head_date')
	//.attr({'id': 'input_head_date_' + count, 
		//'data-type': 'head'
		//'data-save': true,
		//'data-count': count})
		
	$('<textarea></textarea>').appendTo($main).addClass('head_body')
	.attr({'id': 'textarea_head_body_' + count,
	'data-type': 'head',
	'data-count': count, 
	'data-save': true, 
	'data-searchable': true, 
	'data-main': 'div_head_main_' + count})	
	return $main
}
