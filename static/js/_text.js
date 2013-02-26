function text_activate(id) {
	active_div = document.getElementById('div_text_header_' + id)
	active_div.focus()
}

function text_onclick(event) {
	var elem = event.target
	if(elem.id.indexOf('_main_') === -1) return
	var text_body = document.getElementById(elem.id.replace('_main_', '_body_'))
	var text_header = document.getElementById(elem.id.replace('_main_', '_header_'))
	
	if(event.pageY - text_header.offsetTop > text_header.offsetHeight) {
		text_body.innerHTML = strip_mathjax(text_body.innerHTML)
		active_div = text_body
	} else {
		if(text_body.style.display == "block") {
			text_body.style.display = "none"
			active_div = text_header
		} else {
			text_body.style.display = "block"
			active_div = text_body
		}
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
		create_and_insert('text_main')
		return false
	} else if(event.which === 13 && event.ctrlKey) {				// Enter
		MathJax.Hub.Queue(["Typeset", MathJax.Hub, event.target.id]);
		return false
	} else if(event.which === 13) { // Enter without modifier
		var id = get_id_marker();
		insert_node_at_caret(marker_from_id(id));
		var elem = document.getElementById(id).parentNode
		goto_marker(id)
				console.log('ENTER', elem.tagName, elem.firstChild.data)
		if(elem.tagName == 'LI' && elem.firstChild.data == undefined) {
			console.log('enter pressed on empty list item')
			
			// build node to be inserted
			var id2 = get_id_marker();
			var el = document.createElement("span");
			el.id = id2;
            
            // insert node, set cursor, remove empty LI
			elem.parentNode.parentNode.insertBefore(el, elem.parentNode.nextSibling); // works even if nextSibling is null
			goto_marker(id2)
			elem.parentNode.removeChild(elem)
			return false;
		} else {
			return true
		}
	} else if(event.which === 109 && event.ctrlKey && !event.altKey) {				// m
		insert_math('inline', event.target)
		return false
	} else if(event.which === 109 && event.ctrlKey && event.altKey) {	// M
		insert_math('display', event.target)
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
		document.execCommand("hilitecolor", false, "#ffff00")
		return false
	} else if(event.which === 100 && event.altKey) {					// d
		insert_time(event.target)
		return false
	} else if(event.which === 108 && event.ctrlKey) {						// l
		// retrieve raw text
		event.target.innerHTML = strip_mathjax(event.target.innerHTML)
		return false
	} else if(event.which === 38) {			// &
		// evaluate math expression 
		get_math_code(event.target)
		return true
	} else if(event.which === 42) { // *
		var id = get_id_marker();
		insert_node_at_caret(marker_from_id(id));
			
		var elem = document.getElementById(id)
		var children = elem.parentNode.childNodes;
			
		// determine the index
		var i = 0;
	  	for (; i < children.length; i++)
			if(children[i].id == elem.id)
				break;
			
		if(i>0 && children[i-1].tagName == 'BR') {
			goto_marker(id)
			
			var id2 = get_id_marker();
			insert_node_at_caret("<ul><li>" + marker_from_id(id2) + "</li></ul>")
			goto_marker(id2)
			return false
		} else {
			goto_marker(id)
			return true
		}
	} else if(event.which === 93) { // ]
		return insert_if_linestarts('<input type="checkbox" />');
	} else if(event.keyCode === 38) { // arrow key up
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
	}
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
	block.content.text_body.content = strip_mathjax(block.content.text_body.content)
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

function insert_if_linestarts(html) {
	var id = get_id_marker();
	insert_node_at_caret(marker_from_id(id));
		
	var elem = document.getElementById(id)
	var children = elem.parentNode.childNodes;
		
	// determine the index
	var i = 0;
  	for (; i < children.length; i++)
		if(children[i].id == elem.id)
			break;
		
	if(i>0 && children[i-1].tagName == 'BR') {
		goto_marker(id)
		insert_node_at_caret(html + " ")
		return false
	} else {
		goto_marker(id)
		return true
	}		
}

function less_than(a, b) {
	if(a > 0 && b > 0 && a < b) return true
	if(a > 0 && b < 0) return true
	if(a > 0 && a < b) return true
	if(a < 0 && b > 0) return false
	if(a > 0 && a > b) return false
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

function strip_mathjax(div_text) {
	var offset, scr
	var first = div_text.indexOf('<span class="MathJax_Preview">')
	if(first > 0) {
		var second = div_text.indexOf('type="math/tex">')
		var third = div_text.indexOf('type="math/tex; mode=display">')
		if(second > 0 && less_than(second, third)) {
			offset = 'type="math/tex">'.length
			div_text = div_text.slice(0, first) + '\\(' + div_text.slice(second + offset, div_text.length)
			scr = div_text.indexOf('</script>')
			offset = '</script>'.length
			div_text = div_text.slice(0, scr) + '\\)' + div_text.slice(scr + offset, div_text.length)
		}
		else if(third > 0 && less_than(third, second)) {
			offset = 'type="math/tex; mode=display">'.length
			div_text = div_text.slice(0, first) + '\\[<br>' + div_text.slice(third + offset, div_text.length)
			scr = div_text.indexOf('</script>')
			offset = '</script>'.length
			div_text = div_text.slice(0, scr) + '<br>\\]' + div_text.slice(scr + offset, div_text.length)			
		}
		div_text = strip_mathjax(div_text)
	}
	return div_text
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
