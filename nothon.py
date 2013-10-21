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

from pygments import highlight
from pygments.lexers import get_lexer_for_filename
from pygments.formatters import HtmlFormatter

from pylab import *

sys.path.insert(0, './python')
import resource
from code_handling import *
from fileutils import *
from jsutils import *
from cell_utils import *
from new_notebook import *
import latex

nothon_resource = resource.NothonResource()

def safe_content(dictionary, key):
	if not dictionary or key not in dictionary:
		return ""
	else:
		return dictionary[key]['content']

def safe_props(dictionary, key, *props):
	if not dictionary or key not in dictionary:
		return ';'.join(props)
	elif 'props' in dictionary[key]:
		return ';'.join(set(dictionary[key]['props'].split(';') + list(props)))
	else:
		return ';'.join(props)	

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
		
def read_plot(fn):
	try:
		with open(fn, "rb") as image_file:
			return '<img class="plot_image" src="data:image/png;base64,' + base64.b64encode(image_file.read()) + '"/>'
	except IOError:
		return '<span class="code_error">Could not read file from disc</span>'

def plot_update_dict(dictionary):
	dictionary['content']['plot_body'] = {'content' : read_plot(dictionary['content']['plot_file']['content'])}
	return dictionary
	
def text_update_dict(dictionary):
	#update_image(dictionary['content']['text_body']['content'], '/home/v923z/sandbox/nothon/')
	return dictionary

def head_update_dict(dictionary):
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
		exec('element = %s_update_dict(element)'%(element['type']))	
		exec('div = render.%s_html(%s, %s)'%(element['type'], element['count'], element['content']))
		if element['type'] in ('text', 'section', 'paragraph'):
			div = update_image(div, note['directory'])
		note_str += str(div)
		
	note['content'] = {'content' : note_str}
	return note

def head_handler(message, resource):
	head = message['content'].rstrip('<br>').rstrip('\t').rstrip('\n')
	sp = head.split(' ')
	fn = sp[0]
	if not os.path.exists(fn): 
		return simplejson.dumps({message['body'] : '<span class="head_error">File doesn\'t exist</span>', message['date'] : ''})
	if len(sp) == 1: n = 10
	# TODO: elif sp[1] == '#':	
	else: n = int(sp[1])
	fin = open(fn, 'r')	
	if n > 0:
		lines = []
		it = 0
		for line in fin:
			lines.append(line.rstrip('\n\r'))
			it += 1
			if it >= n: break
	
	if n < 0:
		# TODO: this is highly inefficient. 
		# Check out http://code.activestate.com/recipes/157035-tail-f-in-python/
		# http://stackoverflow.com/questions/136168/get-last-n-lines-of-a-file-with-python-similar-to-tail
		lines = fin.readlines()
		lines = lines[n:]
	fin.close()	
	return simplejson.dumps({"scroller" : message['body'],
							message['date'] : 'Created: %s, modified: %s'%(time.ctime(os.path.getctime(fn)), time.ctime(os.path.getmtime(fn))),  
							message['body'] : '<br>'.join([x.rstrip('\n\r') for x in lines])})

def plot_handler(message, resource):
	code = message['content'].replace('<p>', '\n').replace('</p>', '').replace('<br>', '\n')
	exit_status = False
	pwd = os.getcwd()
	print message['directory']
	if message['directory']: os.chdir(message['directory'].strip('<br>'))
	
	if code.startswith('#gnuplot') or code.startswith('# gnuplot'):
		with open(message['filename'] + '.gp', 'w') as fout:
			fout.write("set term png; set out '%s.png'\n"%(pwd + '/' + message['filename']) + code)				
			if nothon_resource.plot_pdf_output:
				fout.write("\nset term pdfcairo; set out '%s.pdf'\n replot\n"%(pwd + '/' + message['filename']))
		os.system("gnuplot %s.gp"%(message['filename']))
		os.system("rm %s.gp -f"%(message['filename']))
		
	else:
		x = linspace(-10, 10, 100)
		try:
			exec(code)
			savefig(pwd + '/' + message['filename'] + '.png')
			if nothon_resource.plot_pdf_output: 
				savefig(pwd + '/' + message['filename'] + '.pdf')
			close()
		except:
			exit_status = traceback.format_exc().replace('\n', '<br>')

	os.chdir(pwd)
	if not exit_status:
		exit_status = read_plot(message['filename'] + '.png')

	return simplejson.dumps({ "scroller" : message['body'],
						message['title'] : message['filename'] + '.png', 
						message['body'] : exit_status})

def image_handler(message, resource):
	ID = message['id'].split('_')[-1]
	fn = message['filename']
	directory = message['directory'].strip('\n')
	return simplejson.dumps({message['id'] : fetch_image(ID, fn, message)})
		
def code_handler(message, resource):
	print message
	fn, tag, linenos, include = code_arguments(message['content'])
	return simplejson.dumps({message['date'] : 'Created: %s, modified: %s'%(time.ctime(os.path.getctime(fn)), time.ctime(os.path.getmtime(fn))),
						message['body'] : code_formatter(fn, nothon_resource.code_delimiter, tag, linenos, include), 
						"scroller" : message['body']})
						
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

def save_handler(message, resource):
	_save(message)		
	return  simplejson.dumps({'success' : 'success'})

def _save(message):	
	" Writes the stipped document content to disc "
	with open(message['outfile'], 'w') as fout:
		#nb = message
		#nb['nothon version'] = resource.nothon_version
		#print print_notebook(nb, resource.notebook_item_order)
		fout.write('{\n"title" : "%s",\n'%(message["title"]))
		fout.write('"type": "%s",\n'%(message['type']))
		if message['type'] in ('notebook'):
			fout.write('"directory" : "%s",\n'%(message["directory"].strip('<br>')))
		fout.write('"date" : "%s",\n'%(message["date"]))
		fout.write('"nothon version" : 1.3,\n')
		fout.write('"notebook" : %s\n}'%(simplejson.dumps(message['content'][1:], sort_keys=True, indent=4)))

def savelatex_handler(message, resource):
	_save(message)
	latex.process_note(message['outfile'])
	return  simplejson.dumps({'success' : 'success'})
	
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
		print link.name
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
		else:
			sp = link.name.split('#')
			link.name = sp[0]
			if not os.path.exists(link.name):
				title = os.path.basename(link.name).replace('.note', '')
				path = os.path.join(os.getcwd(),os.path	.dirname(link.name))
				if not os.path.exists(path):
					os.makedirs(path)
				with open(link.name, 'w') as fout:
					fout.write('{\n"title" : "%s", \n"directory" : "%s", \n"date" : "", \n"nothon version" : 1.3, \n"notebook" : []\n}'%(title, os.getcwd()))
					# We have to re-generate the directory tree, for there is a new item here...
					aside = {"tree" : dir_html(dir_tree('.'), nothon_resource.dirlisting_style)}
				new_notebook(link.name, nothon_resource)
					
			return 	render.notebook(link.name, aside, parse_note(link.name), list_handler_functions(), list_create_functions())

	def POST(self):
		message = simplejson.loads(web.data())
		print message
		if message['command'] in ('plot', 'head', 'code', 'text', 'paragraph', 'save', 'savehtml', 'savelatex', 'docmain_render', 'image', 'paste_cell', 'remove_cell'):
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
