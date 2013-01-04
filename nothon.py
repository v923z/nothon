import web
import os
import shutil
import urllib
import base64
import simplejson

from pygments import highlight
from pygments.lexers import get_lexer_for_filename
from pygments.formatters import HtmlFormatter

# http://stackoverflow.com/questions/753052/strip-html-from-strings-in-python
# http://www.codinghorror.com/blog/2009/11/parsing-html-the-cthulhu-way.html
# http://stackoverflow.com/questions/9662346/python-code-to-remove-html-tags-from-a-string
import helper

urls = ('/',  'Index')
app = web.application(urls, globals())

from pylab import *

def retreive_header(message):
	target = message['id'].replace('head_header_', 'head_body_')
	head = message['content'].split('<br>')
	sp = head[0].split(' ')
	if not os.path.exists(sp[0]): 
		return simplejson.dumps({'target' : target, 'target_pos' : message['id'], 'content' : "File doesn't exist"})
	if len(sp) == 1: n = 10
	# TODO: elif sp[1] == '#':	
	else: n = int(sp[1])
	fin = open(sp[0], 'r')	
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
	return simplejson.dumps({'target' : target, 
							'target_pos' : message['id'], 
							'content' : '<br>'.join([x.rstrip('\n\r') for x in lines])})

def plot_code(message):
	target = message['id'].replace('plot_header_', 'plot_body_')
	x = linspace(-10, 10, 100)
	fn = message['title'] + message['id'].replace('div_plot_header_', '_') + '.png'
	code = message['content'].replace('<p>', '\n').replace('</p>', '').replace('<br>', '\n')
	print code
	# TODO: check, whether the code can be executed! a 'try, except' could probably do
	exec(code)
	savefig(fn)
	close()
	with open(fn, "rb") as image_file:
		encoded_image = base64.b64encode(image_file.read())
	return simplejson.dumps({'target' : target, 
							'title' : fn,
							'title_target' :  message['id'].replace('plot_header_', 'plot_title_'), 
							'image_data' : encoded_image})
	
def highlight_code(message):
	target = message['id'].replace('code_header_', 'code_body_')
	head = message['content'].split('<br>')
	sp = head[0].split(' ')
	fn = sp[0]
	if not os.path.exists(fn): 
		return simplejson.dumps({'target' : target, 'target_pos' : message['id'], 'content' : "File doesn't exist"})
		
	lexer = get_lexer_for_filename(fn)
	fin = open(fn, 'r')
	code = fin.read()
	fin.close()
	# TODO: read lines between limits, and also between tags
	print highlight(code, lexer, HtmlFormatter())
	return simplejson.dumps({'target' : target, 
							'target_pos' : message['id'],
							'content' : highlight(code, lexer, HtmlFormatter())})

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
            print new_string
            out_string += '\(' + new_string[f:].replace('math/tex">', '', 1) + '\)'
            
        string = string[first+last:].replace('</script>', '', 1)
        
    return out_string

def save_page(message):
	print message['content']
	fout = open(message['title'] + '.note', 'w')
	fout.write(remove_mathjax(message['content'].replace('<br>','\n')))
	fout.close()
	return  simplejson.dumps({'success' : 'success'})

def save_html(message):
	# TODO: If the source of the page has a link to an image, either on disc, or on the web, 
	# then that has to be resolved, and the base64 representation inserted in the html file.
	fout = open(message['title'] + '.html', 'w')
	fout.write(message['content'])
	fout.close()
	return  simplejson.dumps({'success' : 'success'})

class Index(object):
	def GET(self):
		raise web.seeother('/static/test.html')
			
	def POST(self):
		message = simplejson.loads(web.data())
		print message
		# This could, perhaps, be simplified, if we used something like 
		# eval(message['type'] + '_function(message)')
		if message['type'] == 'plot':
			return plot_code(message)
			
		if message['type'] == 'head':
			return retreive_header(message)
			
		if message['type'] == 'code':
			return highlight_code(message)
			
		if message['type'] == 'texteval':
			return texteval(message)

		if message['type'] == 'save':
			return save_page(message)
			
		if message['type'] == 'savehtml':
			return save_html(message)

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
