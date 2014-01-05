import simplejson
import datetime
from fileutils import get_notebook, create_notebook_folder, notebook_folder
from cell_utils import write_notebook
from save_utils import save_notebook
import uuid
import os
import datetime

class Bibliography():

	def __init__(self, resource):
		self.resource = resource
	
	def handler(self, message):
		command = message.get('sub_command')
		print 'Handling bibliography command %s %s'%(command, datetime.datetime.now().strftime("%H:%M:%S.%f"))
		if command in ('get_bibliography'):
			# This function is called by the client immediately after loading the main content
			try:
				data = get_notebook(message['file'])
				bibliography = data.get('bibliography')
				extra_data = {'separator': os.sep, 'folder': notebook_folder(message['file'])}
				return simplejson.dumps({'success' : 'success', 'bibliography' : bibliography, 'extra_data': extra_data})
			except:
				return simplejson.dumps({'success' : 'failed', 'file': message['file']})
				
		if command in ('save_bibnote'):
			bib_dic = {'type' : 'bibliography', 'bibliography' : message.get('bibliography', ''), 'date' : message.get('date', '')}
			bib_dic['nothon version'] = self.resource.nothon_version
			# Have we got to re-format the author list here?
			try:
				write_bibliography(message['file'], bib_dic, self.resource.bibliography_item_order)
				return simplejson.dumps({'success' : 'success'})
			except:
				#TODO: return the error code
				return simplejson.dumps({'success' : 'failed'})
				
		if command in ('save_and_load'):
			try:
				save_notebook(message, message.get('file'), self.resource)
				
			except:
				return simplejson.dumps({'success' : 'failed'})
			
		else: 
			result = {'success': 'undefined command: %s'%(command)}
			
		print 'Returning from bibliography command %s %s'%(command, datetime.datetime.now().strftime("%H:%M:%S.%f"))
		return result
		
	def new_bibliography(self, fn):
		create_notebook_folder(fn)
		write_bibliography(fn, {'type' : 'bibliography', 'bibliography' : {}}, self.resource.bibliography_item_order)

	def parse_bibliography(self, fn):
		missing = False
		body_str = ''
		data = get_notebook(fn)
		bibliography = data.get('bibliography')
		if data.get('directory') is None:
			data['directory'] = notebook_folder(fn)
			missing = True
		
		header_str = '<tr><th>#</th>'
		header_str += ''.join(['<th>%s</th>'%(elem.title()) for elem in self.resource.bibliography_nothon_header])
		header_str += '</tr>'
		note = {'table_header' : header_str}
		if bibliography:
			# TODO: at the moment, this will sort by the keys. 
			# We could define a key that preserves the last known order, although, that is a highly non-trivial problem
			for i, entry in enumerate(sorted(bibliography.keys())):
				if os.path.exists(os.path.join(notebook_folder(fn), '%s.note'%(entry))) is False:
					missing = True
					write_notebook(os.path.join(notebook_folder(fn), '%s.note'%(entry)), 
									{'notebook': [], 'nothon version': self.resource.nothon_version, 'type': 'notebook'}, 
									resource.notebook_item_order)
					# Here we should insert only the relative path
					bibliography[entry]['notebook'] = os.path.join(notebook_folder(fn), '%s.note'%(entry))

				body_str += render_bibtex_entry(i, bibliography[entry], entry, self.resource)
		
		# Some directories, files, etc. were missing, we have to update the file on disc
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
		table_entry += '<td id="%s-%s">%s</td>'%(uid, element, entry.get(element, ""))
	table_entry += '</tr>'
	
	return table_entry

def render_authors(entry):
	# This function is probably not needed any longer
	authors = entry.get('author')
	if not authors: return ''
	if len(authors) == 1:
		return '%s %s'%(authors[0]['given'], authors[0]['family'])
	else:
		return '%s %s et al.'%(authors[0]['given'], authors[0]['family'])
		
def write_bibliography(fn, nb, objects):
	def safe_notebook_cell(nb, obj):
		if obj in nb: return simplejson.dumps(nb[obj], sort_keys=True, indent=4)
		return '""'
	
	nb_str = '{\n'	
	nb_str += ',\n'.join(['"%s" : %s'%(obj, safe_notebook_cell(nb, obj)) for obj in objects])
	nb_str += '\n}'
	with open(fn, 'w') as fout:
		fout.write(nb_str)

