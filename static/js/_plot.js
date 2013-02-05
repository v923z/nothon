function plot_activate(id) {
	active_div = document.getElementById('div_plot_header_' + id)
	active_div.focus()
}

function plot_onclick(event) {
	var elem = event.target
	if(elem.id.indexOf('_main_') === -1) return
	var elem = document.getElementById(elem.id.replace('_main_', '_header_'))
	if(elem.style.display == "block") {
    	elem.style.display = "none"
    	active_div = null
  	}
	else {
		elem.style.display = "block"
		active_div = elem
		active_div.focus()
	}
}

function plot_keypress(event) {
	if (event.which === 13 && event.ctrlKey) {			// Enter
		plot_data(event.target)
		return false
	}
	else if (event.which === 13 && event.shiftKey) {	// Enter
		plot_data(event.target)
		create_and_insert('plot_main')
		return false
	}
	return true
}

function plot_data(div_data) {
	var message = create_message(div_data, "plot")
	message.title = 'div_plot_title_' + get_num(div_data)
	message.filename = document.title + '_' + get_num(div_data) + '.png'
	message.body = 'div_plot_body_' + get_num(div_data)
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), message_handler)
}
