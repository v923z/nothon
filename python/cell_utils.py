import simplejson

def paste_cell_handler(message):
	target = message['target']
	addresses = message['addresses']
	for address in addresses:
		notebook = address.strip('?name=').split('#')[0]
		cell = address.strip('?name=').split('#')[1]
		print target, address, notebook, cell
	
	return simplejson.dumps({message['command'] : message})

def insert_cell(target, source, cell_id):
	target_nb = get_notebook(target)
	source_nb = get_notebook(source)
	for cell in source_nb['notebook']:
		if cell['id'] == cell_id:
			target_nb['notebook'].insert(0, prepare_cell(cell, locate_highest(target_nb, cell['type'])+1))
			break
            
	print simplejson.dumps(target_nb, sort_keys=True, indent=4)

def locate_highest(nb, cell_type):
	# Returns the highest "count" of a particular cell type
	counts = [0]
	for cell in nb['notebook']:
		if cell['type'] == cell_type:
			counts.append(cell['count'])
            
	return max(counts)

def prepare_cell(cell, count):
	# Replaces all cell IDs by the one dictated by 'count'
	new_cell = cell
	new_cell['count'] = count
	new_cell['id'] = '_'.join(cell['id'].split('_')[:-1]) + '_%s'%(count)
	for c in cell['content']:
		new_id = '_'.join(cell['content'][c]['id'].split('_')[:-1]) + '_%s'%(count)
		new_cell['content'][c]['id'] = new_id
	return new_cell

def print_notebook(nb, *objects):
	nb_str = '{\n'
	for obj in objects:
		nb_str += '"%s" : %s,\n'%(obj, simplejson.dumps(nb[obj], sort_keys=True, indent=4))
        
	nb_str += '}'
	return nb_str
