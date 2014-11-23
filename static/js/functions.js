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

function scrollto(elem) {
	elem[0].scrollIntoView(true)
}

function move(where) {
	var $active = get_active_cell()
	if(!$active) return
	
	var $main = $('#' + $active.data('main'))
	if(where == 'up') {
		$main.after($main.prev())
	}
	if(where == 'down') {
		$main.before($main.next())
	}
	scrollto($main)
	$active.focus()		// This doesn't work!
}

function _create_message(command) {
	var message = new Object()
	var aux = new Object()
	message.date = Date()
	message.command = command
	message.type = $('body').data('type')
	message.sub_type = $('#docmain').data('sub_type')
	message.file = $('body').data('file')
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
	$('body').attr({'data-active': id})
	if(id === null) {
		$('#context_menu').html('')
		return
	}
	$('#' + id).data('menu')()
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
	block.created = $(elem).data('created')
	block.modified = $(elem).data('modified')
	
	//block.id = $(elem).attr('id')
	block.content = {}
	$(elem).children().each( function() {
		if($(this).parent().get(0) === $(elem).get(0)) {
			if($(this).data('save')) {
				var sub_block = new Object()
				if($(this).is('textarea') || $(this).is('input')) sub_block.content = $(this).val()
				else sub_block.content = $(this).html()
				//sub_block.id = $(this).attr('id')
				if($(this).is(':visible')) sub_block.collapsed = "false"
				if($(this).data('searchable')) sub_block.searchable = "true"
				if($(this).data('toc')) sub_block.toc = "true"
				block.content[$(this).attr('class')] = sub_block
			}
		}
	})
	console.log(block)
	if(block.type === 'plot' || block.type === 'code') {
		block = $(elem).data('sanitise')(block)
	} else {
		eval('block = ' + block.type + '_sanitise(block)')
	}
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
		var date = new Date()
		$('#notebook_status').html('Saved at ' + date.toTimeString().split(' ')[0])
	} else {
		alert(message['success'])
	}
	if(message.aux) {
		var aux = message.aux
		if(aux['redirect']) {
			window.location.href = aux['redirect']
		}
	}
}

function _save(method) {
	// These cannot be saved, so we bail out immediately
	if(window.location.href.indexOf('?name=__timeline') > 0 || 
		window.location.href.indexOf('?name=__toc') > 0 ||
		window.location.href.indexOf('?name=__bibliography') > 0) {
		return null
	}
	var message = _create_message(method)
	return message
}

function save_notebook(method, aux) {
	var message = _save(method)
	if(message == null) return
	
	full_notebook['notebook'] = get_divs()
	full_notebook['_metadata']['date'] = Date()
	full_notebook['_metadata']['title'] = $('#div_title').html()
	message['full_notebook'] = full_notebook
	// TODO: we might have to track the type of the parent document (bibliography etc.)
	message.type = 'notebook'
	message.file = $('#docmain').data('file')
	if(typeof(aux) === 'undefined') { aux = null }
	message.aux = aux
	xml_http_post(server_address, JSON.stringify(message, null, 4), save_handler)
}

function save_html(target) {
	var message = create_message('', "savehtml")
	message.outfile = document.title
	message.title = document.getElementById("div_title").innerHTML
	message.content = document.getElementById('docmain').innerHTML
    xml_http_post(server_address, JSON.stringify(message), save_handler)
	// This is broken for now...
    //$(target).parent().hide()
}

function delete_cell() {
	var $active = get_active_cell()
	if($active) {
		$('#trash').prepend(get_active_main())
	}
	document.getElementById('trash_image').style.backgroundImage = 'url(static/css/trashbin_full.png)'
	generate_toc()
	set_active(null)
}

function recover_cell() {
	if(get_active_main_in_trash()) {
		$('#docmain').append(get_active_main_in_trash())
	}
	if(document.getElementById('trash').childNodes.length == 1) {
		document.getElementById('trash_image').style.backgroundImage = 'url(static/css/trashbin_empty.png)'
	}
}
function raw_date(date) {
	var month = (100 + date.getMonth() + 1).toString().slice(1,3)
	var day = (100 + date.getDate()).toString().slice(1,3)
	return date.getFullYear() + '.'+ month + '.' + day
}

