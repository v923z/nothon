function insert_paragraph() {
	var id = get_max_index('paragraph_main') + 1
	insert_new_cell(paragraph_html(id), 'div_paragraph_body_' + id)
	paragraph_context_menu()
	return false
}

function paragraph_context_menu() {
	text_context_menu()
	$('#context_menu').children(':first').replaceWith('<div class="context_menu_header">Paragraph</div>')
	$('#context_menu > ul').children(':last').replaceWith('<li onmouseup="insert_paragraph()">New paragraph</li>')
}

function paragraph_keypress(event) {
	return text_keypress(event)
}

function paragraph_data(div_data, math_string) {
	var message = create_message(div_data, "paragraph")
	message.content = math_string
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), paragraph_handler)
}

function paragraph_handler(req) {
	text_handled(req)
}

function paragraph_sanitise(block) {
	var dtemp = $('<div/>', {'id': 'dtemp'}).appendTo('#trash')
	$('#dtemp').html($('#' + block.content.paragraph_body.id).html())
	strip_mathjax_for_save($('#dtemp'))
	strip_images_for_save($('#dtemp'))
	block.content.paragraph_body.content = $('#dtemp').html()
	$('#dtemp').remove()
	return block
}

function paragraph_render(json) {
	add_new_cell(paragraph_html(json.count))
	$('#div_paragraph_body_' + json.count).html(json.content.paragraph_body.content)
}
