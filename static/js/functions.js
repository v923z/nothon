// http://stackoverflow.com/questions/4767848/get-caret-cursor-position-in-contenteditable-area-containing-html-content
// http://stackoverflow.com/questions/3972014/get-caret-position-in-contenteditable-div
// http://www.allwebdevhelp.com/javascript/js-help-tutorials.php?i=14882
// http://forums.phpfreaks.com/topic/268622-place-cursor-at-end-of-line-in-editable-div/

var active_div = null

function generate_head_html(id) {
	var html = ('<div id="div_head_header_' + id + '" class="div_head_header" contenteditable="true" onkeypress="return generic_keypress(event);" onfocus="set_active(this);"></div>' + 
			'<div id="div_head_title_' + id + '" class="div_head_title"></div>' +
			'<div id="div_head_body_' + id + '" class="div_head_body"></div>' + 
			'<div id="div_head_container_' + id + '" class="div_head_container"></div>')
	return html
}

function generate_plot_html(id) {
	var html = ('<div id="div_plot_header_' + id + '" class="div_plot_header" contenteditable="true" onkeypress="return generic_keypress(event);" onfocus="set_active(this);"></div>' + 
				'<div id="div_plot_title_' + id + '" class="div_plot_title"></div>' +
			'<div id="div_plot_body_' + id + '" class="div_plot_body" onfocus="set_active(this);"></div>' + 
			'<div id="div_plot_container_' + id + '" class="div_plot_container"></div>')
	return html
}

function generate_code_html(id) {
	var html = ('<div id="div_code_header_' + id + '" class="div_code_header" contenteditable="true" onkeypress="return generic_keypress(event);" onfocus="set_active(this);"></div>' + 
			'<div id="div_code_title_' + id + '" class="div_code_title"></div>' + 
			'<div id="div_code_body_' + id + '" class="div_code_body"></div>' + 
			'<div id="div_code_container_' + id + '" class="div_code_container"></div>')
	return html
}

function generate_text_html(id) {
	var html = ('<div id="div_text_header_' + id + '" class="div_text_header" contenteditable="true" onkeypress="return generic_keypress(event);" onfocus="set_active(this);"></div>' + 
			'<div id="div_text_title_' + id + '" class="div_text_title"></div>' + 
			'<div id="div_text_body_' + id + '" class="div_text_body" contenteditable="true" onkeypress="return generic_keypress(event);"></div>' + 
			'<div id="div_text_container_' + id + '" class="div_text_container"></div>')
	return html
}

function xml_http_post(url, data, callback) {
    var req = false;
    try {
        // Firefox, Opera 8.0+, Safari
        req = new XMLHttpRequest();
    }
    catch (e) {
        // Internet Explorer
        try {
            req = new ActiveXObject("Msxml2.XMLHTTP");
        }
        catch (e) {
            try {
                req = new ActiveXObject("Microsoft.XMLHTTP");
            }
            catch (e) {
                alert("Your browser does not support AJAX!");
                return false;
            }
        }
    }
    req.open("POST", url, true);
    req.onreadystatechange = function() {
        if (req.readyState == 4) {
            callback(req);
        }
    }
    req.send(data);
}

function move(where) {
	if(!active_div) return
	position = active_div.parentNode
	if(where == 'up' && document.getElementById('docmain').firstChild.id != position.id) {
		position.parentNode.insertBefore(position, position.previousSibling)
	}
	if(where == 'down' && document.getElementById('docmain').lastChild.id != position.id) {
		position.nextSibling.parentNode.insertBefore(position.nextSibling, position)
	}
	active_div.focus()
}

function toggle_show_hide(event) {
	var elem = event.target
	if(elem.className == 'div_text_main') {
		var text_header = document.getElementById(elem.id.replace('_main_', '_header_'))
		var text_body = document.getElementById(elem.id.replace('_main_', '_body_'))
		if(event.pageY - text_header.offsetTop > text_header.offsetHeight) {
			raw_text(text_body)
			set_active(text_body)
			active_div.focus()
			return
		}
	}
	if(elem.id == 'trash_image') {
		var elem = document.getElementById('trash')
	}
	else if(elem.className == 'div_plot_main') {
		var elem = document.getElementById(elem.id.replace('_main_', '_header_'))
		console.log(elem.id)
		active_div = document.getElementById(elem.id.replace('_header_', '_body_'))
	}
	else {
		var elem = document.getElementById(elem.id.replace('_main_', '_body_'))
		console.log(elem.id)
		active_div = document.getElementById(elem.id.replace('_body_', '_header_'))
	}
	if(elem.style.display == "block") {
    	elem.style.display = "none";
  	}
	else {
		elem.style.display = "block";
	}
	console.log('active', active_div.id)
	active_div.focus()	
}

