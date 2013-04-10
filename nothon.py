import web
import os
import shutil
import urllib
import base64
import simplejson
import traceback
import tempfile
import time
import calendar
import sys

from pygments import highlight
from pygments.lexers import get_lexer_for_filename
from pygments.formatters import HtmlFormatter

# http://stackoverflow.com/questions/753052/strip-html-from-strings-in-python
# http://www.codinghorror.com/blog/2009/11/parsing-html-the-cthulhu-way.html
# http://stackoverflow.com/questions/9662346/python-code-to-remove-html-tags-from-a-string

from pylab import *

sys.path.insert(0, './python')
import resource
from code_handling import *
from fileutils import *

nothon_resource = resource.NothonResource()

def safe_content(dictionary, key):
	if not dictionary or key not in dictionary:
		return ""
	else:
		return dictionary[key]['content']

def safe_props(dictionary, key):
	if not dictionary or key not in dictionary:
		return ""
	elif 'props' in dictionary[key]:
		return dictionary[key]['props']
	else:
		return ""	

urls = ('/',  'Index')
render = web.template.render('templates/')
web.template.Template.globals['safe_content'] = safe_content
web.template.Template.globals['safe_props'] = safe_props
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

def plot_update_dict(dictionary):
	dictionary['content']['plot_body'] = {'content' : read_plot(dictionary['content']['plot_file']['content'])}
	return dictionary
	
def text_update_dict(dictionary):
	return dictionary

def head_update_dict(dictionary):
	return dictionary

def parse_note(fn):	
	note = {}
	note_str = ''
	with open(fn, 'r') as fin:
		data = simplejson.load(fin)
		
	content = data['notebook']
	note['directory'] = {'content' : data['directory']}
	note['title'] = {'content' : data['title']}
	
	for element in content:
		exec('element = %s_update_dict(element)'%(element['type']))	
		exec('div = render.%s_html(%s, %s)'%(element['type'], element['id'], element['content']))
		note_str += str(div)
		
	note['content'] = {'content' : note_str}
	return note

def extract_headers(fn):
	#output = "<div class='timeline_entry'>"
	output = ""
	with open(fn, 'r') as fin:
		data = simplejson.load(fin)
			
	content = data['notebook']
	for element in content:
		print element
		for cell_name in element['content']:
			cell = element['content'][cell_name]
			print cell
			if 'props' in cell and 'intoc' in cell['props'].split(';'):
				output += '<p>' + cell['content'] + '</p>'
			
	#return output + '</div>'
	return output

def is_year(year):
	if isinstance(year,basestring) or len(year) != 2:
		return False;
	try:
		y = int(year[0])
	except ValueError:
		return False
	return True

def is_month(month):
	if isinstance(month,basestring) or len(month) != 2:
		return False
	try: 
		m = int(month[0])
		if m < 1 or m > 12:
			return False
	except ValueError:
		return False
	return True

def is_day(day):
	if day.isdigit() and int(day) > 0 and int(day) <= 31:
		return True
	else:
		return False

def make_timeline():
	note = {}
	note['title'] = {'content' : "Timeline"}
	note['directory'] = {'content' : os.getcwd()}
	
	# create the html output from the directory tree
	tree = dir_tree('Calendar')
	print 'tree:', tree
	str_tl = ''
	for year in reversed(tree):
		if is_year(year):  # only include proper calendar entries
			str_tl += "<div class='timeline_year'>%s"%year[0]
			for month in reversed(year[1]):
				if is_month(month): # only include proper calendar entries
					str_tl += "<div class='timeline_month'>%s"%(calendar.month_name[int(month[0])])
					for day in reversed(month[1]):	
						d = day.replace('.note','')
						if is_day(d):
							h = None
							try:
								h = extract_headers('Calendar/%s/%s/%s'%(year[0],month[0],day))
							except simplejson.decoder.JSONDecodeError:
								print('WARNING: could not decode JSON (most probably this is not a proper nothon file)')
							if h != None:
								dayofweek = time.strftime("%A",datetime.date(int(year[0]),int(month[0]),int(d)).timetuple())
								str_tl += "<div class='timeline_day'><a href='?name=Calendar/%s/%s/%s'>%s</a>"%(year[0],month[0],day,str(dayofweek) + ' ' + d)
								str_tl += "<div class='timeline_entry'>"
								str_tl += h
								str_tl += "</div>"
								str_tl += '</div>'
					str_tl += '</div>'
			str_tl += '</div>'
	note['content'] = {'content' : str_tl}
	return note

