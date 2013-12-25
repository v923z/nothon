$(document).ready(function () {
	$(function(){
		$('#publication_list').tablesorter({
			widgets        : ['zebra', 'resizable'],
			usNumberFormat : false,
			sortReset      : true,
			sortRestart    : true
		}).click(function(event) {
			activate_element(event)
		});
	});
	$('#notes_tab').tabs();
})

function bibliography_side_switch() {
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
	return $(target + ' > tbody > tr').length;
}
function new_entry(target, link) {
	add_row(target, link.innerHTML.toLowerCase())
}

function activate_element(event) {
	console.log($(event.target).parent().attr('id'))
}

function generate_uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

