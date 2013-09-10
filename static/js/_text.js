function text_activate(id) {
	active_div = document.getElementById('div_text_header_' + id)
	active_div.focus()
	text_context_menu()
}

function text_context_menu() {
	var menu = '<div class="context_menu_header">Text</div>\
		<ul class="context_menu_list">\
		<li alt="insertUnorderedList" onmouseup="return mouse_down(this, null);" onmousedown="return false;">Unordered list</li>\
		<li alt="insertOrderedList" onmouseup="return mouse_down(this, null);" onmousedown="return false;">Ordered list</li>\
		<li alt="link" onmouseup="return create_link();" onmousedown="return false;">Link</li>\
		<li alt="bold" onmouseup="return mouse_down(this, null);" onmousedown="return false;"><b>Bold</b></li>\
		<li alt="italic" onmouseup="return mouse_down(this, null);" onmousedown="return false;"><i>Italic</i></li>\
		<li alt="underline" onmouseup="return mouse_down(this, null);" onmousedown="return false;"><u>Underline</u></li>\
		<li alt="strikeThrough" onmouseup="return mouse_down(this, null);" onmousedown="return false;">Strikethrough</li>\
		<li alt="hilitecolor" onmouseup="return highlight();" onmousedowb="return false;">Highlight</li>\
		<li alt="indent" onmouseup="return mouse_down(this, null);" onmousedown="return false;">Indent</li>\
		<li alt="outdent" onmouseup="return mouse_down(this, null);" onmousedown="return false;">Outdent</li>\
		<li onmouseup="return insert_date();" onmousedown="return false;">Date</li>\
		<li onmouseup="return insert_image();" onmousedown="return false;">Image</li>\
		<li onmouseup="return insert_note();" onmousedown="return false;">Note</li>\
		<li alt="insertHorizontalRule" onmouseup="return mouse_down(this, null);" onmousedown="return false;">Line</li>\
		<hr>\
		<li alt="raw" onmouseup="strip_mathjax(active_div); return false;">Raw content</li>\
		<li alt="lock" onmouseup="return lock_cell(active_div);">Lock cell</li>\
		<li alt="new" onmousedown="return false;" onmouseup="create_and_insert(\'text_main\');">New text cell</li>\
		<li alt="copy" onmousedown="return false;" onmouseup="return copy_text_cell();">Copy cell</li>\
	</ul>'
	$('#context_menu').html(menu)
}

function copy_text_cell() {
	var text_main = $(active_div).closest('div[id^="div_text_main_"]')
	var num = get_max_index('text_main') + 1
	var new_div = document.createElement("div")
	new_div.innerHTML = text_html(num)
	$(new_div).children('*').eq(0).children('.text_header').eq(0).html($(text_main).children('.text_header').eq(0).html())
	$(new_div).children('*').eq(0).children('.text_body').eq(0).html($(text_main).children('.text_body').eq(0).html())
	$(new_div).children('*').eq(0).insertAfter(text_main)
	return false
}

function highlight() {
	document.execCommand("hilitecolor", false, "#ffff00")
	return false
}

function insert_date() {
	var date = new Date()
	document.execCommand('insertText', false, date.toString() + '\n')
	return false	
}

function mouse_down(id, extraarg) {
	var command = $(id).attr('alt')
	console.log(command)
	document.execCommand(command, false, extraarg)
	return false
}

function getSelectedText() {
    var text = ''
    if (window.getSelection) {
        text = window.getSelection().toString()
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text
    }
    return text
}

function text_onclick(target) {
	if(collapse_collapsible(target) == 'visible') {
		active_div = $('#' + target.id.replace('expand_', '').replace('_main_', '_body_'))
		active_div.focus()
	} else {
		active_div = null
	}
}

