function paragraph_activate(id) {
	active_div = document.getElementById('div_paragraph_body_' + id)
	active_div.focus()
	text_context_menu()
}

function paragraph_onclick(event) {
}

function paragraph_context_menu() {
	text_context_menu()	
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
	block.content.paragraph_body.content = strip_mathjax2(block.content.paragraph_body.content)
	return block
}
