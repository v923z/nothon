import web
import os
import shutil
import urllib
import base64
import simplejson
import traceback

from pygments import highlight
from pygments.lexers import get_lexer_for_filename
from pygments.formatters import HtmlFormatter

# http://stackoverflow.com/questions/753052/strip-html-from-strings-in-python
# http://www.codinghorror.com/blog/2009/11/parsing-html-the-cthulhu-way.html
# http://stackoverflow.com/questions/9662346/python-code-to-remove-html-tags-from-a-string
#import helper
from pylab import *

urls = ('/',  'Index')
app = web.application(urls, globals())
render = web.template.render('templates/')

tags = ('<text>', '<header>', '<plot>', '<code>')
order = ('title', 'head', 'body')

def update_js():
	list_of_files = [file.split('.')[0] for file in os.listdir('templates/') if file.endswith('_html.html')]
	for fn in list_of_files:
		if not os.path.exists('static/js/%s.js'%(fn)) or os.path.getmtime('templates/%s.html'%(fn)) > os.path.getmtime('static/js/%s.js'%(fn)):
			with open('static/js/%s.js'%(fn), "w") as fout:
				fout.write(create_js(fn))
		
def create_js(func_name):
	func_head = "function %s(id) { \n\thtml = '"%(func_name)
	func_tail = "'.replace(/ID_TAG/g, id)\n return html\n }"
	templ = web.template.frender('templates/%s.html'%(func_name))
	return func_head + '\\\n\t'.join(str(templ('ID_TAG', False)).splitlines()) + func_tail

def read_plot(fn):
	try:
		with open(fn, "rb") as image_file:
			return base64.b64encode(image_file.read())
	except IOError:
		return False
		
def render_note(fn):
	# TODO: check, if the notebook exists, and not, return some default page.
	fin = open(fn, 'r')
	string = fin.read()
	fin.close()
	string, elements = parse_note(string, tags)
	html_content = ''
	text_counter, header_counter, plot_counter, code_counter = 0, 0, 0, 0
	for element in elements:
		if element['type'] == 'text':
			text_counter += 1
			html_content += str(render.text(text_counter, element['head'], element['body']))
		if element['type'] == 'header':
			header_counter += 1
			html_content += render.header(header_counter, "here", "there")
		if element['type'] == 'plot':
			plot_counter += 1
			image = read_plot(element['title'])
			html_content += str(render.plot(plot_counter, element['head'], element['title'], image))
		if element['type'] == 'code':
			code_counter += 1
			fn = element['head'].split(' ')[0]
			lexer = get_lexer_for_filename(fn)
			print highlight(code, lexer, HtmlFormatter())
			html_content += render.code(code_counter, 
							element['head'], element['title'], 
							highlight(element['body'], lexer, HtmlFormatter()), element['body'])
	
	fout = open('tt.html', 'w')
	fout.write(str(render.document("title", "aside", html_content)))
	fout.close()
	
def parse_note(string, tags, elements=[]):
    " Takes a notebook file, and turns it into a list of dictionaries "
    indices = []
    for tag in tags:
        i = string.find(tag)
        if i > -1: indices.append([i, tag])
    if len(indices) == 0: 
        return string, elements
    
    indices.sort(key=lambda x: x[0])
    string = string[indices[0][0]:]
    start_tag = indices[0][1]
    elem_type = start_tag[1:-1]
    string, elem = extract_content(string, elem_type)
    elements.append(elem)
    if len(string) > 0:
        string, elements = parse_note(string, tags, elements)
    return string, elements
    
def extract_content(string, elem_type):
    " In the notebook file, the order of the parts in each element should be title, head,  body"
    title, head, body = '', '', ''
    start = string.find('<title>')
    end = string.find('</title>')
    abs_end = string.find('</%s>'%elem_type)
    if start > -1 and end > -1 and start < abs_end:
        title = string[start+len('<title>'):end]
        string = string[end+len('</title>'):]

    start = string.find('<head>')
    end = string.find('</head>')
    if start > -1 and end > -1:
        head = string[start+len('<head>'):end]
        string = string[end+len('</head>'):]
        
    start = string.find('<body>')
    end = string.find('</body>')
    if start > -1 and end > -1:
        body = string[start+len('<body>'):end]
        string = string[end+len('</body>'):]
        
    start = string.find('</%s>'%elem_type)
    if start > -1: string = string[start + len('</%s>'%elem_type):]
    return string, {"type" : elem_type, "title" : title, "head" : head, "body": body}

def head_data(message):
	scroller = message['id'].replace('div_head_header_', 'div_head_main_')
	body = message['id'].replace('div_head_header_', 'div_head_body_')
	container = message['id'].replace('div_head_header_', 'div_head_container_')
	date = message['id'].replace('div_head_header_', 'div_head_date_')
	
	head = message['content'].rstrip('<br>').rstrip('\t')
	sp = head.split(' ')
	fn = sp[0]
	if not os.path.exists(fn): 
		return simplejson.dumps({body : '<span class="head_error">File doesn\'t exist</span>', date : ''})
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
	return simplejson.dumps({"scroller" : scroller,
							date : os.path.getmtime(fn), 
							body : '<br>'.join([x.rstrip('\n\r') for x in lines])})