function text_keypress(event) {
	console.log(event.which)
	if(event.which === 13 && event.target.id.indexOf('_header_') > -1) {
		active_div = document.getElementById(event.target.id.replace('_header_', '_body_'))
		active_div.focus()
		return false
	} else if(event.which === 13 && event.shiftKey) {					// Enter
		render_mathjax(event.target)
		create_and_insert('text_main')
		return false
	} else if(event.which === 13 && event.ctrlKey) {				// Enter
		render_mathjax(event.target)
		return false
	} else if(event.which === 109 && event.ctrlKey && !event.altKey) {				// m
		var text = getSelectedText()
		if(text.length != 0) {
			document.execCommand('insertHTML', false, '<span class="nothon_math" alt="">\\(' + text + '\\)</span> <span id="_math_marker_"></span>')
			goto_marker("_math_marker_")
			render_mathjax(event.target)
		}
		else {
			strip_mathjax(event.target)
			insert_math('inline')
		}
		return false
	} else if(event.which === 109 && event.ctrlKey && event.altKey) {	// M
		var text = getSelectedText()
		if(text.length != 0) {
			document.execCommand('insertHTML', false, '<br><div class="nothon_math" alt="">\\[' + text + '\\]</div><br> <span id="_math_marker_"></span>')
			goto_marker("_math_marker_")
			render_mathjax(event.target)
		}
		else {
			strip_mathjax(event.target)
			insert_math('display')
		}
		return false
	} else if(event.which === 97 && event.ctrlKey) {				// a
		insert_note()
		return false
	} else if(event.which === 98 && event.ctrlKey) {				// b
		document.execCommand("bold", false, false)
		return false
	} else if(event.which === 105 && event.ctrlKey) {				// i
		document.execCommand("italic", false, false)
        return false		
	} else if(event.which === 117 && event.ctrlKey) {				// u
		document.execCommand("underline", false, false)
		return false
	} else if(event.which === 111 && event.ctrlKey) {					// o
		return highlight()
	} else if(event.which === 100 && event.altKey) {					// d
		insert_date()
		return false
	} else if(event.which === 108 && event.ctrlKey) {						// l
		// retrieve raw text
		strip_mathjax(event.target)
		return false
	} else if(event.which === 38) {			// &
		// evaluate math expression 
		get_math_code(event.target)
		return true
	} else if(event.which === 35) {			// #
		// insert tag 
		// TODO: check, if text is selected. If so, turn it into a tag.
		insert_tag()
		return false
	}
	else if(event.which === 42 && event.altKey) {				// *
		document.execCommand('insertUnorderedList', false, false)
		return false
	} else if(event.which === 49 && event.altKey) {				// 1
		document.execCommand('insertOrderedList', false, false)
		return false
	} /* else if(event.keyCode === 38) { // arrow key up
		var ran = window.getSelection().getRangeAt(0)
		console.log(window.getSelection().getRangeAt(0).startOffset)
		console.log('compare: ' + ran.comparePoint(event.target, 0))
		var id = get_id_marker();
		insert_node_at_caret(marker_from_id(id));
		var elem_child = document.getElementById(id)
		var elem = elem_child.parentNode
		
		//console.log(elem.id, elem_child.id,"-",elem_child.previousSibling.data,"-", elem_child.previousSibling.nodeName)
		if(elem.tagName == "DIV" && 
			( elem_child.previousSibling==null || (elem_child.previousSibling.nodeName == "#text" && is_blank(elem_child.previousSibling.data)) ) ) {
				
			goto_marker(id)
			
			elem = elem.previousSibling
			while(elem.tagName != "DIV") {
				elem = elem.previousSibling
			}
			console.log('id',elem.id)
			elem.focus()
		} else {
			goto_marker(id)
		}
	} else if(event.keyCode === 40) { // arrow key down
		var id = get_id_marker();
		insert_node_at_caret(marker_from_id(id));
		var elem_child = document.getElementById(id)
		var elem = elem_child.parentNode
		
		console.log(elem.id, elem_child.id,"-",elem_child.nextSibling.data,"-", elem_child.nextSibling.nodeName)
		if(elem.tagName == "DIV" && 
			( elem_child.nextSibling==null || (elem_child.nextSibling.nodeName == "#text" && is_blank(elem_child.nextSibling.data)) ) ) {
				
			goto_marker(id)
			
			elem = elem.nextSibling
			while(elem.tagName != "DIV") {
				elem = elem.nextSibling
			}
			console.log('id',elem.id)
			elem.focus()
		} else {
			goto_marker(id)
		}		
	}*/
	latex_helper()
	return true
}

