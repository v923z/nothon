import web
import os
import shutil
import urllib
import base64
import simplejson
import traceback
import tempfile


from pygments import highlight
from pygments.lexers import get_lexer_for_filename
from pygments.formatters import HtmlFormatter

# http://stackoverflow.com/questions/753052/strip-html-from-strings-in-python
# http://www.codinghorror.com/blog/2009/11/parsing-html-the-cthulhu-way.html
# http://stackoverflow.com/questions/9662346/python-code-to-remove-html-tags-from-a-string
#import helper
from pylab import *

def safe_content(dictionary, key):
	if not dictionary or key not in dictionary:
		return ""
	else:
		print key
		return dictionary[key]['content']

urls = ('/',  'Index')
render = web.template.render('templates/')
web.template.Template.globals['safe_content'] = safe_content
app = web.application(urls, globals())

def update_js():
	list_of_files = [file.split('.')[0] for file in os.listdir('templates/') if file.endswith('_html.html')]
	for fn in list_of_files:
		if not os.path.exists('static/js/%s.js'%(fn)) or os.path.getmtime('templates/%s.html'%(fn)) > os.path.getmtime('static/js/%s.js'%(fn)):
			with open('static/js/%s.js'%(fn), "w") as fout:
				fout.write(create_js(fn))
		
def create_js(func_name):
	func_head = "function %s(id) { \n\thtml = \""%(func_name)
	func_tail = "\".replace(/ID_TAG/g, id)\n return html\n }"
	templ = web.template.frender('templates/%s.html'%(func_name))
	return func_head + '\\\n'.join(str(templ('ID_TAG', False)).splitlines()) + func_tail

def read_plot(fn):
	try:
		with open(fn, "rb") as image_file:
			return '<img class="plot_image" src="data:image/png;base64,' + base64.b64encode(image_file.read()) + '"/>'
	except IOError:
		return '<span class="code_error">Could not read file from disc</span>'
		
def directory_tree(directory, ext='.note', basepath=''):
	file_list = []
	for root, subfolders, files in os.walk(directory):
	#print subfolders
		for file in files:
			if file.endswith(ext):
				print file, root
				file_list.append(os.path.join(root, file).replace(basepath, '', 1))

	file_list.sort()
	return file_list

def create_tree(wood, prefix=''):
	dir_list = '\n%s<ul>\n'%('\t'*prefix.count('/'))
	i = 0
	basename = prefix
	while i < len(wood):
		tree = wood[i]
		if tree.count('/') == 1:
			dir_list += '%s<li>%s</li>\n'%('\t'*prefix.count('/'), prefix + tree)
			i += 1
		else:
			dirname = os.path.dirname(tree)
			b = dirname.split('/')
			basename += '/' + b[1]
			chopped = [tr.replace('/' + b[1], '') for tr in wood if tr.startswith(dirname)]
			i += len(chopped)
			dir_list += '%s<li>+%s'%('\t'*prefix.count('/'), b[1])
			dir_list += create_tree(chopped, basename)
			dir_list += '\n%s</li>\n'%('\t'*prefix.count('/'))
	dir_list += '%s</ul>'%('\t'*prefix.count('/'))
	
	return dir_list

def plot_update_dict(dictionary):
	dictionary['content']['plot_body'] = {'content' : read_plot(dictionary['content']['plot_file']['content'])}
	return dictionary
	
def text_update_dict(dictionary):
	return dictionary

def head_update_dict(dictionary):
	return dictionary

def code_update_dict(dictionary):
	lexer = get_lexer_for_filename(dictionary['content']['code_header']['content'])
	dictionary['content']['code_body'] = {'content' : highlight(dictionary['content']['code_container'], lexer, HtmlFormatter())}
	return dictionary
	
def parse_note(fn):	
	note = {}
	note_str = ''
	with open(fn, 'r') as fin:
		data = simplejson.load(fin)
		
	content = data["notebook"]
	note["directory"] = data["directory"]
	
	for element in content:
		print element
		exec('element = %s_update_dict(element)'%(element['type']))	
		exec('div = render.%s_html(%s, %s)'%(element['type'], element['id'], element['content']))
		note_str += str(div)
		
	note["content"] = note_str
	print 'here'
	return note

def head_handler(message):	
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
	# date : os.path.getmtime(fn) should be extended with creation time.
	return simplejson.dumps({"scroller" : message['body'],
							message['date'] : os.path.getmtime(fn), 
							message['body'] : '<br>'.join([x.rstrip('\n\r') for x in lines])})

