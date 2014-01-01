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
	var uuid = $(event.target).parent().attr('id')
	// Bail out immediately, if clicked on header	
	if(!uuid) {
		// TODO: clean up tabs
		$('#docmain').html('')
		set_group('00000')
		set_stars(1)
		return false
	}
	$('#docmain').data('id', uuid)
	$('#publication_list tr.active_row').removeClass('active_row')
	$('#' + uuid).addClass('active_row')
	console.log(bibliography[uuid]['key'])
	// TODO: send save to server
	//var message = bib_message('save')
	fill_in_fields(uuid)
	return false
}

function fill_in_fields(uuid) {
	$('#bibliography_fields input').each( function() {
		var id = $(this).attr('id').replace('text_', '')
		if(bibliography[uuid][id]) {
			$(this).val(bibliography[uuid][id])
		} else {
			$(this).val('')
		}
	})
	if(bibliography[uuid]['key']) {
		$('#field_id').text(uuid + ': ' + bibliography[uuid]['key'])
	} else {
		$('#field_id').text(uuid)
	}
	if(!bibliography[uuid]['group']) {
		bibliography[uuid]['group'] = 0
	}
	set_group(100000 + parseInt(bibliography[uuid]['group']))
	
	if(!bibliography[uuid]['stars']) {
		bibliography[uuid]['stars'] = 1
	}
	set_stars(bibliography[uuid]['stars'])
}

function set_group(group) {
	$('#group_label').text(('' + group).slice(-5))
	for(i=5; i >= 1; i--) {
		if(group & 1) {
			$('#group_' + i).prop('checked', true)
		} else {
			$('#group_' + i).prop('checked', false)
		}
		group /= 10
	}
}

function set_stars(stars) {
	$('#star_' + stars).prop('checked', true)
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

function toggle_notes() {
	$('#notes_tab').toggle()
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

function group_changed() {
	var id = $('#docmain').data('id')
	var num = 0
	var mult = 1
	for(i=5; i >= 1; i--) {
		if($('#group_' + i).prop('checked')) {
			num += mult
		}
		mult *= 10
	}	
	$('#group_label').text(('00000' + num).slice(-5))
	bibliography[id]['group'] = ('00000' + num).slice(-5)
	// TODO: if group is in the bibliography table, we have to update that, too
	return false
}

function stars_changed() {
	var id = $('#docmain').data('id')
	bibliography[id]['stars'] = parseInt($('input[name=stars]:checked').attr('id').slice(-1))
	// TODO: if stars is in the bibliography table, we have to update that, too
	return false
}