$(document).ready(function () {	
	var date = new Date()
	console.log()
	
	$('#calendar').datepick({
		dateFormat: 'yyyy-mm-dd',
		onSelect: function(date) {
			var aux = new Object()
			aux['command'] = 'new_notebook'
			aux['type'] = 'calendar'			
			aux['raw_date'] = raw_date(date.valueOf()[0])
			aux['file'] = calendar_path(date.valueOf()[0]) + '.note'
			aux['redirect'] = server_address + '?name=' +  aux['file']
			save_notebook('save', aux)
		}
	});
	
	$('#notebook_tab').tabs();
	$(function() { generate_toc() })
	
	$("#document_tree").fancytree({
		extensions: ["persist"],
		activate: function(event, data) {
			if(data.node.isFolder()) {
				data.node.toggleExpanded()
				return false
			}
			return true
		},
		click: function(event, data) {
			if(data.node.isFolder()) {
				data.node.toggleExpanded()
				return false
			} else {
				if(window.location.href.indexOf('?name=')  != -1) {
					save_notebook('save')
				}
				window.location.href = data.node.key
			}
			return true
		}
	})
	$("#document_tree").removeClass().addClass('document_tree')
	
	//$("#document_tree").bind("contextmenu", function(e) {
		//return false;
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
		$('#article').addClass('article_expanded')
		$('#aside_switch').html('>>')
	} else {
		$('#aside').css('display', 'block')
		$('#article').removeClass('article_expanded')
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
	return false
}

function collapse_collapsible(target) {
	//var state = 'visible'
	//$('#' + target.id.replace('expand_', '')).find('*').each(function() {
		//if($(this).data('expand') === target.id) {
			//$(this).toggle()
			//if(!$(this).is(':visible')) {
				//state = 'hidden'
			//}
		//}
	//})
	//if(state === 'hidden') {
		//$('#' + target.id).children().attr('src', '/static/icons/expand.png')
	//}
	//else {
		//$('#' + target.id).children().attr('src', '/static/icons/collapse.png')
	//}
	//return state
}

function topmenu_hide() {
	if($('#top_menu').css('top') == '0px') {
		$('#top_menu').css('top', '-=20px')
	}
	return false
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
	return false
}

function toggle_trashbin() {
	$('#trash').toggle()
	return false
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

function insert_new_cell(cell, to_activate) {
	var $active = get_active_cell()
	if($active) {
		get_active_main().after(cell)
	}
	else {
		add_new_cell(cell)
	}
	generate_toc()
	$('#' + to_activate).focus()
	$('#' + to_activate)[0].scrollIntoView(true)
	var cdate = $('#' + to_activate).data('main')
	$('#' + cdate).attr({'created': get_date()})
}

function get_active_cell() {
	var active = $('body').attr('data-active')
	if(active && $('#docmain').has('#' + active).length) {
		return $('#' + active)
	} else {
		return null
	}
}

function get_active_main() {
	if(get_active_cell()) {
		return $('#' + get_active_cell().attr('data-main'))
	} else {
		return null
	}
}

function get_active_main_in_trash() {
	var active = $('body').attr('data-active')
	if(active && $('#trash').has('#' + active).length) {
		return $('#' + $('#' + active).attr('data-main'))
	} else {
		return null
	}
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
	xml_http_post(server_address, JSON.stringify(message, null, 4), save_as_handler)
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
	if(!get_active_main()) return false
	$('#cell_dialog_content').html(get_active_main().html())
	$('#cell_dialog_content').find('*').each(function() {
		if($(this).attr('id')) {
			$(this).attr('id', $(this).attr('id') + '_popout')
		}
	})
	$('#cell_dialog').dialog('open')
	return false
}

function generate_cell_id() {
	// Generates a new ID for a newly created cell
	// Produces a string of the form time-rand
	// where the time is the time (to ms) since the Epoch
	// and rand is a 6-digit random number
	var t = new Date()
	return t.getTime() + '-' + (Math.round(Math.random()*1e6 + 1e6) + '').slice(1)
}

function check(what) {
	// Returns an empty string, even if the object doesn't exist
	if(typeof(what) === 'undefined') return ''
	else return what.content
}

function get_date() {
	// Convenience function
	var t = new Date()
	return t.toString()
}

function insert_modified(target) {
	var main = $(target).data('main')
	$('#' + main).data('modified', get_date())
}

function add_modified_created(target, json) {
	var modified = '', created = ''
	if(json.modified) modified = json.modified
	if(json.created) created = json.created
	$(target).data({'modified': modified, 'created': created})
}