function text_data(div_data, math_string) {
	var message = create_message(div_data, "text")
	message.content = math_string
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), text_handler)
}

function text_handler(req) {
	var message = JSON.parse(req.responseText)
	if(message['success'] == 'failed') {
		alert('failed!' + message['result'])
	}
	else {
		var div_text = document.getElementById(message['target']).innerHTML
		var first = div_text.indexOf('&amp;&amp;')
		var second = first + div_text.slice(first + '&amp;&amp;'.length, div_text.length).indexOf('&amp;&amp;')+2*'&amp;&amp;'.length
		div_text = div_text.slice(0, first) + '\\[' + message['result'] + '\\]' + div_text.slice(second, div_text.length)
		document.getElementById(message['target']).innerHTML = div_text
		MathJax.Hub.Queue(["Typeset", MathJax.Hub, message['target']]);
	}
}

function text_sanitise(block) {
	var dtemp = $('<div/>', {'id': 'dtemp'}).appendTo('#trash')
	$('#dtemp').html($('#' + block.content.text_body.id).html())
	strip_mathjax_for_save($('#dtemp'))
	strip_images_for_save($('#dtemp'))
	block.content.text_body.content = $('#dtemp').html()
	block.content.text_header.content = block.content.text_header.content.replace('<br>', '')
	$('#dtemp').remove()
	return block
}

// Keep mandatory functions at the beginning of the file!

function is_blank(str) {
    return (!str || /^\s*$/.test(str));
}

function get_id_marker() {
    return "marker_" + ("" + Math.random()).slice(2);
}

function marker_from_id(id) {
    return '<span id="' + id + '"></span>';
} 

function insert_node_at_caret(node) {
		var sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            var range = sel.getRangeAt(0);
            range.deleteContents();

            var el = document.createElement("div");
            el.innerHTML = node;
            var frag = document.createDocumentFragment(), node, lastNode;
            while ( (node = el.firstChild) ) {
                lastNode = frag.appendChild(node);
            }
            range.insertNode(frag);
            
            if (lastNode) {
                range = range.cloneRange();
                range.setStartAfter(lastNode);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }
		}
}


function goto_marker(id) {
    var range = document.createRange()
    range.selectNodeContents(document.getElementById(id))

    var selection= window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)

    var element = document.getElementById(id)
    element.parentNode.removeChild(element)
}

function get_math_code(target) {
	var div_text = target.innerHTML
	console.log('text', div_text)
	var first = div_text.indexOf('&amp;&amp;')
	if(first > 0) {
		second = div_text.slice(first + '&amp;&amp;'.length, div_text.length).indexOf('&amp;')
		if(second > 0) {
			var math_string = div_text.slice(first+'&amp;&amp;'.length, first+'&amp;&amp;'.length+second)
			text_data(target, math_string)
		}
	}
}

function strip_mathjax(target) {
	$(target).find('.nothon_math').each( function() {
		if($(this).attr('alt') !== '') {
			$(this).html($(this).attr('alt'))
			$(this).attr('alt', '')
		}
	})
}

function strip_mathjax_for_save(target) {
	$(target).find('.nothon_math').each( function() { $(this).html($(this).attr('alt')) })
}

