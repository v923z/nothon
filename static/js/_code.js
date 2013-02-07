function code_activate(id) {
	active_div = document.getElementById('div_code_header_' + id)
	active_div.focus()
}

function code_onclick(event) {
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
		active_div = elem
		active_div.focus()	
	}
}

function code_keypress(event) {
	if (event.which === 13 && event.shiftKey) {	// Enter
		code_data(event.target)
		create_and_insert('code_main')
		return false
	}
	else if (event.which === 13) {				// Enter
		code_data(event.target)
		return false
	}
	return true
}

function code_data(div_data) {
	var message = create_message(div_data, "code")
	message.body = 'div_code_body_' + get_num(div_data)
	message.container = 'div_code_container_' + get_num(div_data)
	message.date = 'div_code_date_' + get_num(div_data)
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), message_handler)
}

function code_sanitise(block) {
	return block
}
