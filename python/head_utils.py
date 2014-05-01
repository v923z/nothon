import simplejson
import os
import time

class Head(object):

	def __init__(self, resource):
		self.resource = resource
	
	def handler(self, message):
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
		return simplejson.dumps({"scroller" : message.get('body'),
								message.get('date') : 'Created: %s, modified: %s'%(time.ctime(os.path.getctime(fn)), time.ctime(os.path.getmtime(fn))),  
								message.get('body') : '<br>'.join([x.rstrip('\n\r') for x in lines])})

	def render(self, dictionary, directory, render):
		return dictionary
		#return render.head_html(dictionary['count'], dictionary['content'])
