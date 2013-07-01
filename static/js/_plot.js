function plot_activate(id) {
	active_div = document.getElementById('div_plot_header_' + id)
	active_div.focus()
	plot_context_menu()
}

function plot_context_menu() {
	var menu = '<div class="context_menu_header">Plot</div>\
		<ul class="context_menu_list">\
		<li onmousedown="return false;" onmouseup="return false;">New plot cell</li>\
	</ul>'
	$('#context_menu').html(menu)
}

function plot_onclick(target) {
	if(collapse_collapsible(target) == 'visible') {
		active_div = $('#' + target.id.replace('expand_', '').replace('_main_', '_header_'))
		active_div.focus()
	} else {
		active_div = null
	}
}

function plot_keypress(event) {
	if (event.which === 13 && event.ctrlKey) {			// Enter
		plot_data(event.target)
		return false
	}
	else if (event.which === 13 && event.shiftKey) {	// Enter
		plot_data(event.target)
		create_and_insert('plot_main')
		return false
	}
	return true
}

function plot_data(div_data) {
	var message = create_message(div_data, "plot")
	message.title = 'div_plot_file_' + get_num(div_data)
	message.filename = document.title + '_plot_' + get_num(div_data)
	message.body = 'div_plot_body_' + get_num(div_data)
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), message_handler)
}

function plot_sanitise(block) {
	block.content.plot_caption.content = block.content.plot_caption.content.replace('<br>', '')
	block.content.plot_header.content = $.trim(block.content.plot_header.content)
	return block
}
