function insert_section() {
	var id = generate_cell_id()
	insert_new_cell(section_html(id), null)
	var editor = section_editor('textarea_section_' + id)
	$('#div_section_main_' + id).data('editor', editor)
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
	// We have to remove all codemirror and editor instances
	$('#dtemp').html(block.content.section_body.content)
	remove_rendered_math($('#dtemp'))
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
	
	$('<textarea></textarea>').appendTo($main).addClass('section')
	.attr({'id': 'textarea_section_' + count,
		'data-main': 'div_section_main_' + count, 
		'data-body': 'div_section_body_' + count,})
	
	$('<div></div>').appendTo($main).addClass('section_body')
	.attr({'id': 'div_section_body_' + count, 
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
	.click(function() { 
		var editor = $('#div_section_main_' + count).data('editor')
		$(editor.getWrapperElement()).show()
		editor.setValue($('#textarea_section_' + count).data('raw'))
		$('#div_section_body_' + count).hide()
		editor.focus()
	})
	return $main
}

function section_render(json) {
	add_new_cell(section_html(json.count))
	$('#div_section_main_' + json.count).data('raw', json.content.section_header.content + json.content.section_body.content)
	var editor = section_editor('textarea_section_' + json.count)
	$('#textarea_section_' + json.count).data('raw', json.content.section_header.content + json.content.section_body.content)
	$('#div_section_main_' + json.count).data('editor', editor)
	$(editor.getWrapperElement()).hide()
	$('#div_section_body_' + json.count).html(md.render(json.content.section_header.content + json.content.section_body.content))
}

function section_editor(id) {
	var editor = CodeMirror.fromTextArea(document.getElementById(id), {
			mode: {name: "stex"	},
			matchBrackets: true,
			extraKeys: {
				'Ctrl-K' : "toggleComment",
				'Ctrl-M' : function(cm) {
					// Insert math equation here $..$
					insert_math('inline', cm)
					},
				'Ctrl-Alt-M' : function(cm) {
					// Insert math equation here \begin{equation}...\end{equation}
					insert_math('display', cm)
					},					
				'Ctrl-Enter' : function(cm) { 
					// render the stuff here
					render_content(cm)
					},
				'Shift-Enter' : function(cm) { 
					// render stuff, and insert new cell
					}					
			},
			autoCloseBrackets: "()[]{}"
		})
	return editor
}

function render_content(cm) {
	var text = cm.getValue()
	var id = cm.getTextArea().id
	var body_id = $('#' + id).data('body')
	var math = document.getElementById(body_id)
	$(cm.getWrapperElement()).hide()
	$('#' + id).data('raw', text)
	$('#' + body_id).html(md.render(text))
	$('#' + body_id).show()

	MathJax.Hub.Queue(resetEquationNumbers, 
	["PreProcess", MathJax.Hub, math],
	["Reprocess", MathJax.Hub, math]);
}

function insert_math(mode, cm) {
	var id = cm.getTextArea().id
	var value = cm.getValue()

	if(mode === 'inline') {
		cm.replaceSelection('\\\\(\\\\)', 'start')
		cm.execCommand('goCharRight')
		cm.execCommand('goCharRight')
		cm.execCommand('goCharRight')
	} else if(mode === 'display') {
		cm.replaceSelection('\n\\begin{equation}\n\n\\end{equation}', 'start')
		cm.execCommand('goLineDown')
		cm.execCommand('goLineDown')
	}
}