function insertAfter(newElement, targetElement) {
	var parent = targetElement.parentNode;
	if(parent.lastchild == targetElement) {
		parent.appendChild(newElement)
	} else {
		parent.insertBefore(newElement, targetElement.nextSibling)
	}
}

function addKeyPressListener(divide, listener) {
	if (typeof divide.addEventListener != "undefined") {
		divide.addEventListener("keypress", listener, false);
	} else if (typeof divide.attachEvent != "undefined") {
		divide.attachEvent("onkeypress", listener);
	}
}

function get_index(obj) {
	var num = obj.split("_")
	return parseInt(num[num.length-1])
}

function get_num(divide) {
	var num = divide.id.split("_")
	return parseInt(num[num.length-1])
}

function get_max_index(className) {
	var elems = document.getElementsByClassName(className)
	console.log(elems.length)
	var num = 0
	for(i=0; i < elems.length; i++) {
		if(num < get_num(elems[i])) {
			num = get_num(elems[i])
		}
	}
	return num
}

function get_mouse_pos(event) {
//	console.log(event.pageX - elem.offsetLeft, event.pageY - elem.offsetTop)
	if(event.target.id.indexOf('_main_') != -1) {
		toggle_show_hide(event)
	}
}

function create_and_insert(className, position) {
	if(active_div) {
		position = active_div.parentNode
		if(position.parentNode.id == 'trash') {
			position = document.getElementById('docmain').lastChild
		}
	}
	else position = document.getElementById('docmain')
		
	var num = get_max_index(className) + 1
	var new_div = document.createElement("div")
	new_div.id = className + '_' + num
	new_div.setAttribute("class", className)
	new_div.addEventListener("click", get_mouse_pos, false)
	
	new_div.id = className + '_' + num
	if (className == "div_head_main") {
		new_div.innerHTML = generate_head_html(num)
	} else if (className == "div_plot_main") {
		new_div.innerHTML = generate_plot_html(num)
	} else if (className == "div_text_main") {
		new_div.innerHTML = generate_text_html(num)
	} else if (className == "div_code_main") {
		new_div.innerHTML = generate_code_html(num)
	}
	//insertAfter(new_div, document.getElementById(position))
	if(active_div) insertAfter(new_div, position)
	else position.appendChild(new_div)
	document.getElementById(className.replace('_main', '_header_'+num)).focus()
}

function generic_keypress(event) {
	console.log(event.target.id)
	//console.log(event.target.startOffset)
	console.log(window.getSelection().getRangeAt(0))
	if (event.which === 13 && event.ctrlKey) {	// Enter
		if(event.target.id.substring(0, 16) == "div_head_header_") {
			head_data(event.target)
		} else if(event.target.id.substring(0, 16) == "div_plot_header_") {
			plot_data(event.target)
		} else if(event.target.id.substring(0, 16) == "div_code_header_") {
			code_data(event.target)
		} else if(event.target.id.substring(0, 16) == "div_text_header_") {
			text_data(event.target)
		} else if(event.target.id.substring(0, 14) == "div_text_body_") {
			evaluate_text(event.target)
		}
		return false
	}
	if (event.which === 13 && event.shiftKey) {
		if(event.target.id.substring(0, 16) == "div_head_header_") {
		}
		return false
	}
	if(event.which === 13 && event.target.className == "div_code_header") {
			code_data(event.target)
			return false
	}
	if(event.which === 13 && event.target.className == "div_head_header") {
			head_data(event.target)
			return false
	}
	if (event.which === 13 && event.target.className == 'div_text_header') {
		var elem = document.getElementById(event.target.id.replace('_header_', '_body_'))
		elem.focus()
		set_active(elem)
		return false
	}
	return true
}

function create_message(div_data, message_type) {
	var message = new Object()
	message.type = message_type
	message.id = div_data.id
	message.content = div_data.innerHTML
	return message
}

function evaluate_text(div_data) {
	MathJax.Hub.Queue(["Typeset", MathJax.Hub, div_data.id]);
	//var message = create_message(div_data, "texteval")
    //xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), evaluate_text_handler)
}

function evaluate_text_handler(req) {
	console.log(req.responseText)
	var message = JSON.parse(req.responseText)
	console.log(message)
	document.getElementById(message.target).innerHTML += message.content + '<br>aadasd'
	var math = document.getElementById(message.target);
	MathJax.Hub.Queue(["Typeset", MathJax.Hub, math]);
}

function raw_text(div_data) {
	var message = create_message(div_data, "raw_text")
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), raw_text_handler)
}

function raw_text_handler(req) {
	head_handler(req)
}

function plot_data(div_data) {
	var message = create_message(div_data, "plot")
	message.title = document.title
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), plot_handler)
}

