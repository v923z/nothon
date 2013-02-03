function text_activate(id) {
	active_div = document.getElementById('div_text_header_' + id)
	active_div.focus()
}

function text_onclick(event) {
	var elem = event.target
	if(elem.id.indexOf('_main_') === -1) return
	var elem = document.getElementById(elem.id.replace('_main_', '_body_'))
	active_div = document.getElementById(elem.id.replace('_body_', '_header_'))
	if(elem.style.display == "block") {
    	elem.style.display = "none"
  	}
	else {
		elem.style.display = "block"
	}
	active_div.focus()
}

function text_keypress(event) {
	if (event.which === 13 && event.shiftKey) {					// Enter
		text_data(event.target)
		create_and_insert('text_main')
		return false
	}
	else if (event.which === 13 && event.ctrlKey) {				// Enter
		console.log('here')
		MathJax.Hub.Queue(["Typeset", MathJax.Hub, event.target.id]);
		return false
	}
	return true
}

function text_data(div_data) {
	var message = create_message(div_data, "text")
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), message_handler)
}
