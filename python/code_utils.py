from os.path import getctime, getmtime
from time import ctime

def code_arguments(string):
	sp = string.rstrip('\t').rstrip('\n').split(' ')
	if len(sp) == 0: return False, False, False
	fn = sp[0]
	tag, include = False, False
		
	if '-tag' in sp and len(sp) > sp.index('-tag'):
		tag = sp[sp.index('-tag') + 1]
		
	if '-include' in sp: include = True
		
	return fn, tag, include

class Code(object):
	
	def __init__(self, resource):
		self.resource = resource
	
	def handler(self, message):
		print message
		fn, tag, include = code_arguments(message['content'])
		message['body'], message['date'] = self.code_formatter(fn, self.resource.code_delimiter, tag, include)
		return message
		
	def code_formatter(self, fn, delimiters, tag=False, include=False):
			
		try:
			with open(fn, 'r') as fin: code_string = fin.readlines()
		except IOError:
			return '', 'FILE DOES NOT EXIST!'
							
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
		
		if state == -1: return '', 'COULDN NOT FIND FIRST TAG %s'%(delimiters[0] + ' ' + tag)
		if state == 0: return '', 'COULDN NOT FIND SECOND TAG %s'%(tag + ' ' + delimiters[1])
		return ''.join(code), 'Created: %s, modified: %s'%(ctime(getctime(fn)), ctime(getmtime(fn)))

	def render(self, dictionary, directory, render):
		return dictionary