function plot_handler(req) {
	var message = JSON.parse(req.responseText)
	if(message['success'] == 'failure') {
		console.log(message['error'])
		var target = document.getElementById(message.target.replace('_plot_header_', '_plot_body_'))
		target.innerHTML = message['error']
		return
	}
	document.getElementById(message.title_target).innerHTML = message.title
	var target = message.target.replace('_plot_header_', '_plot_body_')
	document.getElementById(target).innerHTML = ''
	if(!document.getElementById('img_' + target)) {
		var elem = document.createElement("img")
		// TODO: attach right mouse click to object
		elem.id = 'img_' + target
	} else {
		var elem = document.getElementById('img_' + target)
	}
	document.getElementById(target).appendChild(elem)
	elem.src = "data:image/png;base64," + message.image_data
	elem.style.width = "60%"
	console.log(target)
	elem.scrollTop = target.scrollHeight
}

function head_data(div_data) {
	var message = create_message(div_data, "head")
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), head_handler)
}

function head_handler(req) {
	var message = JSON.parse(req.responseText)
	var elem = document.getElementById(message.target)
	elem.innerHTML = message.content
	elem.scrollTop = elem.scrollHeight
}

function code_data(div_data) {
	var message = create_message(div_data, "code")
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), code_handler)
}

function code_handler(req) {
	var message = JSON.parse(req.responseText)
	var elem = document.getElementById(message.target.replace('_code_header_', '_code_body_'))
	var container = document.getElementById(message.target.replace('_code_header_', '_code_container_'))
	elem.innerHTML = message.content
	container.innerHTML = message.raw
	elem.scrollTop = elem.scrollHeight
}

function set_active(id) {
	console.log(id)
	active_div = id
}

function text_keypress(event) {
	console.log(event.target.id)
	console.log(event.which)
	var elem = document.getElementById(event.target.id)
	var text = elem.innerHTML
	console.log(text)

	if ((event.which || event.keyCode) == 42) {	// *
		var elem = document.getElementById(event.target.id)
		var text = elem.innerHTML
		console.log(text)
		var idx = text.indexOf('*')
		if (idx >= 0) {
			var new_string = text.slice(0, idx) + '<strong>' + text.slice(idx+1, -1) + '</strong>'
			elem.innerHTML = new_string
			return false
		} else { return true }
	} else {
		return true
	}
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function get_divs() {
	var message_string = ''
	var elems = document.getElementById('docmain').getElementsByTagName("*")
	for(i=0; i < elems.length; i++) {
		if(endsWith(elems[i].className, '_main')) {
			message_string += block_content(elems[i]) 
		}
	}
	return message_string
}

function block_content(elem) {
	var header = document.getElementById(elem.id.replace('_main_', '_header_')).innerHTML
	var title = document.getElementById(elem.id.replace('_main_', '_title_')).innerHTML
	var body = document.getElementById(elem.id.replace('_main_', '_body_')).innerHTML
	var container = document.getElementById(elem.id.replace('_main_', '_container_')).innerHTML
	console.log(elem.className)
	if(elem.className == 'div_plot_main') {
		return '<plot>\n<header>' + header + '</header>\n<title>' + title + '</title>\n</plot>\n'
	}
	if(elem.className == 'div_text_main') {
		return '<text>\n<header>' + header + '</header>\n<body>' + body + '\n</body>\n</text>\n'
	}
	if(elem.className == 'div_head_main') {
		return '<head>\n<header>' + header + '</header>\n<title>' + title + '</title>\n<body>' + body + '\n</body>\n</head>\n'
	}
	if(elem.className == 'div_code_main') {
		return '<code>\n<header>' + header + '</header>\n<title>' + title + '</title>\n<body>' + container + '\n </body>\n</code>\n'
	}
	else {
		return
	}
}

function save() {
	var message = create_message('', "save")
	message.title = document.title
	message.content = get_divs()
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), save_handler)
}

function save_handler(req) {
	var message = JSON.parse(req.responseText)
}

function save_html() {
	var message = create_message('', "savehtml")
	message.title = document.title
	message.content = document.getElementById('docmain').innerHTML
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), save_handler)
}

function delete_block() {
	if(active_div) {
		var elem = active_div.parentNode
		document.getElementById('trash').appendChild(elem)
		active_div = null
	}
	document.getElementById('trash_image').style.backgroundImage = 'url(css/trashbin_full.png)'
}

function recover_block() {
	if(active_div) {
		var elem = active_div.parentNode
		if(elem && elem.parentNode.id == 'trash') {
			document.getElementById('docmain').appendChild(elem)
		}
	}
	if(document.getElementById('trash').childNodes.length == 1) {
		document.getElementById('trash_image').style.backgroundImage = 'url(css/trashbin_empty.png)'
	}
}
