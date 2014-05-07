import web
import datetime
import simplejson
import os
from bs4 import BeautifulSoup

from template_helpers import *

from plot_utils import Plot
from head_utils import Head
from code_utils import Code
from text_utils import Text, Section, Paragraph
from save_utils import Zip, Tar, Latex, Markdown
from fileutils import notebook_folder, get_notebook, write_notebook, create_notebook_folder, _save_notebook
from new_notebook import new_notebook


class Notebook(object):
	""" Entry point for handling notebook files """
		
	def __init__(self, resource, render):
		self.resource = resource
		self.render = render

	def handler(self, message):
		command = message.get('command')
		print 'Handling notebook command %s %s'%(command, datetime.datetime.now().strftime("%H:%M:%S.%f"))
		if command in ('plot', 'head', 'code'):
			print command.title()
			exec('obj = %s(self.resource)'%(command.title()))
			result = obj.handler(message)

		elif command in ('save', 'html', 'tar', 'zip', 'latex', 'markdown'):
			fn = message.get('file')
			folder = notebook_folder(fn)
			result = self.save_notebook(message, fn)
			
			if command in ('html'):
				result = save_html(fn.replace('.note', '.html'), message.get('docmain'))
			elif command in ('tar'):
				result = Tar(self.resource).tar_notebook(fn, folder, fn.replace('.note', '.tgz'))
			elif command in ('zip'):
				result = Zip(self.resource).zip_notebook(fn, folder, fn.replace('.note', '.zip'))
			elif command in ('latex'): 
				result = Latex(self.resource).process_note(fn)
			elif command in ('markdown'): 
				result = Markdown(self.resource).process_note(fn)
				
		elif command in ('render_docmain'):
			result = self.render_docmain(message.get('address'))
			
		else:
			result = {'success': 'undefined command: %s'%(command)}
			
		print 'Returning from notebook command %s %s'%(command, datetime.datetime.now().strftime("%H:%M:%S.%f"))
		return result
		
	def parse_note(self, fn):
		print 'Reading file %s %s'%(fn, datetime.datetime.now().strftime("%H:%M:%S.%f"))
		data = get_notebook(fn)
		notebook = data.get('notebook')
		_metadata = data.get('_metadata')
		directory = _metadata.get('directory')
		for element in notebook:
			elem_type = element.get('type')
			if elem_type in ('plot', 'head', 'code', 'text', 'paragraph', 'section'):
				exec('obj = %s(self.resource)'%(elem_type.title()))
				element = obj.render(element, directory, self.render)
			else:
				pass
				
		note = {'full_notebook': simplejson.dumps({'_metadata': data['_metadata'], 'notebook': notebook})}
		print 'Read file %s %s'%(fn, datetime.datetime.now().strftime("%H:%M:%S.%f"))
		return note
		
	def render_docmain(self, fn):
		notebook = self.parse_note(fn)
		return {'docmain' : notebook['content']['content'], 
			'title' : notebook['title']['content'],
			'doc_title' : fn,
			'directory' : notebook['directory']['content']}

		
	def save_notebook(self, message, fn):
		" Writes the stipped document content to disc "
		return _save_notebook(fn, message.get('full_notebook'))

	def new_notebook(self, fn, aux=False):
		" Creates an empty notebook on disc "
		if os.path.exists(fn): return aux
		
		create_notebook_folder(fn)
		_save_notebook(fn, self.resource.new_notebook)
		if aux:
			if aux.get('type') in ('calendar'):
				nb = get_notebook(fn)
				nb['_metadata']['raw_date'] = aux.get('raw_date', '')
				_save_notebook(fn, nb)
		new_notebook(fn, self.resource)

def update_image(content, directory):
	# Parses the content for images, fetches them from disc, and inserts them accordingly
	soup = BeautifulSoup(str(content))
	dic = {}
	for img in soup.find_all(class_='section_image'):
		ID = img['id'].split('_')[-1]
		dic['style'] = {'content' : img['style']}
		dic['image_data'] = {'content' : fetch_image(ID, img['data-path'], directory)}
		dic['image_caption'] = {'content' : img['data-caption']}
		s = BeautifulSoup(str(render.image_html(ID, dic)))
		s.html.unwrap()
		s.body.unwrap()
		img.replace_with(s)
        
	soup.html.unwrap()
	soup.body.unwrap()
	return soup
	
def save_html(fn, content):
	with open('static/css/main.css', 'r') as fin:
		css = fin.read()
	with open('static/css/highlight.css', 'r') as fin:
		css += fin.read()
	with open(fn, 'w') as fout:
		fout.write(content)
	return {'success' : 'success'}
