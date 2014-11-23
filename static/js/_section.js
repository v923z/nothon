function insert_section() {
	var id = generate_cell_id()
	insert_new_cell(section_html(id), 'div_section_header_' + id)
	section_context_menu()
	return false
}


function section_context_menu() {
	var menu = '<div class="context_menu_header">Section</div>\
		<ul class="context_menu_list">\
		<li alt="insertUnorderedList" onmouseup="return mouse_down(this, null);" onmousedown="return false;">Unordered list</li>\
		<li alt="insertOrderedList" onmouseup="return mouse_down(this, null);" onmousedown="return false;">Ordered list</li>\
		<li alt="link" onmouseup="return create_link();" onmousedown="return false;">Link</li>\
		<li alt="math" onmouseup="return edit_math();" onmousedown="return false;">Math</li>\
		<li alt="bold" onmouseup="return mouse_down(this, null);" onmousedown="return false;"><b>Bold</b></li>\
		<li alt="italic" onmouseup="return mouse_down(this, null);" onmousedown="return false;"><i>Italic</i></li>\
		<li alt="underline" onmouseup="return mouse_down(this, null);" onmousedown="return false;"><u>Underline</u></li>\
		<li alt="strikeThrough" onmouseup="return mouse_down(this, null);" onmousedown="return false;">Strikethrough</li>\
		<li alt="hilitecolor" onmouseup="return highlight();" onmousedown="return false;">Highlight</li>\
		<li alt="indent" onmouseup="return mouse_down(this, null);" onmousedown="return false;">Indent</li>\
		<li alt="outdent" onmouseup="return mouse_down(this, null);" onmousedown="return false;">Outdent</li>\
		<li onmouseup="return insert_date();" onmousedown="return false;">Date</li>\
		<li onmouseup="return insert_image();" onmousedown="return false;">Image</li>\
		<li onmouseup="return insert_note();" onmousedown="return false;">Note</li>\
		<li alt="insertHorizontalRule" onmouseup="return mouse_down(this, null);" onmousedown="return false;">Line</li>\
		<hr>\
		<li alt="raw" onmouseup="strip_mathjax(active_div); return false;">Raw content</li>\
		<li alt="lock" onmouseup="return lock_cell(active_div);">Lock cell</li>\
		<li alt="new" onmousedown="return false;" onmouseup="return insert_text();">New text cell</li>\
		<li alt="copy" onmousedown="return false;" onmouseup="return copy_text_cell();">Copy cell</li>\
		<li onmousedown="return false;" onmouseup="return popout_cell()">Pop out cell</li>\
	</ul>'
	$('#context_menu').html(menu)
}


function section_onclick(target) {
}

function section_sanitise(block) {
	var dtemp = $('<div/>', {'id': 'dtemp'}).appendTo('#trash')
	console.log(block)
	$('#dtemp').html(block.content.section_body.content)
	strip_mathjax_for_save($('#dtemp'))
	strip_images_for_save($('#dtemp'))
	block.content.section_body.content = $('#dtemp').html()
	block.content.section_header.content = block.content.section_header.content.replace('<br>', '')
	$('#dtemp').remove()
	return block
}

function section_html(count) {
	var $main = $('<div></div>').addClass('main section_main')
			.attr({'id': 'div_section_main_' + count, 
				'data-type': 'section', 
				'data-count': count
			}).data({'sanitise': function(block) { 
					return section_sanitise(block) 
				}
			})
	$('<div></div>').appendTo($main).addClass('button_expand')
	.attr('id', 'expand_div_section_main_' + count)
	.click(function(event) { section_onclick(event) })
	
	$('<div></div>').appendTo($main).addClass('section_header')
	.attr({'id': 'div_section_header_' + count, 
		'contenteditable': true,
		'data-type': 'section',
		'data-save': true,
		'data-toc': true,
		'data-searchable': true, 
		'data-main': 'div_section_main_' + count,
		'data-count': count
	}).data({'menu': function() { 
				section_context_menu() 
			}
	})
	.click(function(event) { section_onclick(event) })
	.focus(function() { set_active('div_section_header_' + count) })
	
	$('<div></div>').appendTo($main).addClass('section_body')
	.attr({'id': 'div_section_body_' + count, 
		'contenteditable': true,
		'data-type': 'section',
		'data-save': true,
		'data-toc': true,
		'data-searchable': true, 
		'data-main': 'div_section_main_' + count,
		'data-count': count
	}).data({'menu': function() { 
				section_context_menu() 
			}
	})
	.click(function(event) { section_onclick(event) })
	.focus(function() { set_active('div_section_body_' + count) })

	return $main
}

function section_render(json) {
	add_new_cell(section_html(json.count))
	$('#div_section_header_' + json.count).html(json.content.section_header.content)
	$('#div_section_body_' + json.count).html(json.content.section_body.content)
}

function edit_math() {
	var $target = get_active_cell()
	$target.find('.nothon_math').each( function() {
		if($(this).is('span')) {
			// Do nothing here
		} else if($(this).is('div')) {
			var id = $(this).attr('id') || 'math_' + generate_cell_id()
			$(this).attr('id', id)
			if($(this).attr('alt') !== '') {
				if($('#textarea_math_editor_' + id).length == 0) {
					$(this).after(math_editor_html(id))
					var editor = math_editor('textarea_math_editor_' + id)
					$('#textarea_math_editor_' + id).attr({'data-editor': editor})
					editor.setValue($(this).attr('alt'))
				} else {
					var editor = $('#textarea_math_editor_' + id).data('editor')
					editor.getWrapperElement().style.display = 'block'
					// TODO: Move the cursor to the editor
				}
			}
		}
	})
	return false
}

function math_editor_html(id) {
	var $edit = $('<textarea></textarea>').addClass('math_editor')
	.attr({'id': 'textarea_math_editor_' + id,
		'data-formula_id': id,
		'data-type': 'math-edit',
		'data-count': id, 
		'data-save': false, 
		'data-searchable': false,
		'data-main': get_active_main().attr('id')})
	.focus(function(){})
	
	return $edit
}

function math_editor(id) {
	var editor = CodeMirror.fromTextArea(document.getElementById(id), {
			lineNumbers: false,
			mode: 'stex',
			matchBrackets: true,
			extraKeys: {
				"Ctrl-K" : "toggleComment",
				'Ctrl-Enter' : function(cm) { 
						render_math(cm)
					},
				'Shift-Enter' : function(cm) { 
					// This should close the editor
						render_math(cm)
						cm.getWrapperElement().style.display = 'none'
					}
			},
			autoCloseBrackets: "()[]{}"
		})
	return editor
}

function render_math(cm) {
	var formula_id = $('#' + cm.getTextArea().id).data('formula_id')
	var main = $('#' + cm.getTextArea().id).data('main')
	$('#' + formula_id).attr('alt', cm.getValue().replace(/\\/g, '\\'))
	$('#' + formula_id).html(cm.getValue().replace(/\\/g, '\\'))
	MathJax.Hub.Queue(resetEquationNumbers, 
		["PreProcess", MathJax.Hub, main],
		["Reprocess", MathJax.Hub, main]);
}
