import simplejson
import os
from time import ctime


class Head(object):

	def __init__(self, resource):
		self.resource = resource
	
	def handler(self, message):
		head = message['content'].rstrip('\t').rstrip('\n')
		sp = head.split(' ')
		fn = sp[0]
		if not os.path.exists(fn): 
			message['date'] = 'FILE DOES NOT EXIST'
			message['body'] = ''
			return message
		if len(sp) == 1: n = 10
		# TODO: elif sp[1] == '#':	
		# TODO: implement 'grep' function
		else: n = int(sp[1])
		with open(fn, 'r') as fin:
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
		
		message['body'] = '\n'.join(lines)
		message['date'] = 'Created: %s, modified: %s'%(ctime(os.path.getctime(fn)), ctime(os.path.getmtime(fn)))
		return message

	def render(self, dictionary, directory, render):
		return dictionary
