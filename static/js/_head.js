function head_activate(id) {
	active_div = document.getElementById('div_head_header_' + id)
	active_div.focus()
}

function head_onclick(event) {
	var elem = event.target
	if(elem.id.indexOf('_main_') === -1) return
	var elem = document.getElementById(elem.id.replace('_main_', '_body_'))
	if(elem.style.display == "block") {
    	elem.style.display = "none"
    	active_div = null
  	}
	else {
		elem.style.display = "block"
		active_div = document.getElementById(elem.id.replace('_body_', '_header_'))
		active_div.focus()
	}
}

function head_keypress(event) {
	if (event.which === 13 && event.shiftKey) {	// Enter
		head_data(event.target)
		create_and_insert('head_main')
		return false
	}
	else if (event.which === 13) {				// Enter
		head_data(event.target)
		return false
	}
	return true
}

function head_data(div_data) {
	var message = create_message(div_data, "head")
	message.body = 'div_head_body_' + get_num(div_data)
	message.container = 'div_head_container_' + get_num(div_data)
	message.date = 'div_head_date_' + get_num(div_data)
	console.log('here', message.content, message.content.length)
	message.content = message.content.replace('<br>', '')
	console.log(message.content, JSON.stringify(message))
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), message_handler)
}

function head_sanitise(block) {
	block.content.head_header.content = block.content.head_header.content.replace('<br>', '')
	return block
}
