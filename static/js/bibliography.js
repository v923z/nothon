$(document).ready(function () {
	$(function(){
		$('#publication_list').tablesorter({
			widgets        : ['zebra', 'resizable', 'stickyHeaders', 'scroller'],
			usNumberFormat : false,
			sortReset      : true,
			sortRestart    : true,
			widthFixed		: true,
			widgetOptions : {
				scroller_height : 100,
				scroller_width : 20,
				scroller_jumpToHeader: true,
				scroller_idPrefix : 's_'
			}
		}).click(function(event) {
			activate_element(event)
		});
	});
	$('#notes_tab').tabs();
	$('#aside_switch').click(function (event) {
		var posY = $(this).position().top;
		$('#publication_list > tbody').height(event.pageY - posY + $('#publication_list > theader').height())
		$('#publication_list').height($('#publication_list > tbody').height() + $('#publication_list > thead').height())
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
		$(target)
		.find('tbody')
		.append(empty_row(target, type))
		.trigger("applyWidgets") 
		return false;
}

function empty_row(target, type) {
	var columns = count_columns(target)
	var row = '<tr id="' + generate_uuid() + '"><td>' + count_rows(target) + '</td>' + '<td>' + type + '</td>' 
	// TODO: find out, which one is the 'type' column
	for(i=0; i < columns-2; i++) {
		row += '<td></td>'
	}
	return row + '</tr>'
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
	$('#notes_tab').show()
	$('#publication_list').height(200)
	console.log($(event.target).parent().attr('id'))
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
