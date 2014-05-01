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
	var $pos = $('#' + $(active_div).data('main'))
	if(where == 'up' && !$pos.is('#docmain :first')) {
		$pos.after($pos.prev())
	}
	if(where == 'down' && !$pos.is('#docmain :last')) {
		$pos.before($pos.next())
	}
	active_div.focus()
}

function get_index(obj) {
	var num = obj.split("_")
	return parseInt(num[num.length-1])
}

function get_num(divide) {
	return get_index(divide.id)
}

function get_max_index(className) {
	var num = 0
	$('.' + className).each( function() {
		if(num < get_index($(this).attr('id'))) num = get_index($(this).attr('id'))
	})
	return num
}

function _create_message(command) {
	var message = new Object()
	message.date = Date()
	message.command = command
	message.doc_title = document.title
	message.type = $('body').data('type')
	message.sub_type = $('#docmain').data('sub_type')
	message.file = $('body').data('file')
	message.directory = $('#div_dir').html().replace('<br>', '')
	return message
}

function create_message(div_data, command) {
	var message = _create_message(command)
	message.id = div_data.id
	message.content = div_data.innerHTML
	return message
}

function message_handler(req) {
	var message = JSON.parse(req.responseText)
	console.log(message)
	for(elem in message) {
		if($('#' + elem).is('textarea')) {
			$('#' + elem).val(message[elem])
		} else {
			$('#' + elem).html(message[elem])
		}
	}
	// TODO: scrolling is not quite perfect
	if(message["scroller"]) {
		$('#' + message["scroller"]).scrollTop()
	}
}

function set_active(id) {
	active_div = id
	eval($(id).data('type') + '_context_menu()')
	var main = '#' + $(id).data('main')
	$('#document_contents').find('li > a').each(function() {
		$(this).removeClass('currently_active')
		if($(this).attr('href') == main) $(this).addClass('currently_active')
	})
}

function block_content(elem) {
	var block = new Object()

	block.type = $(elem).data('type')
	block.count = $(elem).data('count')
	block.id = $(elem).attr('id')
	block.content = {}
	$(elem).children().each( function() {
		if($(this).parent().get(0) === $(elem).get(0)) {
			if($(this).data('save')) {
				var sub_block = new Object()
				if($(this).is('textarea')) sub_block.content = $(this).val()
				else sub_block.content = $(this).html()
				sub_block.id = $(this).attr('id')
				if($(this).is(':visible')) sub_block.collapsed = false
				sub_block.searchable = $(this).data('searchable')
				if($(this).data('toc')) sub_block.toc = true
				block.content[$(this).attr('class')] = sub_block
			}
		}
	})
	eval('block = ' + block.type + '_sanitise(block)')
	return block
}

function get_divs() {
	var content = new Array()
	$("#docmain").children("div[class*='_main']").each( function() {			
			content.push(block_content($(this)))
		}
	);
	return content
}

function save_handler(req) {
	var message = JSON.parse(req.responseText)
	if(message['success'] == 'success') {
		var time = new Date()
		$('#notebook_status').html('Saved at ' + time.toTimeString().split(' ')[0])
	} else {
		alert(message['success'])
	}
}

function _save(method) {
	if(window.location.href.indexOf('?name=__timeline') > 0 || 
		window.location.href.indexOf('?name=__toc') > 0 ||
		window.location.href.indexOf('?name=__bibliography') > 0) {
		return null
	}
	var message = _create_message(method)
	return message
}

function save_notebook(method) {
	var message = _save(method)
	if(message == null) return
	
	full_notebook['notebook'] = get_divs()
	full_notebook['_metadata']['date'] = Date()
	full_notebook['_metadata']['title'] = $('#div_title').html()
	message['full_notebook'] = full_notebook
	// TODO: we might have to track the type of the parent document (bibliography etc.)
	message.type = 'notebook'
	message.file = $('#docmain').data('file')
	xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message, null, 4), save_handler)
}

function save_html(target) {
	var message = create_message('', "savehtml")
	message.outfile = document.title
	message.title = document.getElementById("div_title").innerHTML
	message.content = document.getElementById('docmain').innerHTML
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), save_handler)
	// This is broken for now...
    //$(target).parent().hide()
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
	generate_toc()
	$('#context_menu').html('')
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
			save_notebook('save')
			window.location.href = 'http://127.0.0.1:8080/?name=' +  calendar_path(date.valueOf()[0]) + '.note'
		}
	});
	
	$('#notebook_tab').tabs();
	$(function() { generate_toc() })
	
	$(function() {
		$("#document_tree").dynatree({
			persist: true,
			onActivate: function(node) {
				save_notebook('save')
				window.location.href = "?name=" + node.getKeyPath().slice(1)
				return false
			}
		});
	});
	$("#document_tree").removeClass().addClass('document_tree')
	
	$("#document_tree").bind("contextmenu", function(e) {
		return false;
	});
	
	// We do the rendering here
	var notebook = full_notebook['notebook']
	$('#div_title').html(full_notebook._metadata.title)
	for(i in notebook) {
		eval(notebook[i].type + '_render(notebook[i])')
	}
	
	// TODO: this has to be done in the loop above.
	//$(function() {
		//$("div").each( function() {
			//var props = $(this).data('props')
			//if(check_tag(props, 'collapsed')) {
				//$(this).hide()
				//set_collapse('#' + $(this).data('main'))
			//}
			//if(check_tag(props, 'locked')) $(this).attr('contenteditable', false)
		//});
	//});
	
	$(function() {
		$('.nothon_math').each( function() { $(this).html($(this).attr('alt')) })
	});
	$('#docmain').delegate('.nothon_math', 'click', function() {
		unwrap_math($(this))
	})	
});

