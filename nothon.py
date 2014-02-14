import web
import os
import shutil
import urllib
import base64
import simplejson
import traceback
import tempfile
import time
import datetime
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
from python.notebook import Notebook
from python.arxiv import Arxiv

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
	
def list_handler_functions():
	return [file.split('.')[0] for file in os.listdir('static/js/') if file.startswith('_')]
	
def list_create_functions():
	return [file.split('.')[0] for file in os.listdir('static/js/') if file.endswith('_html.js')]

class Index(object):
	update_js()
	def GET(self):
		
		aside = {"tree" : unwrap_tree(dir_tree('.', nothon_resource.listed), '.', nothon_resource.dirlisting_style)}
		link = web.input(keyword=[], includeonly=[])
		if 'file' in link:
			return get_file_from_disc(link.file)
			
		if 'arxiv' in link:
			arxiv = Arxiv(nothon_resource, render)
			if len(link.arxiv) == 0:
				return render.arxiv_all(nothon_resource.server, aside)
			return render.arxiv('arxiv', aside, arxiv.parse(link.arxiv, keyword=link.keyword, includeonly=link.includeonly))
		
		if 'bibnote' in link:
			bib = Bibliography(nothon_resource, render)
			bibnote = link.bibnote
			if len(bibnote) > 0:
				if not os.path.exists(bibnote):
					bib.new_bibliography(bibnote)
				return render.bibliography(bibnote, bibnote, aside, bib.parse_bibliography(bibnote), list_handler_functions(), list_create_functions())
			else: return render.welcome(None)
				
		if link.name == '':
			return render.welcome(None)
						
		if link.name.endswith('.html'): 
			with open(link.name, 'r') as fin:
				html = fin.read()
			return html

		if link.name == '__timeline':
			return 	render.timeline(link.name, aside, make_timeline())
		elif link.name == '__toc':
			return 	render.toc(link.name, aside, make_toc())
		elif link.name == '__bibliography':
			return 	render.bib_list(link.name, aside, make_bibliography())
			
		elif link.name.endswith('.note'):
			nb = Notebook(nothon_resource, render)
			sp = link.name.split('#')
			link.name = sp[0]
			if not os.path.exists(link.name):
				nb.new_notebook(link.name)
				aside = {"tree" : unwrap_tree(dir_tree('.', nothon_resource.listed), '.', nothon_resource.dirlisting_style)}
				
			return render.notebook(link.name, link.name, aside, nb.parse_note(link.name), list_handler_functions(), list_create_functions())
			
		else:
			return render.welcome('Could not process requested URL!')

	def POST(self):
		message = simplejson.loads(web.data())
		print message
		doc_type = message.get('type')
		if doc_type in ('notebook', 'bibliography', 'arxiv'):
			exec('obj = %s(nothon_resource, render)'%(doc_type.title()))
			return simplejson.dumps(obj.handler(message))
			
		#if message['command'] in ('plot', 'head', 'code', 'zip', 'tar', 'save', 'latex', 'markdown', 'bibliography'):
			#exec('obj = %s(nothon_resource)'%(message['command'].title()))
			#return obj.handler(message)
			
		if message['command'] in ('text', 'paragraph', 'savehtml', 'docmain_render', 'image', 'paste_cell', 'remove_cell'):
			exec('result = %s_handler(message, nothon_resource)'%(message['command']))
			return result
			
		else:
			return simplejson.dumps({'success': 'Could not parse command'})

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
