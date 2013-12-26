$(document).ready(function () {
	$(function(){
		$('#publication_list').tablesorter({
			widthFixed		: true,
			showProcessing: true,
			headerTemplate : '{content} {icon}',
			widgets        : ['zebra', 'scroller', 'filter'],
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
	$('#aside_switch').click(function (event) {
		var posY = $(this).position().top;
		//$('#publication_list > tbody').height(event.pageY - posY + $('#publication_list > theader').height() + 20)
		$('#publication_list').height(100)
		//$('#publication_list > tbody').height() + $('#publication_list > thead').height()+20)
		// TODO: here we should check, whether the new size is larger than what we actually need...
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

function bibliography_side_position(event) {
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
		}
		else {
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
	$('#publication_list tr.active_row').removeClass('active_row')
	$('#' + $(event.target).parent().attr('id')).addClass('active_row')
	var message = bib_message()
	
	$('#notes_tab').tabs('option', 'active', 1)
	// TODO: display the proper entry here.
	return false
}

function generate_uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

function toggle_publication_list() {
	$('#publication_list').toggle()
}

function tabs_activated(event, ui) {
	if(ui.oldTab.index() == 1) {
		var rowId = $('#publication_list tr.active_row').first().attr('id')
		$('#bibliography_fields input').each( function() {
			var id = $(this).attr('id').replace('text_', '')
			console.log(id)
		})
	}
}

function insert_in_row(rowId, columnId, what) {
	
}

function bib_message(command) {
	var message = new Object()
	message.command = command
	message.document_type = $(body).data('type')
	message.file = $(body).data('file')
	message.directory = $('#div_dir').html().replace('<br>', '')
	message.doc_title = document.title
	return message
}
