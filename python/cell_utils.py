import simplejson

def paste_cell_handler(message):
	target = message['target']
	addresses = message['addresses']
	for address in addresses:
		notebook = address.strip('?name=').split('#')[0]
		cell = address.strip('?name=').split('#')[1]
		print target, address, notebook, cell
	
	return simplejson.dumps({message['command'] : message})
