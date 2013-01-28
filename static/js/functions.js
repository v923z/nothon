// http://stackoverflow.com/questions/4767848/get-caret-cursor-position-in-contenteditable-area-containing-html-content
// http://stackoverflow.com/questions/3972014/get-caret-position-in-contenteditable-div
// http://www.allwebdevhelp.com/javascript/js-help-tutorials.php?i=14882
// http://forums.phpfreaks.com/topic/268622-place-cursor-at-end-of-line-in-editable-div/

var active_div = null

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
	if(elem.className == 'text_main') {
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
	else if(elem.className == 'plot_main') {
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
	$("#menu > ul").fadeOut("slow"); 

	if(active_div) {
		position = active_div.parentNode
		if(position.parentNode.id == 'trash') {
			position = document.getElementById('docmain').lastChild
		}
	}
	else position = document.getElementById('docmain')
		
	var num = get_max_index(className) + 1
	var new_div = document.createElement("div")
	new_div.id = 'div_' + className + '_' + num
	console.log(new_div.id)
	new_div.setAttribute("class", className)
	new_div.addEventListener("click", get_mouse_pos, false)
	
	new_div.id = 'div_' + className + '_' + num
	if (className == "head_main") {
		new_div.innerHTML = head_html(num)
	} else if (className == "plot_main") {
		new_div.innerHTML = plot_html(num)
	} else if (className == "text_main") {
		new_div.innerHTML = text_html(num)
	} else if (className == "code_main") {
		new_div.innerHTML = code_html(num)
	}
	//insertAfter(new_div, document.getElementById(position))
	if(active_div) insertAfter(new_div, position)
	else position.appendChild(new_div)
	document.getElementById('div_' + className.replace('main', 'header_'+num)).focus()
}

function generic_keypress(event) {
	console.log(event.target.id)
	if (event.which === 13 && event.ctrlKey) {	// Enter
		if(event.target.className == "head_header") {
			head_data(event.target)
		} else if(event.target.className == "plot_header") { 
			plot_data(event.target)
		} else if(event.target.className == "code_header") {
			code_data(event.target)
		} else if(event.target.className == "text_header") {
			text_data(event.target)
		} else if(event.target.className == "text_body") {
			evaluate_text(event.target)
		}
		return false
	}
	if (event.which === 13 && event.shiftKey) {
		if(event.target.className == "head_header") {
		}
		return false
	}
	if(event.which === 13 && event.target.className == "code_header") {
			code_data(event.target)
			return false
	}
	if(event.which === 13 && event.target.className == "head_header") {
			head_data(event.target)
			return false
	}
	if (event.which === 13 && event.target.className == "text_header") {
		var elem = document.getElementById(event.target.id.replace('_header_', '_body_'))
		elem.focus()
		set_active(elem)
		return false
	}
	else text_keypress(event)
	//return true
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
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), message_handler)
}

function message_handler(req) {
	var message = JSON.parse(req.responseText)
	for(i in message) {
		var elem = document.getElementById(i)
		if(elem && i != "scroller") {
			elem.innerHTML = message[i]
		}
	}
	// TODO: scrolling is not quite perfect
	if(message["scroller"]) {
		var elem = document.getElementById(message["scroller"])
		if(elem) elem.scrollTop = elem.scrollHeight
	}
}

function head_data(div_data) {
	var message = create_message(div_data, "head")
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), message_handler)
}

function code_data(div_data) {
	var message = create_message(div_data, "code")
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), message_handler)
}

function set_active(id) {
	console.log(id)
	active_div = id
}

function text_keypress(event) {
	console.log(event.target.id)
	console.log(event.which)
	var elem = event.target
	var text = elem.innerHTML
	console.log(text)
	if ((event.which || event.keyCode) == 93) {	// ]
//		var new_string = text.slice(0, idx) + '<strong>' + text.slice(idx+1, -1) + '</strong>'
//		elem.innerHTML = new_string
		var sel = window.getSelection()
		if (sel.rangeCount) {
            var range = sel.getRangeAt(0);
			console.log(sel.rangeCount)
			range.collapse(false);
			range.insertNode(node);
			range = range.cloneRange();
			range.selectNodeContents(node);
			range.collapse(false);
			sel.removeAllRanges();
			sel.addRange(range);
		}
		return false
	}
	
	if ((event.which || event.keyCode) == 42) {	// *
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
	if(elem.className == 'plot_main') {
		return '<plot>\n<header>' + header + '</header>\n<title>' + title + '</title>\n</plot>\n'
	}
	if(elem.className == 'text_main') {
		return '<text>\n<header>' + header + '</header>\n<body>' + body + '\n</body>\n</text>\n'
	}
	if(elem.className == 'head_main') {
		return '<head>\n<header>' + header + '</header>\n<title>' + title + '</title>\n<body>' + body + '\n</body>\n</head>\n'
	}
	if(elem.className == 'code_main') {
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

$(document).ready(function () {
	$("#menu").hover(function() {
		$("#menu > ul").fadeIn("slow"); 
	}, 
	function() {
		$("#menu > ul").fadeOut("slow"); 
	});
});