def plot_handler(message):
	code = message['content'].replace('<p>', '\n').replace('</p>', '').replace('<br>', '\n')
	print code
	exit_status = False
	pwd = os.getcwd()
	print message['directory']
	if message['directory']: os.chdir(message['directory'].strip('\n'))
	
	if code.startswith('#gnuplot') or code.startswith('# gnuplot'):
		with open(message['filename'] + '.gp', 'w') as fout:
			fout.write("set term png; set out '%s'\n"%(pwd + '/' + message['filename']) + code)
		os.system("gnuplot %s.gp"%(message['filename']))
		os.system("rm %s.gp -f"%(message['filename']))

	#else if code.statswith('%matlab') or code.statswith('% matlab'):
		#with open(message['filename'] + '.matlab', 'w') as fout:
			#fout.write("set term png; set out '%s'\n"%(message['filename']) + code)
		#os.system("matlab %s.matlab"%(message['filename']))
		#os.system("rm %s.matlab -f"%(message['filename']))
		#exit_status = read_plot(message['filename'])
		
	else:
		x = linspace(-10, 10, 100)
		try:
			exec(code)
			savefig(pwd + '/' + message['filename'])
			close()
		except:
			exit_status = traceback.format_exc().replace('\n', '<br>')

	os.chdir(pwd)
	if not exit_status:
		exit_status = read_plot(message['filename'])

	return simplejson.dumps({ "scroller" : message['body'],
						message['title'] : message['filename'], 
						message['body'] : exit_status})
	
def code_handler(message):
	print message
	sp = message['content'].rstrip('<br>').rstrip('\t').rstrip('\n').split(' ')

	fn = sp[0]
	if not os.path.exists(fn): 
		return simplejson.dumps({message['body'] : '<span class="code_error">File doesn\'t exist!</span>'})
		
	lexer = get_lexer_for_filename(fn)
	fin = open(fn, 'r')
	code = fin.read()
	fin.close()
	# TODO: read lines between limits, and also between tags
	return simplejson.dumps({message['date'] : os.path.getmtime(fn),
							message['body'] : highlight(code, lexer, HtmlFormatter()),
							message['container'] : code,
							"scroller" : message['body']})

def write_to_temp(string):
	_, tmp = tempfile.mkstemp()
	with open(tmp, 'w') as fout:
		fout.write(string)
	return tmp
	
def maxima_execute(max_string):
	tmp = write_to_temp(max_string + '\ntex(%);')
	os.system('maxima -b %s > %s.out'%(tmp, tmp))
	result = open(tmp + '.out', 'r').read()	
	os.remove(tmp)
	os.remove(tmp + '.out')
	return result
	
def text_handler(message):
	print message["content"]
	result = maxima_execute(message["content"])
	if result.find('$$') == -1:
		return simplejson.dumps({'target' : message['id'], 'success' : 'failed', 'result' : result})
	else:
		print simplejson.dumps({'target' : message['id'], 'success' : 'success', 'result' : result.split('$$')[1]})
		return simplejson.dumps({'target' : message['id'], 'success' : 'success', 'result' : result.split('$$')[1]})

def save_handler(message):
	print message
	" Writes the stipped document content to disc "
	title = message['content'][0]	
	with open(title['title'], 'w') as fout:
		#fout.write('{\n"title" : "%s",\n'%(message["doc_title"]))
		#fout.write('"directory" : "%s",\n'%(message["directory"].strip('\n')))
		fout.write('{\n"directory" : "%s",\n'%(message["directory"].strip('\n')))
		fout.write('"saved" : "%s",\n'%(message["saved"]))
		fout.write('"nothon version" : 1.1,\n')
		fout.write('"notebook" : %s\n}'%(simplejson.dumps(message['content'][1:], sort_keys=True, indent=4)))
		
	return  simplejson.dumps({'success' : 'success'})

def save_html(message):
	fin = open('static/css/main.css', 'r')
	css = fin.read()
	fin.close()
	fin = open('static/css/highlight.css', 'r')
	css += fin.read()
	fin.close()
	# TODO: If the source of the page has a link to an image, either on disc, or on the web, 
	# then that has to be resolved, and the base64 representation inserted in the html file.
	fout = open(message['title'].replace('.note', '.html'), 'w')
	# The aside (third argument) could be used for adding a table of contents to the page later on
	fout.write(str(render.saved_document(message['title'], css, 'aside', message['content'])))
	fout.close()
	return  simplejson.dumps({'success' : 'success'})

def list_handler_functions():
	return [file.split('.')[0] for file in os.listdir('static/js/') if file.startswith('_')]
	
def list_create_functions():
	return [file.split('.')[0] for file in os.listdir('static/js/') if file.endswith('_html.js')]

class Index(object):
	#print create_tree(directory_tree('/home/v923z/sandbox/nothon/', '.note', '/home/v923z/sandbox/nothon'))
	update_js()
	def GET(self):
		link = web.input(name='test.note')
		if not os.path.exists(link.name): 
			return 	render.document(link.name, 'A', False, list_handler_functions(), list_create_functions())

		print parse_note(link.name)
		return 	render.document(link.name, 'A', parse_note(link.name), list_handler_functions(), list_create_functions())

	def POST(self):
		message = simplejson.loads(web.data())
		print message
		if message['type'] in ('plot', 'head', 'code', 'text', 'save'):
			exec('result = %s_handler(message)'%(message['type']))
			return result
			
		if message['type'] == 'texteval':
			return texteval(message)
			
		if message['type'] == 'savehtml':
			return save_html(message)
			
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
