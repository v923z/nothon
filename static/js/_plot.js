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
		<li onmousedown="return false;" onmouseup="return popout_cell()">Pop out cell</li>\
	</ul>'
	$('#context_menu').html(menu)
}

function copy_plot_cell() {
	if(!active_div) return
	var num = get_index($(active_div).data('main'))
	var id = get_max_index('plot_main') + 1
	insert_plot()
	$('#div_plot_header_' + id).val($('#div_plot_header_' + num).val())
	$('#div_plot_header_' + id).height($('#div_plot_header_' + num).height()+20)
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

function plot_data(target) {
	var count = $(target).data('count')
	var message = _create_message('plot')
	message.code = $(target).val()
	message.filename = $('#docmain').data('file') + '_plot_' + count

	$.post('http://127.0.0.1:8080/', JSON.stringify(message, null, 4), function(data) {
		$('#div_plot_body_' + count).html(data.body)
		$('#div_plot_file_' + count).html(data.out_file)
		$('#div_plot_body_' + count).scrollTop(100)		// For some reason, this doesn't work...
	}, 'json');
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

function plot_render(json) {
	add_new_cell(plot_html(json.count))
	$('#div_plot_caption_' + json.count).html(json.content.plot_caption.content)
	$('#div_plot_caption_' + json.count).html(json.content.plot_header.content)
	$('#div_plot_file_' + json.count).html(json.content.plot_file.content)
	$('#div_plot_body_' + json.count).html(json.content.plot_body.content)
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
