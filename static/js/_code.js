function insert_code() {
	var id = get_max_index('code_main') + 1
	insert_new_cell(code_html_x(id), 'input_code_header_' + id)
	code_context_menu()
	return false
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
		<li onmousedown="return false;" onmouseup="return popout_cell()">Pop out cell</li>\
	</ul>'
	$('#context_menu').html(menu)
}

function code_keypress(event) {
	generate_toc()
	if(event.which === 13) {
		var header = $.trim($(event.target).val())
		if(header.indexOf('--inline') == 0) {
			// This is an in-line request
			var ta = 'textarea_code_body_' + $(event.target).data('count')
			var date = new Date()
			$('#input_code_date_' + $(event.target).data('count'))
			.val('Created: ' + date.toString()).show()
			var editor = $('#' + ta).data('editor')
			if(editor) {
				editor.setValue('')
				editor.setOption('readOnly', false)
			} else {
				var editor = CodeMirror.fromTextArea(document.getElementById(ta), {
					lineNumbers: true,
					mode: {name: guess_language(header)},
					matchBrackets: true,
					extraKeys: {
						"Ctrl-K" : "toggleComment"
					},
					autoCloseBrackets: "()[]{}"
				})
				$('#' + ta).data({'editor': editor})
			}
			set_active('#' + ta)
		} else if (event.shiftKey) {			// Enter
			code_data(event.target)
			insert_code()
		} else {				// Enter
			code_data(event.target)
		}
		return false
	}
	return true
}

function code_data(target) {
	var message = _create_message('code')
	message.content = $(target).val()
	message.count = $(target).data('count')
	message.sub_type = 'notebook'
    xml_http_post(server_address, JSON.stringify(message), code_handler)
}

function code_handler(req) {
	var message = JSON.parse(req.responseText)
	var target = 'textarea_code_body_' + message.count
	var editor = $('#' + target).data('editor')
	if(!editor) {
		editor = CodeMirror.fromTextArea(document.getElementById(target), {
			mode: {name: guess_language(message.content)},
		})
		$('#' + target).data({'editor': editor})
	}
	editor.setValue(message.body)
	editor.setOption('readOnly', true)
	if(message.content.indexOf(' -lineno') > -1) {
		editor.setOption('lineNumbers', true)
	} else {
		editor.setOption('lineNumbers', false)
	}	
	$('#input_code_date_' + message.count).val(message.date).show()
}

function code_sanitise(block) {
	var editor = $('#textarea_code_body_' + block.count).data('editor')
	block.content.code_body.content = editor.getValue()
	return block
}

function code_render(json) {
	add_new_cell(code_html_x(json.count))
	$('#input_code_header_' + json.count).val(json.content.code_header.content)
	if(json.content.code_date.content.length > 0) {
		$('#input_code_date_' + json.count).val(json.content.code_date.content).show()
	}
	var editor = CodeMirror.fromTextArea(document.getElementById('textarea_code_body_' + json.count), {
		lineNumbers: true,
		mode: {name: guess_language(json.content.code_header.content)},
		readOnly: true,
		matchBrackets: true,
		extraKeys: {
			"Ctrl-K" : "toggleComment"
		},
		autoCloseBrackets: "()[]{}"
	})
	editor.setValue(json.content.code_body.content)
	$('#textarea_code_body_' + json.count).data({'editor': editor})
}

function code_html_x(count) {
	var $main = $('<div></div>').addClass('code_main')
	.attr({'id': 'div_code_main_' + count, 
		'data-type': 'code', 
		'data-count': count
	}).data({'sanitise': function(block) { 
			return code_sanitise(block) 
		}
	})
	
	$('<div></div>').appendTo($main).addClass('button_expand').attr('id', 'expand_div_code_main_' + count)

	$('<input type="text"/>').appendTo($main).addClass('code_header')
	.attr({'id': 'input_code_header_' + count, 
	'data-type': 'code',
	'data-toc': 'true', 
	'data-count': count, 
	'data-save': 'true', 
	'data-searchable': 'true'})
	.keyup(function(event) { code_keypress(event) })
		
	$('<input type="text"/>').appendTo($main).addClass('code_date')
	.attr({'id': 'input_code_date_' + count, 
	'data-type': 'code',
	'data-count': count, 
	'data-save': 'true', 
	'readonly': 'readonly'}).hide()

	
	$('<textarea></textarea>').appendTo($main).addClass('code_body')
	.attr({'id': 'textarea_code_body_' + count,
	'data-type': 'code',
	'data-count': count, 
	'data-save': 'true', 
	'data-searchable': 'true', 
	'data-expand': 'expand_div_code_main_' + count, 
	'readonly': 'readonly'}).hide()
	return $main
}

function guess_language(string) {
	var fragments = $.trim(string).split(' ')
	var file_fragments = fragments[0].split('.')
	var ext = file_fragments[file_fragments.length - 1]
	if(ext == 'py') {
		return 'python'
	} else if(ext == 'c' || ext == 'c++' || ext == 'cpp' || ext == 'cs' || ext == 'h' || ext == 'hpp') {
		return 'clike'
	} else if(ext == 'f90') {
		return 'fortran'
	} else if(ext == 'm') {
		return 'matlab'
	} else if(ext == 'js') {
		return 'javascript'
	} else if(ext == 'java') {
		return 'java'
	} else if(ext == 'htm' || ext == 'html') {
		return 'html'
	} else if(ext == 'jl') {
		return 'julia'
	} else if(ext == 'lua') {
		return 'lua'
	}
}
