import simplejson
import datetime
from fileutils import get_notebook, create_notebook_folder, notebook_folder
from cell_utils import print_notebook
import uuid
import os

class Bibliography():

	def __init__(self, resource):
		self.resource = resource
	
	def handler(self, message):
		if message['sub_command'] in ('get_bibliography'):
			try:
				data = get_notebook(message['file'])
				bibliography = data.get('bibliography')
				new_bib = {}
				for element in bibliography:
					# TODO: note that this will miserably fail, if there is no uuid
					# We would have to write that to disc in parse_bibliography
					# TODO: this should be done a bit better: we should not bail out, if one entry is incorrect
					element['author'] = ' and '.join(name['given'] + ' ' + name['family'] for name in element['author'])
					new_bib[element['uuid']] = element
				return simplejson.dumps({'success' : 'success', 'bibliography' : new_bib})
			except:
				return simplejson.dumps({'success' : 'failed', 'bibliography' : None})
				
		else: return simplejson.dumps({'success' : 'failed'})


def parse_bibliography(fn, resource):
	print fn
	missing = False
	body_str = ''
	data = get_notebook(fn)
	bibliography = data.get('bibliography')
	if data.get('directory') is None:
		data['directory'] = notebook_folder(fn)
		missing = True
	
	header_str = '<tr><th>#</th>'
	header_str += ''.join(['<th>%s</th>'%(elem.title()) for elem in resource.bibliography_nothon_header])
	header_str += '</tr>'
	note = {'table_header' : header_str}
	if bibliography:
		for i, entry in enumerate(bibliography):
			uid = entry.get('uuid')
			if uid is None:
				missing = True
				uid = str(uuid.uuid4())
				entry['uuid'] = uid
			if os.path.exists(os.path.join(notebook_folder(fn), uid + '.note')) is False:
				create_notebook_folder(os.path.join(notebook_folder(fn), uid + '.note'))
				with open(os.path.join(notebook_folder(fn), uid + '.note'), 'w') as fout:
					fout.write(print_notebook({'notebook' : []}, resource.notebook_item_order))

				entry['notebook'] = os.path.join(notebook_folder(fn), uid + '.note')

			body_str += render_bibtex_entry(i, entry, uid, resource)
			bibliography[i] = entry
	
	# Some IDs, folders, directories, etc. were missing, we have to update the file on disc
	if missing:
		data['bibliography'] = bibliography
		data['date'] = datetime.datetime.now().strftime(resource.time_format)
		write_bibliography(fn, data, resource.bibliography_item_order)
		
	note['table_body'] = body_str
	note['bibliography'] = simplejson.dumps(bibliography)
	return note

def render_bibtex_entry(i, entry, uid, resource):
	table_entry = '\n\t\t\t\t\t<tr id="%s"><td>%d</td>'%(uid, i+1)
	for element in resource.bibliography_nothon_header:
		if element in ('author'):
			table_entry += '<td id="%s-%s">%s</td>'%(uid, element, render_authors(entry))

		else: table_entry += '<td id="%s-%s">%s</td>'%(uid, element, entry.get(element, ""))
	table_entry += '</tr>'
	
	return table_entry

def render_authors(entry):
	authors = entry.get('author')
	if not authors: return ''
	if len(authors) == 1:
		return '%s %s'%(authors[0]['given'], authors[0]['family'])
	else:
		return '%s %s et al.'%(authors[0]['given'], authors[0]['family'])
		
def write_bibliography(fn, nb, objects):
	def safe_notebook_cell(nb, obj):
		if obj in nb: return simplejson.dumps(nb[obj], sort_keys=True, indent=4)
		return ''
	
	nb_str = '{\n'	
	nb_str += ',\n'.join(['"%s" : %s'%(obj, safe_notebook_cell(nb, obj)) for obj in objects])
	nb_str += '\n}'
	with open(fn, 'w') as fout:
		fout.write(nb_str)

