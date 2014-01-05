import simplejson
import os
import time
#from resource import NothonResource

# We have to check for non-standard packages, so that we can run on android
try:
	from pygments import highlight
	from pygments.lexers import get_lexer_for_filename, get_lexer_by_name
	from pygments.formatters import HtmlFormatter
	has_pygments = True			
except ImportError:
	print 'nothing to import'
	has_pygments = False

def code_arguments(string):
	sp = string.rstrip('<br>').rstrip('\t').rstrip('\n').split(' ')
	if len(sp) == 0: return False, False, False, False
	fn = sp[0]
	tag, linenos, include = False, False, False
	if '-lineno' in sp: linenos=True
		
	if '-tag' in sp and len(sp) > sp.index('-tag'):
		tag = sp[sp.index('-tag') + 1]
		
	if '-include' in sp: include = True
		
	return fn, tag, linenos, include

class Code(object):
	
	def __init__(self, resource):
		#if resource is None:
			#resource = NothonResource()
		self.resource = resource
		self.resource.has_pygments = has_pygments
	
	def handler(self, message):
		print message
		fn, tag, linenos, include = code_arguments(message['content'])
		return {message.get('date'): 'Created: %s, modified: %s'%(time.ctime(os.path.getctime(fn)), time.ctime(os.path.getmtime(fn))),
				message.get('body'): self.code_formatter(fn, self.resource.code_delimiter, tag, linenos, include), 
				'scroller': message.get('body')}

	def code_formatter(self, fn, delimiters, tag=False, linenos=False, include=False):
			
		try:
			with open(fn, 'r') as fin: code_string = fin.readlines()
		except IOError:
			return '<span class="code_error">File doesn\'t exist</span>'
	
		lexer = None
		try:
			if self.resource.has_pygments: lexer = get_lexer_for_filename(fn)
		except:
			if self.resource.has_pygments: lexer = get_lexer_by_name('text')
						
		code = []
		state = -1
		if not tag: state = 2
		for line in code_string:
			if state > -1: code.append(line)
			if state == 2: continue
			nl = ''.join(line.split())
			if nl.find(delimiters[0] + tag) > -1:
				if include: code.append(line)
				state = 0
			if nl.find(tag + delimiters[1]) > -1 and state == 0:
				if not include: code.pop()
				state = 1
				break
		
		if state == -1: return '<span class="code_error">Couldn\'t find first tag %s</span>'%(delimiters[0] + ' ' + tag)
		if state == 0: return '<span class="code_error">Couldn\'t find second tag %s</span>'%(tag + ' ' + delimiters[1])
		if not lexer: return ''.join(code)
		return highlight(''.join(code), lexer, HtmlFormatter(linenos=linenos))

	def render(self, dictionary, directory, render):
		fn, tag, linenos, include = code_arguments(dictionary['content']['code_header']['content'])
		try:
			if self.resource.has_pygments: lexer = get_lexer_for_filename(fn)
		except:
			if self.resource.has_pygments: lexer = get_lexer_by_name('text')
		
		if self.resource.has_pygments:	
			dictionary['content']['code_body']['content'] = highlight(dictionary['content']['code_body']['content'], lexer, HtmlFormatter(linenos=linenos))
		return render.code_html(dictionary['count'], dictionary['content'])
