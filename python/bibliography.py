import simplejson
import datetime
from fileutils import get_notebook, create_notebook_folder, notebook_folder, write_notebook, write_to_disc, _save_notebook
from save_utils import save_notebook
import uuid
import os
from bibtex2bibnote import Translator
from notebook import Notebook

class Bibliography(object):

	def __init__(self, resource, render):
		self.resource = resource
		self.render = render
	
	def handler(self, message):
		command = message.get('command')
		print 'Handling bibliography command %s %s'%(command, datetime.datetime.now().strftime("%H:%M:%S.%f"))
		if message.get('sub_type') in ('notebook'):
			nb = Notebook(self.resource, self.render)
			result = nb.handler(message)
				
		elif command in ('parse_bibstring'):
			result = Translator(None).string_reader(message.get('bibstring', ''), count=message.get('count', 10000))
			
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
		return _save_notebook(message.get('file'), message.get('full_bibliography', ''))
		
	def save_bibtex(self, fn, message):
		full_bibliography = message.get('full_bibliography')
		bibliography = full_bibliography['bibliography']
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
		# Should we save directly to HTML, or to bibnote first, and then parse the file from disc?
		self.save_bibnote(fn, message)
		full_bibliography = message.get('full_bibliography')
		bibliography = full_bibliography['bibliography']
		if not bibliography:
			return {'success': 'Could not get bibliographic data from client'}
		
		js_str = ''

		for js_file in ['jquery.min.js', 'ui/jquery-ui.min.js', 'jquery.tablesorter.min.js', 
		'jquery.tablesorter.widgets.min.js', 'bibliography.js']:
			with open('static/js/' + js_file, 'r') as fin:
				js_str += '\n<script>\n' + fin.read() + '\n</script>\n'
				
		css_str = ''
		for css_file in ['main.css', 'bibliography.css', 'ui.dynatree.css', 
		'dynatree_custom.css', 'jquery-ui-smoothness.css', 'theme.default.css', 'jquery.datepick.css']:
			with open('static/css/' + css_file, 'r') as fin:
				css_str += '\n<style>\n' + fin.read() + '\n</style>\n'
				
		content = self.parse_bibliography(fn)
		return write_to_disc(str(self.render.bib_standalone(fn, content, js_str, css_str)), fn.replace('.bibnote', '.html'))

	def parse_bibliography(self, fn):
		data = get_notebook(fn, new_note=self.resource.new_bibliography)
		header_str = '<tr><th>#</th>'
		header_str += ''.join(['<th>%s</th>'%(elem.title()) for elem in self.resource.bibliography_nothon_header])
		header_str += '</tr>'
		note = {'table_header' : header_str}
		note['full_bibliography'] = simplejson.dumps(data)
		note['extra_data'] = simplejson.dumps({'separator': os.sep, 'folder': notebook_folder(fn)})
		return note

def dic_to_bib_string(key, entry):
	if key in ('file'):
		return '\t%s = {:%s:PDF}'%(key, entry.get(key, '""'))	
	return '\t%s = {%s}'%(key, entry.get(key, '""'))

def insert_new_entry(fn, entry, resource):
	try:
		data = get_notebook(fn)
		bibliography = data.get('bibliography')
	except EnvironmentError: 
		return 'Could not write file %s'%(fn)
		
	if bibliography:
		keys = bibliography.keys()
		keys.sort(key=int)
		new_key = int(keys[-1]) + 1
		if entry:
			bibliography['%s'%new_key] = entry
			
	data['date'] = datetime.datetime.now().strftime(resource.time_format)
	data['bibliography'] = bibliography
	return write_notebook(fn, data, resource.bibliography_item_order)
