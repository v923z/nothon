import web
import os
import shutil
import urllib
import base64
import simplejson
import traceback
import tempfile
import time
import sys
from bs4 import BeautifulSoup

from python.resource import NothonResource
from python.fileutils import *
from python.jsutils import *
from python.cell_utils import *
from python.new_notebook import *

from python.plot_utils import Plot
from python.head_utils import Head
from python.code_utils import Code
from python.save_utils import Zip, Tar, Save, Latex, Markdown

from python.template_helpers import *
from python.bibliography import *

nothon_resource = NothonResource()

# We have to check for non-standard packages, so that we can run on android
try:
	from pylab import *
	nothon_resource.has_matplotlib = True
except ImportError:
	nothon_resource.has_matplotlib = False

urls = ('/',  'Index')
render = web.template.render('templates/')
web.template.Template.globals['safe_content'] = safe_content
web.template.Template.globals['safe_props'] = safe_props
app = web.application(urls, globals())

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
	
def text_update_dict(dictionary):
	#update_image(dictionary['content']['text_body']['content'], '/home/v923z/sandbox/nothon/')
	return dictionary

def paragraph_update_dict(dictionary):
	return dictionary

def parse_note(fn):
	note = {}
	note_str = ''
		
	data = get_notebook(fn)
	content = data['notebook']
	note['directory'] = {'content' : data['directory']}
	note['title'] = {'content' : data['title']}
	
	for element in content:
		if element['type'] in ('plot', 'head', 'code'):
			exec('obj = %s(None)'%(element['type'].title()))
			div = obj.render(element, render)
		else:
			exec('element = %s_update_dict(element)'%(element['type']))	
			exec('div = render.%s_html(%s, %s)'%(element['type'], element['count'], element['content']))
			if element['type'] in ('text', 'section', 'paragraph'):
				div = update_image(div, note['directory'])
		note_str += str(div)
		
	note['content'] = {'content' : note_str}
	return note

def image_handler(message, resource):
	ID = message['id'].split('_')[-1]
	fn = message['filename']
	directory = message['directory'].strip('\n')
	return simplejson.dumps({message['id'] : fetch_image(ID, fn, message)})
						
def write_to_temp(string):
	_, tmp = tempfile.mkstemp()
	with open(tmp, 'w') as fout:
		fout.write(string)
	return tmp
	
def maxima_execute(max_string):
	if not max_string.endswith(';'): max_string += ';'
	tmp = write_to_temp(max_string + '\ntex(%);')
	os.system('maxima -b %s > %s.out'%(tmp, tmp))
	result = open(tmp + '.out', 'r').read()	
	os.remove(tmp)
	os.remove(tmp + '.out')
	return result
	
def text_handler(message, resource):
	print message["content"]
	result = maxima_execute(message["content"])
	if result.find('$$') == -1:
		return simplejson.dumps({'target' : message['id'], 'success' : 'failed', 'result' : result})
	else:
		return simplejson.dumps({'target' : message['id'], 'success' : 'success', 'result' : result.split('$$')[1]})

def paragraph_handler(message, resource):
	return text_handler(message, resource)
	
def savehtml_handler(message, resource):
	fin = open('static/css/main.css', 'r')
	css = fin.read()
	fin.close()
	fin = open('static/css/highlight.css', 'r')
	css += fin.read()
	fin.close()
	# TODO: If the source of the page has a link to an image, either on disc, or on the web, 
	# then that has to be resolved, and the base64 representation inserted in the html file.
	fout = open(message['outfile'].replace('.note', '.html'), 'w')
	# The aside (third argument) could be used for adding a table of contents to the page later on
	fout.write(str(render.saved_document(message['title'], css, 'aside', message['content'])))
	fout.close()
	return  simplejson.dumps({'success' : 'success'})

def docmain_render_handler(message, resource):
	notebook = parse_note(message["address"])
	return simplejson.dumps({'docmain' : notebook['content']['content'], 
							'title' : notebook['title']['content'],
							'doc_title' : message["address"],
							'directory' : notebook['directory']['content']})
	