function strip_images_for_save(target) {
	$(target).find('.section_image').each( function() {
		
		var $pointer = $(this)
		$pointer.find('.image_path').each( function() {
			// For some reason, $(this).val() doesn't work...
			$pointer.attr('data-path', $('#' + $(this).attr('id')).val())
		})
		$pointer.find('.image_caption').each( function() {
			// The same problem here...
			$pointer.attr('data-caption', $('#' + $(this).attr('id')).html())
		})
		$pointer.find('img').each( function() {
			$pointer.attr('data-x', $('#' + $(this).attr('id')).width())
			$pointer.attr('data-y', $('#' + $(this).attr('id')).height())
		})
		
		$pointer.html(' ')
	})
}

function render_mathjax(target) {
	$(target).find('.nothon_math').each( function() {
			if($(this).attr('alt').length == 0) {
				$(this).attr('alt', $(this).html())
			}
	})
	MathJax.Hub.Queue(["Typeset", MathJax.Hub, target.id]);
}

function insert_math(mode) {
	if (mode === 'inline') {
		document.execCommand('insertHTML', false, '<span class="nothon_math" alt="">\\(<span id="_math_marker_"></span>\\)</span>&nbsp;')
	}
	if (mode === 'display') {
		document.execCommand('insertHTML', false, '<br><div class="nothon_math" alt="">\\[<br><span id="_math_marker_"></span><br>\\]</div><br>')
	}
	goto_marker("_math_marker_")
}

function insert_note() {
	var text = getSelectedText()
	if(text.length == 0) {
		document.execCommand('insertHTML', false, '<span class="note"><button class="note_button" onclick="note_toggle(this);">Note</button><span><span id="_note_marker_"></span> </span></span> ')
		goto_marker("_note_marker_")
	}
	else {
		document.execCommand('insertHTML', false, '<span class="note"><button class="note_button" onclick="note_toggle(this);">Note</button><span>' + text + '</span></span> ')		
	}
	return false
}

function note_toggle(id) {
	$(id).siblings().toggle()
	// We might have to activate the parent element here!
}

function latex_helper(){
	var sel = $(window.getSelection().focusNode.parentNode)
	var type = $(sel).attr('class')
	if(type === 'nothon_math') {
		//document.execCommand('insertHTML', false, '<span id="__placeholder__"></span> ')
		//console.log($(sel).html())
	}
}

function insert_tag() {
	document.execCommand('insertHTML', false, '<a href="#" onClick="tag_clicked(this);">#<span id="_tag_marker_"></span></a>')
	goto_marker("_tag_marker_")
}

function create_link() {
	var text = getSelectedText()
	if(text.length != 0) {
		document.execCommand('insertHTML', false, '<span><button class="link_button" onmouseup="link_toggle(this);">Link</button><a href="' + text + '">' + text + '</a></span> <span id="_marker_"></span> ')
		goto_marker('_marker_')
	}
	else {
		var id = '_' + Math.floor(Math.random()*1000000)
		document.execCommand('insertHTML', false, '<span><button class="link_button" onmouseup="link_toggle(this);">Link</button>Target: <input id="' + id + '" type="text" value=""></input>&nbsp; Text:<input type="text" value=""></input>')
		$('#' + id).focus()
	}
	return false
}

function link_toggle(id) {
	//active_div = $(id).closest('[class$="_main"]')
	if($(id).siblings().length == 1) { // the link is collapsed
		var href = $(id).siblings('a').attr('href')
		var text = $(id).siblings('a').text()
		var tid = '_' + Math.floor(Math.random()*1000000)
		$(id).parent().html('<button class="link_button" onclick="link_toggle(this);">Link</button>Target: <input id="' + tid + '" type="text" value="' + href + '"></input>&nbsp; Text:<input type="text" value="' + text + '"></input>')
		$('#' + tid).focus()
	}
	else if($(id).siblings().length == 2) { // the link is expanded
		var href = $(id).siblings(':first').val()
		var text = $(id).siblings(':last').val()
		$(id).parent().after(' <span id="_marker_"></span>')
		$(id).parent().html('<button class="link_button" onclick="link_toggle(this);">Link</button><a href="' + href + '">' + text + '</a></span>')
		goto_marker('_marker_')
		active_div.focus()
	}
}
