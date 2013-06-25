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
	//jQuery("#element1").before(jQuery("#element2")); can be used for swapping
	//jQuery("#element1").after(jQuery("#element2"));
	if(!active_div) return
	position = active_div.parentNode // This should bubble till something like _main...
	// This can be done with $(active_div).closest('[id$=_main]')
	if(where == 'up' && document.getElementById('docmain').firstChild.id != position.id) {
		position.parentNode.insertBefore(position, position.previousSibling)
	}
	if(where == 'down' && document.getElementById('docmain').lastChild.id != position.id) {
		position.nextSibling.parentNode.insertBefore(position.nextSibling, position)
	}
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

function get_index(obj) {
	var num = obj.split("_")
	return parseInt(num[num.length-1])
}

function get_num(divide) {
	var num = divide.id.split("_")
	return parseInt(num[num.length-1])
}

function get_max_index(className) {
	// TODO: using the className is probably not the best idea. 
	// This should be done using the data-type tag!
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
	if(event.target.id.indexOf('_main_') != -1) {
		toggle_show_hide(event)
	}
}

function create_and_insert(className) {
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
	new_div.innerHTML = eval(className.replace('_main', '_html') + '(' + num + ')')
	var elem_id = new_div.firstChild.id
	if(active_div) {
		insertAfter(new_div.firstChild, position)
	} else {
		position.appendChild(new_div.firstChild)
	}
	eval(className.replace('_main', '_activate') + '(' + num + ')')
}

function create_message(div_data, message_type) {
	var message = new Object()
	message.command = message_type
	message.id = div_data.id
	message.content = div_data.innerHTML
	message.directory = document.getElementById("div_dir").innerHTML
	return message
}

function message_handler(req) {
	var message = JSON.parse(req.responseText)
//	console.log(message)
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

function set_active(id) {
	active_div = id
	var type = $(id).data('type')
	eval(type + '_context_menu()')
}

function block_content(elem) {
	var block = new Object()

	block.type = $(elem).data('type')
	block.id = get_index($(elem).attr('id'))
	block.content = {}
	$(elem).children().each( function() {
		if($(this).parent().get(0) === $(elem).get(0)) {
			var nothon = $(this).data('nothon')
			var props = $(this).data('props')
			if(nothon) {
				if(check_tag(nothon, 'save')) {
					var sub_block = new Object()
					sub_block['content'] = $(this).html()
					sub_block['id'] = $(this).attr('id')
					if($(this).is(':visible')) props.replace('collapsed;', '')
					else props = add_tag(props, 'collapsed')
					sub_block['props']= props
					block.content[$(this).attr('class')] = sub_block
				}
			}
		}
	})
	eval('block = ' + block.type + '_sanitise(block)')
	return block
}

function check_tag(where, tag) {
	if(!where || where.length == 0) return false
	var tags = where.split(';')
	tags = $.unique(tags)
	for(i=0; i < tags.length; i++) {
		if($.trim(tags[i]) === tag) return true
	}
	return false
}

function add_tag(where, tag) {
	if(where.length == 0) return tag + ';'
	var tags = where.split(';')
	for(i=0; i < tags.length; i++) {
		if($.trim(tags[i]) === tag) return where
	}
	if(where.charAt(where.length - 1) == ';') return where + tag + ';'
	return where + ';' + tag + ';'
}

function get_divs() {
	var content = new Array()
	content[0] = {"title" : document.title }
	$("#docmain").children("div[class*='_main']").each( function() {			
			content.push(block_content($(this)))
		}
	);
	return content
}

function save() {
	console.log('saving', window.location.href)
	if(window.location.href.indexOf('?name=__timeline') > 0) return
	console.log('saving')
	var message = create_message('', "save")
	message.type = $('body').data('type')
	message.outfile = document.title
	message.title = $.trim(document.getElementById("div_title").innerHTML)
	message.directory = document.getElementById("div_dir").innerHTML
	message.content = get_divs()
	message.date = Date()
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message, null, 4), save_handler)
}

function save_handler(req) {
	var message = JSON.parse(req.responseText)
}

