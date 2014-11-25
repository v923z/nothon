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
	// We have to remove all codemirror and editor instances
	$('#dtemp').html(block.content.section_body.content)
	remove_rendered_math($('#dtemp'))
	strip_images_for_save($('#dtemp'))
	block.content.section_body.content = $('#dtemp').html()
	block.content.section_header.content = block.content.section_header.content.replace('<br>', '')
	$('#dtemp').remove()
	return block
}

function remove_rendered_math(target) {
	$(target).find('.nothon_math').each( function() { $(this).html($(this).attr('alt')) })
	$(target).find('.math_editor').each( function() { 
		$(this).remove()
		//var main = $(this).data('main')
		//console.log($(this).attr('id'))
		//$('#' + main).find('#' + $(this).attr('id')).each( function() {
			////var editor = $(this).attr('data-editor')
			////console.log(editor.getTextArea().id)
		//})
		//$('#' + main + ' #' + $(this).data('formula_id')).attr('alt', editor.getValue().replace(/\\/g, '\\'))
	})
	$(target).find('.CodeMirror').each( function() { $(this).remove() })
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
					$('#textarea_math_editor_' + id).data({'editor': editor})
					editor.setValue($(this).attr('alt'))
				} else {
					//var editor = $('#textarea_math_editor_' + id).data('editor')
					//editor.getWrapperElement().style.display = 'block'
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
						render_math(cm)
						// If we remove the editor, changes won't persist!
						var $ta = $('#' + cm.getTextArea().id)
						cm.toTextArea()
						$ta.remove()
					}
			},
			autoCloseBrackets: "()[]{}"
		})
	editor.on('cursorActivity', function(cm) { cursor_activity(cm) })
	return editor
}

function render_math(cm) {
	var formula_id = $('#' + cm.getTextArea().id).data('formula_id')
	var main = $('#' + cm.getTextArea().id).data('main')
	$('#' + formula_id).attr('alt', cm.getValue().replace(/\\/g, '\\'))
	$('#' + formula_id).html(cm.getValue().replace(/\\/g, '\\'))
	MathJax.Hub.Queue(resetEquationNumbers, 
		//["PreProcess", MathJax.Hub, main],
		["Reprocess", MathJax.Hub, main]);
}

function cursor_activity(cm) {
	var formula_id = $('#' + cm.getTextArea().id).data('formula_id')
	var pos = cm.getCursor()
	var lines = cm.getValue().replace(/\\/g, '\\').split('\n')
	var line = lines[pos.line]
	var char = line[pos.ch]
	// If special character, do not render
	if($.inArray(char, ['{', '}', '^', '_' ]) > -1) return
	var new_line = coloured_latex(line, pos.ch)
	if(!new_line) return
	lines[pos.line] = new_line
	console.log(lines[pos.line])
	$('#' + formula_id).html(lines.join('\n'))
	// We have to do some display swapping here, otherwise, the 
	// display is somewhat jerky
	MathJax.Hub.Queue(resetEquationNumbers, 
		["PreProcess", MathJax.Hub, formula_id],
		["Reprocess", MathJax.Hub, formula_id]);
}

function coloured_latex(line, pos) {
	if(line.indexOf('\\begin{') > -1 || line.indexOf('\\end{') > -1) return null
	var latex_commands = new Array()
	latex_commands = ['\\acute', '\\aleph', '\\alpha', '\\approx', '\\beta']
	for(i in latex_commands) {
		var value = latex_commands[i]
		var start = Math.max(0, pos-value.length)
		var partial_line = line.slice(start)
		var index = partial_line.indexOf(value)
		if(index > -1 && index < value.length) {
			// We have found a match
			var end = start+index+value.length
			var next_char = line[end]
			// These characters would signify the end of a LaTeX command
			if('_^\n\\ \t()[]}'.indexOf(next_char) > -1) {
				return line.slice(0, start+index) + '\\color{red}{' + value + '}' + line.slice(end)
			}
		}
	}
	var indx = pos
	while(indx) {
		indx--
		if(line[indx] == '\\') {
			// This would mean that we have either found an illegal 
			// LaTeX command, something like '\alp', or one that 
			// we don't want to handle (not in the list above), like \frac{}{}
			return null
		}
		if('{}()[]_^ \t'.indexOf(line[indx]) > -1) {
			// We have a completely innocent character here, so we colour it
			return line.slice(0, pos) + '\\color{red}{' + line[pos] + '}' + line.slice(pos+1)
		}
	}
}

