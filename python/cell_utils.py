import simplejson
from fileutils import get_notebook

def paste_cell_handler(message, resource):
	target = message['target']
	target_nb = get_notebook(target)
	addresses = message['addresses']
	for address in addresses:
		source = address.split('#')[0]
		cell = address.split('#')[1]
		insert_cell(target_nb, source, cell)

	with open(target, 'w') as fout:
		fout.write(print_notebook(target_nb, resource.notebook_item_order))
	return simplejson.dumps({message['command'] : message})

def insert_cell(target_nb, source, cell_id):
	source_nb = get_notebook(source)
	for cell in source_nb['notebook']:
		if cell['id'] == cell_id:
			target_nb['notebook'].insert(0, prepare_cell(cell, locate_highest(target_nb, cell['type'])+1))
			break
            
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
	def safe_notebook_cell(nb, obj):
		if obj in nb: return simplejson.dumps(nb[obj], sort_keys=True, indent=4)
		return ''
	
	nb_str = '{\n'	
	nb_str += ',\n'.join(['"%s" : %s'%(obj, safe_notebook_cell(nb, obj)) for obj in objects])
	nb_str += '\n}'
	return nb_str
