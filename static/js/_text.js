function text_activate(id) {
	active_div = document.getElementById('div_text_header_' + id)
	active_div.focus()
}

function text_onclick(event) {
	var elem = event.target
	if(elem.id.indexOf('_main_') === -1) return
	var elem = document.getElementById(elem.id.replace('_main_', '_body_'))
	active_div = document.getElementById(elem.id.replace('_body_', '_header_'))
	if(elem.style.display == "block") {
    	elem.style.display = "none"
  	}
	else {
		elem.style.display = "block"
	}
	active_div.focus()
}

function text_keypress(event) {
	console.log(event.which)
	
	if(event.which === 13 && event.target.id.indexOf('_header_') > -1) {
		active_div = document.getElementById(event.target.id.replace('_header_', '_body_'))
		active_div.focus()
		return false
	} else if(event.which === 13 && event.shiftKey) {					// Enter
		text_data(event.target)
		create_and_insert('text_main')
		return false
	} else if(event.which === 13 && event.ctrlKey) {				// Enter
		MathJax.Hub.Queue(["Typeset", MathJax.Hub, event.target.id]);
		return false
	} else if(event.which === 109 && event.ctrlKey && !event.altKey) {				// m
		insert_math('inline', event.target)
		return false
	} else if(event.which === 109 && event.ctrlKey && event.altKey) {	// M
		insert_math('display', event.target)
		return false
	} else if(event.which === 98 && event.ctrlKey) {				// b
		// insert boldface
		apply_tag('<b>', '</b>', event.target)
        return false
	} else if(event.which === 105 && event.ctrlKey) {				// i
		// insert italic
		apply_tag('<i>', '</i>', event.target)
        return false		
	} else if(event.which === 117 && event.ctrlKey) {				// u
		// insert underline
		apply_tag('<u>', '</u>', event.target)
		return false
	}
	else if(event.which === 100 && event.altKey) {					// d
		insert_time(event.target)
		return false
	}
	return true
}

function text_data(div_data) {
	var message = create_message(div_data, "text")
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), message_handler)
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

function apply_tag(open_tag, close_tag, target) {
    var sel, range, selectedText
    if (window.getSelection) {
        sel = window.getSelection()
        if(sel.rangeCount) {
            range = sel.getRangeAt(0)
            selectedText = range.toString()
            range.deleteContents()
            range.insertNode(document.createTextNode('_tag_open_inserted_' + selectedText + '_tag_close_inserted_'))
        }
    }
    else if(document.selection && document.selection.createRange) {
        range = document.selection.createRange()
        selectedText = document.selection.createRange().text + ""
        range.text = '_tag_open_inserted_' + selectedText + '_tag_close_inserted_'
    }
    var t = document.getElementById(target.id)
	t.innerHTML = t.innerHTML.replace('_tag_open_inserted_', open_tag).replace('_tag_close_inserted_', close_tag + '<span id="_text_style_marker_"></span>')
	goto_marker("_text_style_marker_")
}

function insert_math(mode, target) {
    var sel, range
    var selectedText
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.rangeCount) {
            range = sel.getRangeAt(0);
            selectedText = range.toString();
            range.deleteContents();
			range.insertNode(document.createTextNode('_math_open_inserted_' + selectedText + '_math_close_inserted_'))
        }
    }
    else if (document.selection && document.selection.createRange) {
        range = document.selection.createRange()
        selectedText = document.selection.createRange().text + ""
		range.text = '_math_open_inserted_' + selectedText + '_math_close_inserted_'
    }
    var t = document.getElementById(target.id)
	if (mode === 'inline') {
		t.innerHTML = t.innerHTML.replace('_math_open_inserted_', '\\(').replace('_math_close_inserted_', '<span id="_math_marker_"></span>\\)')
	}
	if (mode === 'display') {
		t.innerHTML = t.innerHTML.replace('_math_open_inserted_', '<br>\\[<br>').replace('_math_close_inserted_', '<span id="_math_marker_"></span><br>\\]<br>')
	}
	goto_marker("_math_marker_")
}

function insert_time(target) {
	var date = new Date()
	
	var sel, range
    var selectedText
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.rangeCount) {
            range = sel.getRangeAt(0);
            selectedText = range.toString();
            range.deleteContents();
			range.insertNode(document.createTextNode(date.toString()) + '_date_inserted_')
        }
    }
    else if (document.selection && document.selection.createRange) {
        range = document.selection.createRange()
        selectedText = document.selection.createRange().text + ""
		range.text = date.toString() + '_date_inserted_'
    }
    var t = document.getElementById(target.id)
	t.innerHTML = t.innerHTML.replace('_date_inserted_', '<span id="_date_marker_"></span>')
	goto_marker("_date_marker_")
}