//<!DOCTYPE html>
//<html>
//<head>
//<title>Dynamic Preview of Textarea with MathJax Content</title>
//<!-- Copyright (c) 2012-2014 The MathJax Consortium -->
//<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
//<meta http-equiv="X-UA-Compatible" content="IE=edge" />

//<script type="text/x-mathjax-config">
  //MathJax.Hub.Config({
    //showProcessingMessages: false,
    //tex2jax: { inlineMath: [['$','$'],['\\(','\\)']] }
  //});
//</script>
//<script type="text/javascript" src="../MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>

//<script>
//var Preview = {
  //delay: 150,        // delay after keystroke before updating

  //preview: null,     // filled in by Init below
  //buffer: null,      // filled in by Init below

  //timeout: null,     // store setTimout id
  //mjRunning: false,  // true when MathJax is processing
  //oldText: null,     // used to check if an update is needed

  ////
  ////  Get the preview and buffer DIV's
  ////
  //Init: function () {
    //this.preview = document.getElementById("MathPreview");
    //this.buffer = document.getElementById("MathBuffer");
  //},

  ////
  ////  Switch the buffer and preview, and display the right one.
  ////  (We use visibility:hidden rather than display:none since
  ////  the results of running MathJax are more accurate that way.)
  ////
  //SwapBuffers: function () {
    //var buffer = this.preview, preview = this.buffer;
    //this.buffer = buffer; this.preview = preview;
    //buffer.style.visibility = "hidden"; buffer.style.position = "absolute";
    //preview.style.position = ""; preview.style.visibility = "";
  //},

  ////
  ////  This gets called when a key is pressed in the textarea.
  ////  We check if there is already a pending update and clear it if so.
  ////  Then set up an update to occur after a small delay (so if more keys
  ////    are pressed, the update won't occur until after there has been 
  ////    a pause in the typing).
  ////  The callback function is set up below, after the Preview object is set up.
  ////
  //Update: function () {
    //if (this.timeout) {clearTimeout(this.timeout)}
    //this.timeout = setTimeout(this.callback,this.delay);
  //},

  ////
  ////  Creates the preview and runs MathJax on it.
  ////  If MathJax is already trying to render the code, return
  ////  If the text hasn't changed, return
  ////  Otherwise, indicate that MathJax is running, and start the
  ////    typesetting.  After it is done, call PreviewDone.
  ////  
  //CreatePreview: function () {
    //Preview.timeout = null;
    //if (this.mjRunning) return;
    //var text = document.getElementById("MathInput").value;
    //if (text === this.oldtext) return;
    //this.buffer.innerHTML = this.oldtext = text;
    //this.mjRunning = true;
    //MathJax.Hub.Queue(
      //["Typeset",MathJax.Hub,this.buffer],
      //["PreviewDone",this]
    //);
  //},

  ////
  ////  Indicate that MathJax is no longer running,
  ////  and swap the buffers to show the results.
  ////
  //PreviewDone: function () {
    //this.mjRunning = false;
    //this.SwapBuffers();
  //}

//};

////
////  Cache a callback to the CreatePreview action
////
//Preview.callback = MathJax.Callback(["CreatePreview",Preview]);
//Preview.callback.autoReset = true;  // make sure it can run more than once

//</script>
//</head>
//<body>

//Type text in the box below:<br/>

//<textarea id="MathInput" cols="60" rows="10" onkeyup="Preview.Update()" style="margin-top:5px">
//</textarea>
//<br/><br/>
//Preview is shown here:
//<div id="MathPreview" style="border:1px solid; padding: 3px; width:50%; margin-top:5px"></div>
//<div id="MathBuffer" style="border:1px solid; padding: 3px; width:50%; margin-top:5px; 
//visibility:hidden; position:absolute; top:0; left: 0"></div>

//<script>
//Preview.Init();
//</script>

//</body>
//</html>
