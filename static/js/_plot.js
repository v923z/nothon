function insert_plot() {
	var id = generate_cell_id()
	insert_new_cell(plot_html_x(id), 'div_plot_caption_' + id)
	// We should insert here any extra text (default plot options)
	$('#textarea_plot_header_' + id).val('')
	var editor = plot_editor('textarea_plot_header_' + id)
	$('#div_plot_main_' + id).data('editor', editor)
	$('#div_plot_main_' + id).data({'sanitise': function(block) { return plot_sanitise(block) }})
	plot_context_menu()
	return false
}

function plot_html_x(count) {
	var $main = $('<div></div>').addClass('main plot_main')
				.attr({'id': 'div_plot_main_' + count, 
					'data-type': 'plot', 
					'data-count': count
				}).data({'sanitise': function(block) { 
						return plot_sanitise(block) 
					}
				})

	$('<div></div>').appendTo($main).addClass('button_expand')
	.attr('id', 'expand_div_plot_main_' + count)
	.click(function(event) { plot_onclick(event) })

	$('<div></div>').appendTo($main).addClass('plot_caption')
	.attr({'id': 'div_plot_caption_' + count, 
		'contenteditable': true,
		'data-type': 'plot',
		'data-save': true,
		'data-toc': true,
		'data-searchable': true, 
		'data-main': 'div_plot_main_' + count,
		'data-count': count
	}).data({'menu': function() { 
				plot_context_menu() 
			}
	})
	.click(function(event) { plot_onclick(event) })
	.focus(function() { set_active('div_plot_caption_' + count) })

	$('<textarea></textarea>').appendTo($main).addClass('plot_header')
	.attr({'id': 'textarea_plot_header_' + count,
	'data-type': 'plot',
	'data-count': count, 
	'data-save': true, 
	'data-searchable': true, 
	'data-main': 'div_plot_main_' + count})
	.focus(function() { set_active('textarea_plot_header_' + count) })
	
	$('<input type="text"/>').appendTo($main).addClass('plot_file')
	.attr({'id': 'input_plot_file_' + count, 
	'data-type': 'plot',
	'data-count': count, 
	'data-save': true,
	'data-main': 'div_plot_main_' + count})
	.keyup(function(event) { code_keypress(event) })

	$('<div></div>').appendTo($main).addClass('plot_body').
	attr({'id': 'div_plot_body_' + count, 
		'data-type': 'plot',
		'data-main': 'div_plot_main_' + count,
		'data-count': count
		})
	.click(function(event) { plot_onclick(event) })
	return $main
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
	$('#div_plot_caption_' + id).html($('#div_plot_caption_' + num).html())
	return false
}

function plot_onclick(count) {
	var target1 = '#textarea_plot_header_' + count
	var target2 =  '#div_plot_body_' + count
	if(collapse_collapsible(target2) == 'visible') {
		active_div = $(target1) //$('#' + target.id.replace('expand_', '').replace('_main_', '_header_'))
		active_div.focus()
	} else {
		active_div = null
	}
}

function plot_caption_keypress(event) {
	if (event.which === 13) {	// Enter
		insert_modified(event.target)
		generate_toc()
		document.getElementById(event.target.id.replace('_plot_caption_', '_plot_header_')).focus()
		return false
	} else {
		return true
	}
}

function plot_sanitise(block) {
	var editor = $('#div_plot_main_' + block.count).data('editor')	
	block.content.plot_caption.content = block.content.plot_caption.content.replace('<br>', '')
	block.content.plot_header.content = editor.getValue()
	return block
}

function plot_up(target) {
    target.style.height = '1px';
    target.style.height = (target.scrollHeight+20) + 'px';
    return false
}

function plot_editor(id) {
	var editor = CodeMirror.fromTextArea(document.getElementById(id), {
			lineNumbers: true,
			mode: {name: "python",
					version: 2
				},
			matchBrackets: true,
			extraKeys: {
				"Ctrl-K" : "toggleComment",
				'Ctrl-Enter' : function(cm) { 
						plot_server(cm)
					},
				'Shift-Enter' : function(cm) { 
						plot_server(cm)
						//insert_plot()
						generate_toc()
					}					
			},
			autoCloseBrackets: "()[]{}"
		})
	return editor
}

function plot_render(json) {
	var count = json.count || generate_cell_id()
	add_new_cell(plot_html_x(count))
	$('#div_plot_caption_' + count).html(check(json.content.plot_caption))
	var editor = plot_editor('textarea_plot_header_' + count)
	editor.setValue(check(json.content.plot_header))
	$('#input_plot_file_' + count).val(check(json.content.plot_file))
	$('#div_plot_body_' + count).html(check(json.content.plot_body))
	$('#div_plot_main_' + count).data({'editor': editor, 
		'sanitise': function(block) { 
			return plot_sanitise(block) 
		}
	})
	add_modified_created('#div_plot_main_' + count, json)

	var message = _create_message('image')
	message.count = count	
	message.image_file = check(json.content.plot_file)
	
	$.post(server_address, JSON.stringify(message, null, 4), function(data) {
		if(data.status === 'success') {
			$('<img>',{
				'src': 'data:image/png;base64,' + data.image_data,
				'alt': data.image_file })
			.appendTo('#div_plot_body_' + count)
			.attr({'id': 'image-' + count})
			.addClass('plot_image')
		} else {
			$('<div>Failed to fetch image file from disc</div>').appendTo('#div_plot_body_' + count)
			.addClass('plot_error')
		}
	}, 'json');
}

function plot_server(cm) {
	var id = cm.getTextArea().id
	var count = $('#' + id).data('count')
	var message = _create_message('plot')
	message.code = cm.getValue()
	message.filename = $('#docmain').data('file') + '_plot_' + count
	insert_modified('#div_plot_body_' + count)
	$.post(server_address, JSON.stringify(message, null, 4), function(data) {
		// There has to be some sort of error checking here!
		$('#div_plot_body_' + count).html(data.body)
		$('#input_plot_file_' + count).val(data.out_file)
		$('#div_plot_body_' + count).scrollTop(100)		// For some reason, this doesn't work...
	}, 'json');
}