function save_html() {
	var message = create_message('', "savehtml")
	message.outfile = document.title
	message.title = document.getElementById("div_title").innerHTML
	message.content = document.getElementById('docmain').innerHTML
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), save_handler)
}

function docmain_render(address) {
	var message = create_message('', "docmain_render")
	message.address = address
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), docmain_handler)
}

function docmain_handler(req) {
	var message = JSON.parse(req.responseText)
	$('#docmain').html(message['docmain'])
	document.title = message['doc_title']
	$('#div_dir').html(message["directory"])
	$('#div_title').html(message["title"])	
}

function delete_block() {
	if(active_div) {
		var elem = active_div.parentNode
		document.getElementById('trash').appendChild(elem)
		active_div = null
	}
	document.getElementById('trash_image').style.backgroundImage = 'url(static/css/trashbin_full.png)'
}

function recover_block() {
	if(active_div) {
		var elem = active_div.parentNode
		if(elem && elem.parentNode.id == 'trash') {
			document.getElementById('docmain').appendChild(elem)
		}
	}
	if(document.getElementById('trash').childNodes.length == 1) {
		document.getElementById('trash_image').style.backgroundImage = 'url(static/css/trashbin_empty.png)'
	}
}

$(document).ready(function () {
	$("#menu").hover(function() {
		$("#menu > ul").fadeIn("slow"); 
	}, 
	function() {
		$("#menu > ul").fadeOut("slow"); 
	});
	
	$('#calendar').datepick({
		dateFormat: 'yyyy-mm-dd',
		onSelect: function(date) {
			save()
			var d = new Date(date)
			var month = (100 + d.getMonth() + 1).toString().slice(1,3)
			var day = (100 + d.getDate()).toString().slice(1,3)
			window.location.href = 'http://127.0.0.1:8080/?name=Calendar/' + d.getFullYear() + '/' + month + '/' + day + '.note'
		}
	});
	
	$(function() {
		$("#document_tree").dynatree({
			persist: true,
			onActivate: function(node) {
				save()
				window.location.href = "?name=" + node.getKeyPath().slice(1)
				return false
			}
		});
	});
	
	$("#document_tree").bind("contextmenu", function(e) {
		return false;
	});
	
	$(function() {
		$("div").each( function() {
			var props = $(this).data('props')
			console.log(props)
			if(check_tag(props, 'collapsed')) $(this).hide()
		});
	});
	
	$(function() {
		$('.nothon_math').each( function() { $(this).html($(this).attr('alt')) })
	});
});

function dir_keypress(event) {
	if(event.which === 13) return false
	else return true
}

function toggle_document_tree() {
	if($('#aside').css('display') == 'block') {
		$('#aside').css('display', 'none')
		// TODO: find out how to retrieve default properties
		$('#article').css('width', '98%')
		$('#aside_switch').html('>>')
	}
	else {
		$('#aside').css('display', 'block')
		$('#article').css('width', '78%')
		$('#aside_switch').html('<<')
	}
}

document.addEventListener("keydown", function(e) {
  if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
    e.preventDefault()
	save()
  }
  if (e.keyCode == 72 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
    e.preventDefault()
	alert('Ctlr-H\tHelp\nCtlr-S\tSave\nCtlr-B\tBoldface\nCtlr-I\t\tItalic\nCtlr-U\tUnderline\nCtlr-O\tHighlight\nCtlr-L\t\tRetrieve LaTeX\nCtlr-M\tInline math\nCtlr-Alt-M\tDisplay math\n&&...&&\tExecute maxima')
  }
  
}, false)

function set_expand(id) {
	var elem = $(id).find('.button_expand').each(function() {
		$(this).children().attr('src', '/static/icons/expand.png')
	})
}

function set_collapse(id) {
	var elem = $(id).find('.button_expand').each(function() {
		$(this).children().attr('src', '/static/icons/collapse.png')
	})
}

function redirect(address) {
	console.log('asdasd')
	self.location = address
}

function toggle_context_menu() {
	$('#context_menu').toggle()
}
