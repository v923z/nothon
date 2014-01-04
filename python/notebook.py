from bs4 import BeautifulSoup

from template_helpers import *

from plot_utils import Plot
from head_utils import Head
from code_utils import Code
from text_utils import Text
from save_utils import Zip, Tar, Save, Latex, Markdown

class Notebook(object):
	""" Entry point for handling notebook files """
		
	def __init__(self, resource):
		self.resource = resource
		
	def handler(self, message):
		command = message.get('sub_command')
		if command in ('plot', 'head', 'code'):
			exec('obj = %s(nothon_resource)'%(command.title()))
			return obj.handler(message)

		if command in ('save', 'tar', 'zip', 'latex', 'markdown'):
			fn = message.get('file')
			folder = notebook_folder(fn)
			result = save_notebook(message, fn self.resource)
			
			if command in ('tar'):
				result = Tar(self.resource).tar_notebook(fn, folder, fn.replace('.note', '.tgz'))
			elif command in ('zip'):
				result = Zip(self.resource).zip_notebook(fn, folder, fn.replace('.note', '.zip'))
			elif command in ('latex'): 
				result = Latex(self.resource).process_note(fn)
			elif command in ('markdown'): 
				result = Markdown(self.resource).process_note(fn)
		else:
			result = {'success': 'undefined command: %s'%(command)}
			
		return result
		
	def parse_note(self, fn):
		note = {}
		note_str = ''
			
		data = get_notebook(fn)
		content = data.get('notebook')
		directory = data.get('directory')
		note['directory'] = {'content' : directory}
		note['title'] = {'content' : data.get('title')}
		
		for element in content:
			elem_type element.get('type')
			if elem_type in ('plot', 'head', 'code', 'text'):
				exec('obj = %s(None)'%(elem_type.title()))
				div = obj.render(element, directory, render)
			else:
				exec('element = %s_update_dict(element)'%(elem_type))	
				exec('div = render.%s_html(%s, %s)'%(elem_type, element['count'], element['content']))
				if elem_type in ('text', 'section', 'paragraph'):
					div = update_image(div, note['directory'])
			note_str += str(div)
			
		note['content'] = {'content' : note_str}
		return note


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