def rec_toc(tree, path, level):
	str_tl = ""
	for elem in tree:
		if isinstance(elem,basestring):  #file
			h = None
			try:
				h = extract_headers('%s/%s'%(path,elem))
			except simplejson.decoder.JSONDecodeError:
				print('WARNING: could not decode JSON (most probably this is not a proper nothon file) - %s/%s'%(path,elem))
			if h != None:
				str_tl += "<li><a href='?name=%s/%s'>%s</a>"%(path,elem,elem)
				str_tl += "<div class='toc_entry'>"
				str_tl += h
				str_tl += "</div>"
				str_tl += '</li>'
		elif len(elem) == 2: # directory
			str_tl += "<li>%s</li>"%elem[0]
			str_tl += '<ul>\n'
			str_tl += rec_toc(elem[1],path+'/'+elem[0], level+1)
			str_tl += '</ul>\n'
		else:
			print('TOC: could not parse: ', elem)
	return str_tl

def make_toc():
	note = {}
	note['title'] = {'content' : "Table of contents"}
	note['directory'] = {'content' : os.getcwd()}
	
	# create the html output from the directory tree
	tree = dir_tree('.')
	
	# recursively traverse all directories
	str_tl = "<div class='TOC'>"
	str_tl += rec_toc(tree, '.', 0)
	str_tl += "</div>"
	
	note['content'] = {'content' : str_tl}
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
	return simplejson.dumps({"scroller" : message['body'],
							message['date'] : 'Created: %s, modified: %s'%(time.ctime(os.path.getctime(fn)), time.ctime(os.path.getmtime(fn))),  
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
	
def code_handler(message):
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
	
def text_handler(message):
	print message["content"]
	result = maxima_execute(message["content"])
	if result.find('$$') == -1:
		return simplejson.dumps({'target' : message['id'], 'success' : 'failed', 'result' : result})
	else:
		return simplejson.dumps({'target' : message['id'], 'success' : 'success', 'result' : result.split('$$')[1]})

def save_handler(message):
	print message
	" Writes the stipped document content to disc "
	with open(message['outfile'], 'w') as fout:
		fout.write('{\n"title" : "%s",\n'%(message["title"]))
		fout.write('"type": "%s",\n'%(message['type']))
		if message['type'] in ('notebook'):
			fout.write('"directory" : "%s",\n'%(message["directory"].strip('\n')))
		fout.write('"date" : "%s",\n'%(message["date"]))
		fout.write('"nothon version" : 1.2,\n')
		fout.write('"notebook" : %s\n}'%(simplejson.dumps(message['content'][1:], sort_keys=True, indent=4)))
		
	return  simplejson.dumps({'success' : 'success'})

def savehtml_handler(message):
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

def docmain_render_handler(message):
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
		aside = {"tree" : dir_html(dir_tree('.'), nothon_resource.dirlisting_style)}
		if link.name == '__timeline':
			return 	render.timeline(link.name, aside, make_timeline())
		elif link.name == '__toc':
			return 	render.toc(link.name, aside, make_toc())			
		else:
			if not os.path.exists(link.name):
				title = os.path.basename(link.name).replace('.note', '')
				path = os.path.join(os.getcwd(),os.path.dirname(link.name))
				if not os.path.exists(path):
					os.makedirs(path)
				with open(link.name, 'w') as fout:
					fout.write('{\n"title" : "%s", \n"directory" : "%s", \n"date" : "", \n"nothon version" : 1.2, \n"notebook" : []\n}'%(title, os.getcwd()))
					
			return 	render.notebook(link.name, aside, parse_note(link.name), list_handler_functions(), list_create_functions())

	def POST(self):
		message = simplejson.loads(web.data())
		print message
		if message['command'] in ('plot', 'head', 'code', 'text', 'save', 'savehtml', 'docmain_render'):
			exec('result = %s_handler(message)'%(message['command']))
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