$(function() {
	$('#new_notebook_dialog').dialog({
		dialogClass: 'no-close ui-dialog',
		autoOpen: 	false,
		height:		150,
		width:		400,
		modal:		true,
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
	if($('body').data('type') == 'notebook') save_notebook('save')
	if($('body').data('type') == 'bibliography') save_bibliography('save_bibnote')	
	window.location.href = "?name=" + notebook_address
}

function open_new_notebook_dialog(title) {
	// TODO: move focus to dialog
	$('#new_notebook_dialog').dialog('open')
	$('#new_notebook_dialog').dialog({title: title})	
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
    if($('body').data('type') == 'notebook') save_notebook('save')
    else if($('body').data('type') == 'bibliography') save_bibliography('save_bibnote')    
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

function lock_cell(cell) {
	var _main = $(cell).closest('div[id*="_main_"]')
	$(_main).find('*').each( function() {
		if($(this).attr('contenteditable')) {
			$(this).attr('contenteditable', false)
		}
	})
	return false
}

function usage() {
	window.open('?name=help.html', 'nothon quick help', 'left=20, top=20, width=500, height=500, toolbar=0, location=0, menubar=0, resizable=0')
}

function add_new_cell(html) {
	if($('#docmain').is(':empty')) {
		$('#docmain').prepend(html)
	} else {
		$('#docmain').children(':last').after(html)
	}
}

function insert_new_cell(html, to_activate) {
	if(active_div && $.contains($('#docmain')[0], active_div)) {
		$('#' + $(active_div).data('main')).after(html)		
	}
	else {
		add_new_cell(html)
	}
	generate_toc()
	set_active(document.getElementById(to_activate))
	$('#' + to_activate).focus()
	$('#' + to_activate).scrollTop()
}

function generate_toc() {
	var code = '<ul id="#contents_list">'
	$('#docmain').children().each( function() {
		$(this).children().each( function() {
			if($(this).data('toc')) {
				var text = $(this).text()
				if(text.length > 0) {
					code = code + '<li><a class="contents_link" href="#' + $(this).data('main') + '">' + cut_intoc(text) + '</a></li>'
				} else {
					code = code + '<li><a class="contents_link missing_title" href="#' + $(this).data('main') + '">' + $(this).data('main') + '</a></li>'
				}
			}
		})
	})
	code = code + '</ul>'
	$('#document_contents').html(code)
}

function cut_intoc(string) {
	if(string.length > 20) return string.slice(0, 20) + '...'
	return string
}

function toggle_calendar() {
	$('#calendar').toggle()
}

function save_notebook_as(method) {
	if(method == 'save_notebook_as') {
		var title = 'Save notebook as ...'
	} else if(method == 'rename_notebook') {
		var title = 'Rename notebook ...'
	}
	else return
	$('#new_notebook_dialog').dialog('open')
	$('#new_notebook_dialog').dialog({
		title: title, 
		buttons:	{
			'Save' : function(){ _save_notebook_as(method) },
			'Cancel' : function(){ $(this).dialog('close')}
		}
	})
}

function _save_notebook_as(method) {
	var notebook_address = $('#new_notebook').val()
	if(notebook_address.length == 0) return
	if(notebook_address.indexOf('.note') != notebook_address.length - 6) notebook_address += '.note'
	var message = _save('save')
	if(message == null) return
	message.title = $('#div_title').html()
	message.notebook = get_divs()
	message.sub_command = method
	message.notebook_address = notebook_address
	xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message, null, 4), save_as_handler)
}

function save_as_handler(req) {
	var message = JSON.parse(req.responseText)
	if(message['success'] == 'success') {
		window.location.href = "?name=" + message['notebook_address']
	} else {
		alert(message['success'])
	}
}

$(function() {
	$('#cell_dialog').dialog({
		dialogClass: 'no-close ui-dialog',
		autoOpen: 	false,
		height:		250,
		width:		900,
		modal:		false,
		draggable:	true,
		hide:		'fade',
		buttons:	{
			'Cancel' : function(){ $(this).dialog('close')}
		}
	});
});

function popout_cell() {
	if(!active_div) return false
	$('#cell_dialog_content').html($('#' + $(active_div).data('main')).html())
	$('#cell_dialog_content').find('*').each(function() {
		if($(this).attr('id')) {
			$(this).attr('id', $(this).attr('id') + '_popout')
		}
	})
	console.log($('#cell_dialog_content').html())
	$('#cell_dialog').dialog('open')
	return false
}