def plot_data(message):
	x = linspace(-10, 10, 100)
	fn = message['title'] + message['id'].replace('div_plot_header_', '_') + '.png'
	scroller = message['id'].replace('div_plot_header_', 'div_plot_main_')
	body = message['id'].replace('div_plot_header_', 'div_plot_body_')
	title = message['id'].replace('div_plot_header_', 'div_plot_title_')
	code = message['content'].replace('<p>', '\n').replace('</p>', '').replace('<br>', '\n')
	print code
	try:
		exec(code)
		savefig(fn)
		close()
		with open(fn, "rb") as image_file:
			encoded_image = base64.b64encode(image_file.read())
		return simplejson.dumps({ "scroller" : scroller,
							title : fn, 
							body : '<img class="plot_image" src="data:image/png;base64,' + encoded_image + '"/>'})
	except:
		return simplejson.dumps({ "scroller" : scroller,
								title : '', 
								body : traceback.format_exc()})
	
	
def code_data(message):
	sp = message['content'].split(' ')
	scroller = message['id'].replace('div_code_header_', 'div_code_main_')
	body = message['id'].replace('div_code_header_', 'div_code_body_')
	container = message['id'].replace('div_code_header_', 'div_code_container_')
	date = message['id'].replace('div_code_header_', 'div_code_date_')

	fn = sp[0]
	if not os.path.exists(fn): 
		return simplejson.dumps({body : '<span class="code_error">File doesn\'t exist!</span>'})
		
	lexer = get_lexer_for_filename(fn)
	fin = open(fn, 'r')
	code = fin.read()
	fin.close()
	# TODO: read lines between limits, and also between tags
	print highlight(code, lexer, HtmlFormatter())
	return simplejson.dumps({date : os.path.getmtime(fn),
							body : highlight(code, lexer, HtmlFormatter()),
							container : code,
							"scroller" : scroller})

def texteval(message):
	print message['content']
	lines = message['content'].rstrip('<br>').split('<br>')
	print lines
	if lines[-1].find('..img::') > 0:
		img_path = lines[-1][lines[-1].find('..img::'):].lstrip('..img::')
		print img_path	
		return simplejson.dumps({'target' : message['id'], 
							'success' : 'success', 
							'content' : '<img src="%s"></img>'%img_path})

	# TODO: check, whether the evaluation was successful. Use the 'success' tag for that
	print lines[-1].replace('&nbsp;', ' ').rstrip('<br>').rstrip('=')
	result = eval(lines[-1].replace('&nbsp;', ' ').rstrip('<br>').rstrip('='))
	print simplejson.dumps({'target' : message['id'], 
							'success' : 'success', 
							'content' : result})
	

	return simplejson.dumps({'target' : message['id'], 
							'success' : 'success', 
							'content' : result})

def remove_mathjax(string):
	""" 
	Strips the innerHTML of a div of the mathjax code, and returns the text, 
	and formatted LaTeX code
	"""	
	out_string = ''
	first = string.find('<span class="MathJax_Preview">')
	if first < 0:
		return string

	while True:    
		first = string.find('<span class="MathJax_Preview">')
		if first < 0:
			out_string += string
			break
		out_string += string[:first]

		second = string[first:].find('<script id=')
		last = string[first:].find('</script>')
		new_string = string[first+second:first+last]
		if new_string.find("mode=display") > -1:
			f = new_string.find("mode=display")
			out_string += '\[\n' + new_string[f:].replace('mode=display">', '', 1) + '\n\]\n'
		else:
			f = new_string.find('math/tex')
			out_string += '\(' + new_string[f:].replace('math/tex">', '', 1) + '\)'

		string = string[first+last:].replace('</script>', '', 1)

	return out_string

def raw_text(message):
	return simplejson.dumps({'target' : message['id'],
							'content' : remove_mathjax(message['content'])})

def save_page(message):
	" Writes the stipped document content to disc "
	
	print message['content']
	fout = open(message['title'] + '.note', 'w')
	fout.write(remove_mathjax(message['content'].replace('<br>','\n')))
	fout.close()
	return  simplejson.dumps({'success' : 'success'})

def save_html(message):
	fin = open('static/css/main.css', 'r')
	css = fin.read()
	fin.close()
	fin = open('static/css/highlight.css', 'r')
	css += fin.read()
	fin.close()
	print message['content']
	# TODO: If the source of the page has a link to an image, either on disc, or on the web, 
	# then that has to be resolved, and the base64 representation inserted in the html file.
	fout = open(message['title'] + '.html', 'w')
	# The aside (third argument) could be used for adding a table of contents to the page later on
	fout.write(str(render.saved_document(message['title'], css, 'aside', message['content'])))
	fout.close()
	return  simplejson.dumps({'success' : 'success'})

class Index(object):
	#render_note('nothon.note')
	update_js()
	def GET(self):
		link = web.input(name='/static/test.html')
		web.seeother('/static/test.html')
			
	def POST(self):
		message = simplejson.loads(web.data())
		print message
		# This could, perhaps, be simplified, if we used something like 
		# eval(message['type'] + '_function(message)')
		if message['type'] == 'plot':
			return plot_data(message)
			
		if message['type'] == 'head':
			return head_data(message)
			
		if message['type'] == 'code':
			return code_data(message)
			
		if message['type'] == 'texteval':
			return texteval(message)

		if message['type'] == 'save':
			return save_page(message)
			
		if message['type'] == 'savehtml':
			return save_html(message)
			
		if message['type'] == 'raw_text':
			return raw_text(message)
			
		else:
			return simplejson.dumps(message)

app = web.application(urls, globals())
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
