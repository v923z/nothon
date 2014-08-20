import os
from bs4 import BeautifulSoup

class Text(object):
		
	def __init__(self, resource):
		self.resource = resource

	def render(self, dictionary, directory, render):
		div = render.text_html(dictionary['count'], dictionary['content'])
		if directory:
			div = update_image(div, directory)
		return str(div)
		
	def handler(message, resource):
		return {'success': 'success'}


class Paragraph(object):
	
	def __init__(self, resource):
		self.resource = resource
		
	def render(self, dictionary, directory, render):
		if directory:
			dictionary['content']['body'] = update_image(dictionary['content']['body'], directory)
		return dictionary
		
	def handler(message, resource):
		return {'success': 'success'}


class Section(object):
	
	def __init__(self, resource):
		self.resource = resource

	def render(self, dictionary, directory, render):
		if directory:
			dictionary['content']['body'] = update_image(dictionary['content']['body'], directory)
		return dictionary

	def handler(message, resource):
		return {'success': 'success'}
		
		
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

def fetch_image(ID, fn, directory):
	try:
		fn = get_file_path(fn, directory)
		# TODO: figure out image size, deal with SVG files
		ext = os.path.splitext(fn)[1]
		if ext.lower() in ('.png', '.jpg', '.jpeg', '.bmp', '.tiff'):
			with open(fn, "rb") as image_file:
				return '<img id="img_' + ID + '" src="data:image/' + ext + ';base64,' + base64.b64encode(image_file.read()) + '"/>'
	except IOError:
		return '<span class="code_error">Could not read file from disc</span>'
