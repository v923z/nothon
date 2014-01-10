import simplejson
import datetime
from fileutils import get_notebook, create_notebook_folder, notebook_folder, write_notebook, write_to_disc
from save_utils import save_notebook
import uuid
import os
import datetime
from notebook import Notebook

class Bibliography():

	def __init__(self, resource, render):
		self.resource = resource
		self.render = render
	
	def handler(self, message):
		command = message.get('command')
		print 'Handling bibliography command %s %s'%(command, datetime.datetime.now().strftime("%H:%M:%S.%f"))
		if message.get('sub_type') in ('notebook'):
			nb = Notebook(self.resource, self.render)
			result = nb.handler(message)
			
		elif command in ('get_bibliography'):
			# This function is called by the client immediately after loading the main content
			result = get_bibliography(message.get('file'))
				
		elif command in ('save_bibnote'):
			result = self.save_bibnote(message.get('file'), message)
			
		elif command in ('save_bibtex'):
			result = self.save_bibtex(message.get('file', '').replace('.bibnote', '.bib'), message)
		
		elif command in ('save_html'):
			result = self.save_html(message.get('file'), message)
					
		elif command in ('save_and_load'):
			try:
				nb = Notebook(self.resource, self.render)
				nb.save_notebook(message, message.get('file'))
				result = nb.render_docmain(message.get('new_notebook'))
				result['success'] = 'success'
			except:
				result = {'success' : 'failed to load file %s'%(message.get('file'))}
			
		else: 
			result = {'success': 'undefined command: %s'%(command)}
			
		print 'Returning from bibliography command %s %s'%(command, datetime.datetime.now().strftime("%H:%M:%S.%f"))
		return result

	def save_bibnote(self, fn, message):
		bib_dic = {'type' : 'bibliography', 'bibliography' : message.get('bibliography', ''), 'date' : message.get('date', '')}
		bib_dic['nothon version'] = self.resource.nothon_version
		# Have we got to re-format the author list here?
		return write_notebook(message.get('file'), bib_dic, self.resource.bibliography_item_order)
	
	def save_bibtex(self, fn, message):
		bibliography = message.get('bibliography')
		if not bibliography:
			return {'success': 'Could not get bibliographic data from client'}
		# We need this, otherwise jabref doesn't understand the encoding
		bib_str = '% This file was created with JabRef 2.9.2.\n'
		bib_str += '% Encoding: UTF8\n\n'
		for tag in bibliography:
			entry = bibliography.get(tag)
			if entry:
				header = '@%s{%s,\n'%(entry.get('type', ''), entry.get('key', ''))
				body = ',\n'.join([dic_to_bib_string(key, entry) for key in entry])
				bib_str += header + body + '\n}\n\n'
		
		return write_to_disc(bib_str, fn)
		
	def save_html(self, fn, message):
		# Should be save directly to HTML, or to bibnote first?
		#self.save_bibnote(fn, message)
		bibliography = message.get('bibliography')
		if not bibliography:
			return {'success': 'Could not get bibliographic data from client'}
		return {'success': 'success'}
		#return write_to_dics(str(self.render.bib_html()), fn.replace('.bibnote', '.html'))
		
	def new_bibliography(self, fn):
		create_notebook_folder(fn)
		write_bibliography(fn, {'type' : 'bibliography', 'bibliography' : {}}, self.resource.bibliography_item_order)

	def parse_bibliography(self, fn):
		missing = False
		body_str = ''
		data = get_notebook(fn)
		bibliography = data.get('bibliography')
		keywords = []
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
					#write_notebook(os.path.join(notebook_folder(fn), '%s.note'%(entry)), 
									#{'notebook': [], 'nothon version': self.resource.nothon_version, 'type': 'notebook'}, 
									#self.resource.notebook_item_order)
					# Here we should insert only the relative path
					bibliography[entry]['notebook'] = os.path.join(notebook_folder(fn), '%s.note'%(entry))

				body_str += render_bibtex_entry(i, bibliography[entry], entry, self.resource)
				if bibliography[entry].get('keywords'):
					keywords += bibliography[entry].get('keywords').split(',')
		
		# Some directories, files, etc. were missing, we have to update the file on disc
		if missing:
			data['bibliography'] = bibliography
			data['date'] = datetime.datetime.now().strftime(self.resource.time_format)
			write_notebook(fn, data, self.resource.bibliography_item_order)
			
		note['table_body'] = body_str
		note['keywords'] = render_keywords(keywords)
		return note

def get_bibliography(fn):
	try:
		data = get_notebook(fn)
		bibliography = data.get('bibliography')
		extra_data = {'separator': os.sep, 'folder': notebook_folder(fn)}
		return {'success' : 'success', 'bibliography' : bibliography, 'extra_data': extra_data}
	except:
		return {'success' : 'Could not read file: %s'%(fn)}
				
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

def render_keywords(keywords):
	# Given a python list of keywords, returns a HTML list of links
	if '""' in keywords: keywords.remove('""')
	keywords = set([keyword.lstrip().rstrip() for keyword in keywords])
	ul = '<ul class="keywords_list">\n'
	for keyword in sorted(keywords):
		# TODO: create sub-groups by letter
		ul += '<li><a href="javascript:show_tag(\'%s\');">%s</a></li>\n'%(keyword, keyword)
	ul += '</ul>'
	return ul

def dic_to_bib_string(key, entry):
	if key in ('file'):
		return '\t%s = {:%s:PDF}'%(key, entry.get(key, '""'))	
	return '\t%s = {%s}'%(key, entry.get(key, '""'))
