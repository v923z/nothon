// http://stackoverflow.com/questions/4767848/get-caret-cursor-position-in-contenteditable-area-containing-html-content
// http://stackoverflow.com/questions/3972014/get-caret-position-in-contenteditable-div
// http://www.allwebdevhelp.com/javascript/js-help-tutorials.php?i=14882
// http://forums.phpfreaks.com/topic/268622-place-cursor-at-end-of-line-in-editable-div/

var active_div = null
var focused = null

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
	var num = 0
	for(i=0; i < elems.length; i++) {
		if(num < get_num(elems[i])) {
			num = get_num(elems[i])
		}
	}
	return num
}

function create_message(div_data, message_type) {
	var message = new Object()
	message.command = message_type
	message.id = div_data.id
	message.content = div_data.innerHTML
	message.directory = $('#div_dir').html().replace('<br>', '')
	return message
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

function set_active(id) {
	active_div = id
	var type = $(id).data('type')
	eval(type + '_context_menu()')
}

function block_content(elem) {
	var block = new Object()

	block.type = $(elem).data('type')
	block.count = get_index($(elem).attr('id'))
	block.id = $(elem).attr('id')
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
					console.log(props)
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
	var time = new Date()
	$('#notebook_status').html('Saved at ' + time.toTimeString().split(' ')[0])
	if(window.location.href.indexOf('?name=__timeline') > 0 || window.location.href.indexOf('?name=__toc') > 0) return
	var message = create_message('', "save")
	message.type = $('body').data('type')
	message.outfile = document.title
	message.title = $('#div_title').html()
	message.directory = $('#div_dir').html().replace('<br>', '')
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
	
	$('#notebook_tab').tabs();
	
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
	$("#document_tree").removeClass().addClass('document_tree')
	
	$("#document_tree").bind("contextmenu", function(e) {
		return false;
	});
	
	$(function() {
		$("div").each( function() {
			var props = $(this).data('props')
			if(check_tag(props, 'collapsed')) {
				$(this).hide()
				set_collapse('#' + $(this).data('main'))
			}
			if(check_tag(props, 'locked')) $(this).attr('contenteditable', false)
		});
	});
	
	$(function() {
		$('.nothon_math').each( function() { $(this).html($(this).attr('alt')) })
	});
});

$(function() {
	$('#new_notebook_dialog').dialog({
		dialogClass: 'no-close ui-dialog',
		autoOpen: 	false,
		height:		100,
		width:		400,
		modal:		true,
		title:		'New notebook',
		draggable:	true,
		hide:		'fade',
		buttons:	{
			'Create' : function(){ create_new_notebook() },
			'Cancel' : function(){ $(this).dialog('close')}
		}
	});
});

function create_new_notebook() {
	var notebook_address = $('#new_notebook').val()
	if(notebook_address.length == 0) return
	if(notebook_address.indexOf('.note') != notebook_address.length - 6) notebook_address += '.note'
	save()
	window.location.href = "?name=" + notebook_address
}

function open_new_notebook_dialog() {
	// TODO: move focus to dialog
	$('#new_notebook_dialog').dialog('open')
}

function new_notebook_keypress(event) {
	if(event.which === 13) {
		create_new_notebook()
		return false
	}
	return true
}

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

function set_collapse(id) {
	var elem = $(id).find('.button_expand').each(function() {
		$(this).children().attr('src', '/static/icons/expand.png')
	})
}

function redirect(address) {
	self.location = address
}

function toggle_context_menu() {
	$('#context_menu').toggle()
}

function collapse_collapsible(target) {
	var state = 'visible'
	$('#' + target.id.replace('expand_', '')).find('*').each(function() {
		if($(this).data('expand') === target.id) {
			$(this).toggle()
			if(!$(this).is(':visible')) {
				state = 'hidden'
			}
		}
	})
	if(state === 'hidden') {
		$('#' + target.id).children().attr('src', '/static/icons/expand.png')
	}
	else {
		$('#' + target.id).children().attr('src', '/static/icons/collapse.png')
	}
	return state
}

function topmenu_hide() {
	if($('#top_menu').css('top') == '0px') {
		$('#top_menu').css('top', '-=20px')
	}
}

function topmenu_over() {
	if($('#top_menu').css('top') == '-20px') {
		$('#top_menu').css('top', '+=20px')
	}
}

function topmenu_toggle() {
	if($('#top_menu').css('top') == '0px') {
		$('#top_menu').css('top', '-=20px')
	} else {
		$('#top_menu').css('top', '+=20px')
	}
}

function expand_collapse_all(action) {
	$('div[id^="expand_"]').each(function() {
		var target = $(this).attr('id')
		if(action == 'expand') { $(this).children().attr('src', '/static/icons/collapse.png') }
		else { $(this).children().attr('src', '/static/icons/expand.png') }
		$('#' + target.replace('expand_', '')).find('*').each(function() {
			if($(this).data('expand') == target) {
				if(action == 'expand') { $(this).show() }
				else { $(this).hide() }
			}
		})
	})
}

function trashbin_image_toggle() {
	$('#trash_image').toggle()
}

function toggle_trashbin() {
	$('#trash').toggle()
}

function toggle_all() {
	trashbin_image_toggle()
	topmenu_toggle()
	toggle_context_menu()
	toggle_document_tree()
}

function create_and_insert2(target) {
	console.log(target.innerHTML.toLowerCase())
	
}

function lock_cell(cell) {
	var _main = $(cell).closest('div[id*="_main_"]')
	$(_main).find('*').each( function() {
		if($(this).attr('contenteditable')) {
			$(this).attr('contenteditable', false)
			$(this).data('props', add_tag($(this).data('props'), 'locked'))
		}
	})
	return false
}

function usage() {
	window.open('?name=help.html', 'nothon quick help', 'left=20, top=20, width=500, height=500, toolbar=0, location=0, menubar=0, resizable=0')
}

function get_insertion_position() {
	if(active_div && $.contains($('#docmain')[0], active_div)) {
		return $(active_div).data('main')
	}
	else {
		if($('#docmain').is(':empty')) return false
		return $('#docmain').children(':last').attr('id')
	}
}

function activate_element(element) {
	// This should pass jQuery reference instead!
	var elem = document.getElementById(element)
	elem.focus()
	$(elem).scrollTop()
	return elem
}
