def paste_cell_handler(message):
	
	return simplejson.dumps({message['id'] : fetch_image(ID, fn, message)})
