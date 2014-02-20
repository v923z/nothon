$(document).ready(function () {	
	$('#publication_list > tbody').html(populate_publication_list(bibliography))

	$(function(){
		$('#publication_list').tablesorter({
			initialized: function(){ count_publications() },
			widthFixed		: true,
			showProcessing: true,
			headerTemplate : '{content} {icon}',
			widgets        : ['zebra', 'scroller', 'filter', 'resizable'],
			widgetOptions : {
				scroller_height : 300,
				scroller_width : 17,
				scroller_jumpToHeader: true,
				scroller_idPrefix : 's_',
			// e = exact text from cell
			// n = normalized value returned by the column parser
			// f = search filter input value
			// i = column index
			filter_functions : {
				2 : function(e, n, f, i) {
						var celltext = remove_diacritics(e).toLowerCase()
						var filtertext = remove_diacritics(f).toLowerCase()
						return  celltext.indexOf(filtertext) > -1 ? true : false
					}
				}
			}
		}).click(function(event) {
			activate_element(event)
		}).on('filterEnd', function () {
			count_publications()
		});
		//$('#bibliography_panes').splitter({
			//splitHorizontal: true,
			//sizeTop: true,
		//});
	});
	$('#notes_tab').tabs({ 
		activate: function(event, ui) { tabs_activated(event, ui) }
	});
	$('#field_file_button').click(function() {
		$('#input_file').click();   
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

function generate_row(target, type, uuid, count) {
	var columns = count_columns(target)
	var row = '<tr id="' + uuid + '"><td>' + count + '</td>'
	
	for(i=2; i <= columns; i++) {
		var header = $('#publication_list th:nth-child(' + i + ')').text().trim().toLowerCase()
		if(header == 'type') {
			row += '<td id="' + uuid + '-' + header + '">' + type + '</td>'
		} else {
			row += '<td id="' + uuid + '-' + header + '"></td>'
		}
	}
	row += '</tr>'
	return row
}

function add_row(target, type) {
	$('#publication_list tr.active_row').removeClass('active_row')
	var uuid = generate_uuid()
	var entry = new Object()
	entry['type'] = type
	bibliography[uuid] = entry
	set_active_paper(uuid)	
	var row = generate_row(target, type, uuid, count_rows(target))
	$(target).find('tbody').append(row).trigger("applyWidgets")
	$('#' + uuid).addClass('active_row')
	// Activate the first fields tab
	$('#notes_tab').tabs('option', 'active', 1)

	fill_in_fields(uuid)
	fill_in_row(uuid)
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

function change_to_entry(target, link) {
	var uuid = get_active_paper()
	// Bail out immediately, if no active entry
	if(uuid.length == 0) {
		alert('No active entry found')
		return false
	}
	bibliography[uuid]['type'] = link.innerHTML.toLowerCase()
	fill_in_row(uuid)
	set_paper_info(uuid)
}

function activate_element(event) {
	//if($(event.target).attr('id').indexOf('-author') != -1) return false
	var uuid = $(event.target).parent().attr('id')
	// Bail out immediately, if clicked on header
	if(!uuid) {
		return false
	}
	var id = get_active_paper()
	// TODO: send save to server, get notebook from disc
	save_and_load(uuid)
	set_active_paper(uuid)
	$('#publication_list tr.active_row').removeClass('active_row')
	$('#' + uuid).addClass('active_row')
	console.log(bibliography[uuid]['key'])
	fill_in_fields(uuid)
	return false
}

function _fill_in_fields(dom, uuid) {
	var id = $(dom).attr('id').replace('text_', '')
	if(bibliography[uuid][id]) {
		$(dom).val(bibliography[uuid][id])
	} else {
		bibliography[uuid][id] = ''
		$(dom).val('')
	}
}

function fill_in_fields(uuid) {
	// This is the inverse of fill_in_bibliography
	$('#bibliography_fields input[type=text]').each( function() {
		_fill_in_fields(this, uuid)
	})
	$('#bibliography_fields2 input[type=text]').each( function() {
		_fill_in_fields(this, uuid)
	})
	set_paper_info(uuid)
	if(!bibliography[uuid]['group']) {
		bibliography[uuid]['group'] = '00000'
	}
	set_group(bibliography[uuid]['group'], uuid)
	
	if(!bibliography[uuid]['stars']) {
		bibliography[uuid]['stars'] = 1
	}
	set_stars(bibliography[uuid]['stars'])
}

function fill_in_row(uuid) {
	for(i=2; i <= count_columns('#publication_list'); i++) {
		var key = $('#publication_list th:nth-child(' + i + ')').text().trim().toLowerCase()
		$('#' + uuid + '-' + key).html(bibliography[uuid][key])
	}
}

function fill_in_bibliography(uuid) {
	// This is the inverse of fill_in_fields
	for(i=2; i <= count_columns('#publication_list'); i++) {
		var key = $('#publication_list th:nth-child(' + i + ')').text().trim().toLowerCase()
		if($('#text_' + key)) {
			var value = $('#text_' + key).val()
		} else {
			var value = ''
		}
		bibliography[uuid][key] = value
	}
}

function set_group(group, id) {
	$('#group_label').text(('00000' + group).slice(-5))
	bibliography[id]['group'] = ('00000' + group).slice(-5)
	fill_in_row(id)
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

function set_paper_info(uuid) {
	if(!bibliography[uuid]['key']) bibliography[uuid]['key'] = 'no key'
	if(!bibliography[uuid]['type']) bibliography[uuid]['type'] = 'no type'
	$('#info_id').text(uuid + ': ' + bibliography[uuid]['key'] + ', ' + bibliography[uuid]['type'])
	$('#pdf-link').attr('href', '?file=' + bibliography[uuid]['file'])
	$('#pdf-link').text('File')
	$('#info_title').text(bibliography[uuid]['title'] ? bibliography[uuid]['title'] : 'undefined')
	$('#info_journal').text(bibliography[uuid]['journal'] ? bibliography[uuid]['journal'] + ' ' : '')
	$('#info_volume').text(bibliography[uuid]['volume'] ? bibliography[uuid]['volume'] + ' ' : '')
	$('#info_pages').text(bibliography[uuid]['pages'] ? bibliography[uuid]['pages'] + ' ' : '')
	$('#info_year').text(bibliography[uuid]['year'] ? '(' + bibliography[uuid]['year'] + ')' : '')
}

function generate_uuid() {
	if(Object.keys(bibliography).length == 0) return '1'
	var tmp = new Array()
	for(i in bibliography) {
		tmp.push(parseInt(i))
	}
	// This is rather primitive: we should find the smallest unused integer. Some nifty trick, Lukas?
	return '' + (Math.max.apply(null, tmp) + 1)
}

function toggle_publication_list() {
	$('#publication_list').toggle()
}

function toggle_notes() {
	$('#notes_tab').toggle()
}

function tabs_activated(event, ui) {
	var uuid = get_active_paper()
	if(uuid.length == 0) return false
	if(ui.oldTab.index() == 1 || ui.oldTab.index() == 2) {
		// fields tabs
		$('#bibliography_fields input[type=text]').each( function() {
			var id = $(this).attr('id').replace('text_', '')
			bibliography[uuid][id] = $(this).val()
		})
		$('#bibliography_fields2 input[type=text]').each( function() {
			var id = $(this).attr('id').replace('text_', '')
			bibliography[uuid][id] = $(this).val()
		})
		fill_in_row(uuid)
	}
	if(ui.newTab.index() == 3) {
		// bibtex tab
		$('#textarea_bibtex').val(json_to_bibtex(uuid))
	}
	if(ui.oldTab.index() == 3) {
		// bibtex tab: get the bibtex string, and send it to the server for parsing
		if($('#textarea_bibtex').val().length > 0) parse_bibstring($('#textarea_bibtex').val())
	}	
	set_paper_info(uuid)
}

function get_bibliography_handler(req) {
	var message = JSON.parse(req.responseText)
	if(message['success'] == 'success') {
		bibliography = message['bibliography']
		extra_data = message['extra_data']
	}
	else {
		alert(message['success'])
		bibliography = null
		extra_data = null
	}
}

function group_changed() {
	var id = get_active_paper()
	if(id == null) return false
	var num = 0
	var mult = 1
	for(i=5; i >= 1; i--) {
		if($('#group_' + i).prop('checked')) {
			num += mult
		}
		mult *= 10
	}
	set_group(num, id)
	return false
}

function stars_changed() {
	var id = get_active_paper()
	if(id == null) return false
	bibliography[id]['stars'] = parseInt($('input[name=stars]:checked').attr('id').slice(-1))
	fill_in_row(id)
	return false
}

function field_keypress(event, target) {
	var id = get_active_paper()
	if(id == null) return false
	if(event.which === 13) {
		fill_in_bibliography(id)
		fill_in_row(id)
		$('#' + target).focus()
		return false
	} else {
		return true
	}
}

function generate_timestamp(dom) {
	var date = new Date()
	$(dom).val(date.getFullYear() + '.' + ('0' + (date.getMonth()+1)).slice(-2) + '.' + ('0' + date.getDate()).slice(-2))
	return false
}

function browse() {
	var file_list = $('#text_file').val()
	if(file_list.length > 0) {
		file_list += ', ' + $('#input_file').val()
	} else {
		file_list = $('#input_file').val()
	}
	$('#text_file').val(file_list)
	var id = get_active_paper()
	bibliography[uuid]['file'] = file_list
	return false
}

function set_active_paper(uuid) {
	$('#docmain').data('id', uuid)
	// TODO: I am not sure, whether this is the best way of handling this. 
	bibliography[uuid]['notebook'] = uuid + '.note'
	//if(!bibliography[uuid]['notebook'] || bibliography[uuid]['notebook'].length == 0) {
		//// This would happen, when a new entry is created
	//}
	$('#docmain').data('file', extra_data['folder'] + extra_data['separator'] + bibliography[uuid]['notebook'])
}

function get_active_paper() {
	return $('#docmain').data('id')
}

function save_bibliography(method) {
	var message = _save('bibliography')
	message.sub_type = 'bibliography'
	message.bibliography = bibliography
	message['command'] = method
	xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message, null, 4), save_handler)
}

function save_and_load(id) {
	//var message = _save('bibliography')
	//if(message == null) return
	//message.sub_command = 'save_and_load'
	//message.notebook = get_divs()
	//message.file = $('#docmain').data('file')
	//message.new_notebook = bibliography[id]['notebook']
	//xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message, null, 4), save_and_load_handler)
}

function save_and_load_handler(req) {
}

function find_tag_link(tag) {
	var $ret = null
	$('#biblio_keywords > ul > li > a').each( function() {
		if($(this).text() == tag) $ret = $(this)
	})
	return $ret
}

function array_set(array) {
	var uniqueNames = new Array()
	$.each(names, function(i, el){
		if($.inArray(el, uniqueNames) === -1) uniqueNames.push(el);
	});
	return uniqueNames
}

function get_keywords(uuid) {
	if(bibliography[id]['keywords']) {
		// TODO: this splits only on ','. Should we allow ';', too?
		return bibliography[id]['keywords'].split(',')
	}
	return null
}

function keyword_list(array) {
	var keywords = new Array()
	// Generates the list of keywords on the left hand side
	$('#publication_list > tbody > tr').each( function() {
		var uuid = $(this).attr('id')
		keywords = keywords.concat(get_keywords(uuid))
	})
	keywords = array_set(keywords)
	var li = ''
	for(i in keywords) {
		li += '\n<li><a href="javascript:show_tag(\'' + keywords[i] + '\');">' + keywords[i] + '</a></li>'
	}
	$('#keyword_list').html(li)
}
function show_tag(tag) {
	// Removes all elements from the publication list that do not have 'tag' in their keyword list
	var $link = find_tag_link(tag)
	if(!$link.hasClass('active_filter')) {
		$link.addClass('active_filter')
		$('#publication_list > tbody > tr').each( function() {
			var id = $(this).attr('id')
			var keep = false
			if(bibliography[id]['keywords']) {
				// TODO: this splits only on ','. Should we allow ';', too?
				var keywords = bibliography[id]['keywords'].split(',')
				for(i in keywords) {
					if(tag == keywords[i].trim()) keep = true
				}
			}
			if(!keep) $(this).remove()
		})
		count_publications()
		// TODO: once we removed the rows from the table, we have to re-build the tag list on the left hand side.
		// Apply the 'active_filter' style somehow
		//keyword_list()
	} else {
		$link.removeClass('active_filter')
		// We have to re-build the table, once the constraint is removed.
		// TODO: apply multiple tags
		$('#publication_list > tbody').html(populate_publication_list(bibliography))
		$('#publication_list > tbody').trigger("applyWidgets")
		count_publications()
	}
}

function populate_publication_list(bibliography) {
	var header = new Array()
	for(i=2; i <= count_columns('#publication_list'); i++) {
		header.push($('#publication_list th:nth-child(' + i + ')').text().trim().toLowerCase())
	}
	var i = 0
	var rows = ''
	for(uuid in bibliography) {
		i++
		var row = '\n<tr id="' + uuid + '"><td>' + i + '</td>'
		for(j in header) {
			if(header[j] == 'author') {
				row += '<td id="' + uuid + '-author" onmouseover="author_selected(' + uuid + ');">' + render_authors(uuid, bibliography) + '</td>'
			} else if(header[j] == '#') {
				row += '<td id="' + uuid + '-count">' + bibliography[uuid]['count'] + '</td>'				
			} else {
				row += '<td id="' + uuid + '-' + header[j] + '">' + bibliography[uuid][header[j]] + '</td>'
			}
		}
		rows += row + '</tr>'
	}
	return rows
}

function render_authors(id, bibliography) {
	// Note: we have to return right way, otherwise, if we activate the links, 
	// the browser won't know how to handle the activate_element function
	return bibliography[uuid]['author']
	var authors = bibliography[uuid]['author'].split(' and ')
	var _authors = new Array()
	for(i in authors) _authors.push('<a href="javascript: void(0)" onmouseup="author_selected(this)">' + authors[i] + '</a>')
	return _authors.join(', ')
}

function author_selected(id) {
	console.log(id)
}

function delete_entry() {
	var id = get_active_paper()
	if(id == null) return false
	delete bibliography[id]
	$('#publication_list tr[id=' + id + ']').remove()
	return false
}

function json_to_bibtex(id) {
	// Converts a bibliography entry into bibtex format, so that it can be displayed in the bibtex tab
	var entry = bibliography[id]
	var bib_str = '@' + entry['type'] + '{' + entry['key'] + ',\n'
	var items = new Array()
	for(i in entry) {
		items.push('\t' + i + ' = {' + entry[i] + '}')
	}
	bib_str += items.join(',\n')
	return bib_str + '\n}'
}

function parse_bibstring(bibstring) {
	var message = _save('bibliography')
	message.sub_type = 'bibliography'
	message['command'] = 'parse_bibstring'
	message['count'] = get_active_paper()
	message['bibstring'] = bibstring
	xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message, null, 4), parse_bibstring_handler)
}

function parse_bibstring_handler(req) {
	var message = JSON.parse(req.responseText)
	if(message['success'] == 'success') {
		// Update the bibliographic entry here
		var entry = message['entry']
		var uuid = message['count']
		for(key in entry) {
			bibliography[uuid][key] = entry[key]
		}
		// We have to set the values in the text boxes
		$('#bibliography_fields input[type=text]').each( function() {
			var id = $(this).attr('id').replace('text_', '')
			$(this).val(bibliography[uuid][id])
		})
		$('#bibliography_fields2 input[type=text]').each( function() {
			var id = $(this).attr('id').replace('text_', '')
			$(this).val(bibliography[uuid][id])
		})
		fill_in_row(message['count'])
	}
	else {
		alert(message['success'])
	}
}

function generate_bibtex_key() {
	var id = get_active_paper()
	// Bail out immediately, if no active entry
	if(id.length == 0) {
		alert('No active entry found')
		return false
	}
	$('#text_key').val(_generate_bibtex_key(id, bibliography))
	fill_in_bibliography(id)
	fill_in_row(id)
	return false
}

function count_publications() {
	var pc = $('#publication_list tr:visible').length - 1
	var pc_all = Object.keys(bibliography).length
	if(pc == pc_all) {
		$('#publication_count').html(pc + ' paper' + (pc != 1 ? 's' : ''))
	} else {
		$('#publication_count').html(pc + ' (' + pc_all + ') paper' + (pc != 1 ? 's' : ''))
	}
}

function show_hide_info() {
	//$('#info_image')
}