def list_handler_functions():
	return [file.split('.')[0] for file in os.listdir('static/js/') if file.startswith('_')]
	
def list_create_functions():
	return [file.split('.')[0] for file in os.listdir('static/js/') if file.endswith('_html.js')]

class Index(object):
	update_js()
	def GET(self):
		link = web.input(name='test.note')
		if link.name.endswith('.html'): 
			fin = open(link.name, 'r')
			html = fin.read()
			fin.close()
			return html
		aside = {"tree" : dir_html(dir_tree('.'), nothon_resource.dirlisting_style)}
		if link.name == '__timeline':
			return 	render.timeline(link.name, aside, make_timeline())
		elif link.name == '__toc':
			return 	render.toc(link.name, aside, make_toc())
		elif link.name == '__bibliography':
			return 	render.bib_list(link.name, aside, make_bibliography())
		elif link.name.endswith('.bibnote'):
			# TODO: do something, if the file doesn't exist
			return render.bibliography(link.name, link.name, aside, parse_bibliography(link.name, nothon_resource), list_handler_functions(), list_create_functions())
		else:
			sp = link.name.split('#')
			link.name = sp[0]
			if not os.path.exists(link.name):
				title = os.path.basename(link.name).replace('.note', '')
				path = os.path.join(os.getcwd(), os.path.dirname(link.name))
				if not os.path.exists(path):
					os.makedirs(path)
				with open(link.name, 'w') as fout:
					fout.write('{\n"title" : "%s", \n"directory" : "%s", \n"date" : "", \n"nothon version" : 1.3, \n"notebook" : []\n}'%(title, os.getcwd()))
					# We have to re-generate the directory tree, for there is a new item here...
					aside = {"tree" : dir_html(dir_tree('.'), nothon_resource.dirlisting_style)}
				new_notebook(link.name, nothon_resource)
			
			create_notebook_folder(link.name)	
			return 	render.notebook(link.name, link.name, aside, parse_note(link.name), list_handler_functions(), list_create_functions())

	def POST(self):
		message = simplejson.loads(web.data())
		print message
		if message['command'] in ('plot', 'head', 'code', 'zip', 'tar', 'save', 'latex', 'markdown'):
			exec('obj = %s(nothon_resource)'%(message['command'].title()))
			return obj.handler(message)
			
		if message['command'] in ('text', 'paragraph', 'savehtml', 'docmain_render', 'image', 'paste_cell', 'remove_cell'):
			exec('result = %s_handler(message, nothon_resource)'%(message['command']))
			return result
			
		else:
			return simplejson.dumps(message)

if __name__ == "__main__": app.run()

#class StaticMiddleware:
    #"""WSGI middleware for serving static files."""
    #def __init__(self, app, prefix='/static/', root_path='/photo/'):
        #self.app = app
        #self.prefix = prefix
        #self.root_path = root_path

    #def __call__(self, environ, start_response):
        #path = environ.get('PATH_INFO', '')
        #path = self.normpath(path)

        #if path.startswith(self.prefix):
            #environ["PATH_INFO"] = os.path.join(self.root_path, web.lstrips(path, self.prefix))
            #return web.httpserver.StaticApp(environ, start_response)
        #else:
            #return self.app(environ, start_response)

    #def normpath(self, path):
        #path2 = posixpath.normpath(urllib.unquote(path))
        #if path.endswith("/"):
            #path2 += "/"
        #return path2


#if __name__ == "__main__":
	#wsgifunc = app.wsgifunc()
	#wsgifunc = StaticMiddleware(wsgifunc)
	#print wsgifunc.root_path
	#wsgifunc = web.httpserver.LogMiddleware(wsgifunc)
	#server = web.httpserver.WSGIServer(("0.0.0.0", 8080), wsgifunc)
	#print "http://%s:%d/" % ("0.0.0.0", 8080)
	#try:
		#server.start()
	#except KeyboardInterrupt:
		#server.stop()
