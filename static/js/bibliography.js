$(document).ready(function () {
	$(function() {
		var message = _create_message('bibliography')
		message['sub_command'] = 'get_bibliography'
		xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), get_bibliography_handler)
	})

	$(function(){
		$('#publication_list').tablesorter({
			widthFixed		: true,
			showProcessing: true,
			headerTemplate : '{content} {icon}',
			widgets        : ['zebra', 'scroller', 'filter', 'resizable'],
			widgetOptions : {
				scroller_height : 100,
				scroller_width : 17,
				scroller_jumpToHeader: true,
				scroller_idPrefix : 's_'
			}
		}).click(function(event) {
			activate_element(event)
		});
	});
	$('#notes_tab').tabs({ 
		activate: function(event, ui) { tabs_activated(event, ui) }
	});
})

function bibliography_side_switch() {
	if($('#aside').css('display') == 'block') {
		$('#aside').css('display', 'none')
		// TODO: find out how to retrieve default properties
		$('#article').css('width', '98%')
		$('#aside_switch_container').html('>>')
	}
	else {
		$('#aside').css('display', 'block')
		$('#article').css('width', '78%')
		$('#aside_switch_container').html('<<')
	}
}

function add_row(target, type) {
	$('#publication_list tr.active_row').removeClass('active_row')
	var uuid = generate_uuid()
	var columns = count_columns(target)
	var row = '<tr id="' + uuid + '"><td>' + count_rows(target) + '</td>'
	
	for(i=2; i <= columns; i++) {
		var header = $('#publication_list th:nth-child(' + i + ')').text().trim().toLowerCase()
		if(header == 'type') {
			row += '<td id="' + uuid + '-' + header + '">' + type + '</td>'
		} else {
			row += '<td id="' + uuid + '-' + header + '"></td>'
		}
	}
	row += '</tr>'
	$(target)
	.find('tbody')
	.append(row)
	.trigger("applyWidgets")
	$('#' + uuid).addClass('active_row')
	$('#notes_tab').tabs('option', 'active', 1)
	return false;
}

function count_columns(target) {
	return $(target).find('tr')[0].cells.length
}

function count_rows(target) {
	// We add one here, because otherwise papers are counted from 0!
	return $(target + ' > tbody > tr').length+1;
}

function new_entry(target, link) {
	add_row(target, link.innerHTML.toLowerCase())
}

function activate_element(event) {
	// Bail out immediately, if clicked on header
	if($('#publication_list thead').has(event.target)) return false
	
	var uuid = $(event.target).parent().attr('id')
	$('#publication_list tr.active_row').removeClass('active_row')
	$('#' + uuid).addClass('active_row')
	// TODO: send save to server
	//var message = bib_message('save')
	$('#bibliography_fields input').each( function() {
		var id = $(this).attr('id').replace('text_', '')
		if(bibliography[uuid][id]) {
			$(this).val(bibliography[uuid][id])
		} else {
			$(this).val('')
		}
	})
	return false
}

function generate_uuid() {
	var tmp = new Array()
	for(i in bibliography) {
		tmp.push(parseInt(i))
	}
	// This is rather primitive: we should find the smallest unused integer. Some nifty trick, Lukas?
	return Math.max.apply(null, tmp) + 1
}

function toggle_publication_list() {
	$('#publication_list').toggle()
}

function tabs_activated(event, ui) {
	if(ui.oldTab.index() == 1) {
		var uuid = $('#publication_list tr.active_row').first().attr('id')
		for(i=2; i <= count_columns('#publication_list'); i++) {
			var header = $('#publication_list th:nth-child(' + i + ')').text().trim().toLowerCase()
			if($('#text_' + header)) {
				var value = $('#text_' + header).val()
			} else {
				var value = ''
			}
			$('#' + uuid + '-' + header).html(value)
		}

		$('#bibliography_fields input').each( function() {
			var id = $(this).attr('id').replace('text_', '')
			bibliography[uuid][id] = $(this).val()
		})
	}
}

function get_bibliography_handler(req) {
	var message = JSON.parse(req.responseText)
	bibliography = message['bibliography']
}

function save_bibliography(method) {
	var message = _save(method)
	message.bibliograhy = bibliography
	xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message, null, 4), save_handler)
}
