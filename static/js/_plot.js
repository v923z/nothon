function insert_plot() {
	var id = get_max_index('plot_main') + 1
	insert_new_cell(plot_html(id), 'div_plot_header_' + id)
	plot_context_menu()
	return false
}

function plot_context_menu() {
	var menu = '<div class="context_menu_header">Plot</div>\
		<ul class="context_menu_list">\
		<li alt="lock" onmouseup="return lock_cell(active_div);">Lock cell</li>\
		<li onmousedown="return false;" onmouseup="return copy_plot_cell();">Copy cell</li>\
		<li onmousedown="return false;" onmouseup="return insert_plot()">New plot cell</li>\
	</ul>'
	$('#context_menu').html(menu)
}

function copy_plot_cell() {
	if(!active_div) return
	var num = get_index($(active_div).data('main'))
	var id = get_max_index('plot_main') + 1
	insert_plot()
	$('#div_plot_header_' + id).html($('#div_plot_header_' + num).html())
	$('#div_plot_caption_' + id).html($('#div_plot_caption_' + num).html())
	return false
}

function plot_onclick(target) {
	if(collapse_collapsible(target) == 'visible') {
		active_div = $('#' + target.id.replace('expand_', '').replace('_main_', '_header_'))
		active_div.focus()
	} else {
		active_div = null
	}
}

function plot_header_keypress(event) {
	if(event.keyCode == 38) {			// Up arrow
		if($(event.target).getCursorPosition() == 0) {
			active_div = document.getElementById(event.target.id.replace('_plot_header_', '_plot_caption_'))
			active_div.focus()
			return false
		} else {
			return true
		}
	}
	if (event.which === 13 && event.ctrlKey) {			// Enter
		plot_data(event.target)
		return false
	} else if (event.which === 13 && event.shiftKey) {	// Enter
		plot_data(event.target)
		insert_plot()
		generate_toc()
		return false
	} else if(event.which === 47 && event.ctrlKey) { // '/'
		toggle_comment(event.target)
		return false
	}
	return true
}

function plot_caption_keypress(event) {
	if (event.which === 13) {	// Enter
		generate_toc()
		active_div = document.getElementById(event.target.id.replace('_plot_caption_', '_plot_header_'))
		active_div.focus()
		return false
	} else {
		return true
	}
}

function plot_data(div_data) {
	var message = _create_message('plot')
	message.content = $('#div_plot_header_'+get_num(div_data)).val()
	message.title = 'div_plot_file_' + get_num(div_data)
	message.filename = $('#docmain').data('file') + '_plot_' + get_num(div_data)
	message.body = 'div_plot_body_' + get_num(div_data)
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), message_handler)
}

function plot_sanitise(block) {
	block.content.plot_caption.content = block.content.plot_caption.content.replace('<br>', '')
	return block
}

function plot_up(target) {
    target.style.height = '1px';
    target.style.height = (target.scrollHeight+20) + 'px';
    return false
}

function toggle_comment(target) {
	var caret = $(target).getCursorPosition()
	var text = $(target).val()
	while(text[caret] == '\n') caret--;
	
	for(start=caret; start >= 0; start--) {
		if(text[start] == '\n') {
			start++
			break
		}
	}
	if(text[start] !== '#') {
		$(target).val(text.substring(0, start) + '#' + text.substring(start, text.length))
	} else {
		$(target).val(text.substring(0, start) + text.substring(start+1, text.length))
	}
}

jQuery.fn.getCursorPosition = function() {
    if(this.length == 0) return -1;
    return $(this).getSelectionStart();
}

jQuery.fn.getSelectionStart = function() {
    if(this.length == 0) return -1;
    input = this[0];

    var pos = input.value.length;

    if (input.createTextRange) {
        var r = document.selection.createRange().duplicate();
        r.moveEnd('character', input.value.length);
        if (r.text == '') 
        pos = input.value.length;
        pos = input.value.lastIndexOf(r.text);
    } else if(typeof(input.selectionStart)!="undefined")
    pos = input.selectionStart;

    return pos;
}
