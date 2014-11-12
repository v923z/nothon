import os
import os.path
import simplejson
from fileutils import get_notebook, write_to_disc, dir_tree
import datetime
import string

class Search(object):

	def __init__(self, resource):
		self.resource = resource
		if not os.path.exists(self.resource.database):
			database = {'_metadata': {
				'type': 'database', 
				'date': datetime.datetime.now().strftime("%a %b %d %Y %H:%M:%S"),
				'nothon version': self.resource.nothon_version }}
			database['files'] = {f: i for i, f in enumerate(file_strings(self.resource.base_path))}
			write_to_disc(simplejson.dumps(database, sort_keys=True, indent=4), self.resource.database)
			
		self.db = get_notebook(self.resource.database)
		pass

	def create_database(self):
		if not self.db.get('words', False):
			for fn in self.db['files']: self.update_database(fn)
			
			write_to_disc(simplejson.dumps(self.db, sort_keys=True, indent=4), self.resource.database)
		else: pass
		
	def update_database(self, fn):
		files = self.db.get('files', {})
		words = self.db.get('words', {})
		
		if fn in files: index = files[fn]
		else: 
			index = max([files[key] for key in files])
			files[fn] = index
			
		nb = get_notebook(fn)
		for cell in nb.get('notebook', []):
			for subcell in cell.get('content'):
				if cell['content'][subcell].get('searchable', 'false') in ('true'):
					content = cell['content'][subcell].get('content', '')
					words = self.add_content_to_db(content, index, words)
		
		self.db['words'] = words
		
		
	def add_content_to_db(self, content, index, words):
		# TODO: the HTML tags have to be removed!
		splinters = content.replace('<br>', '').split()
		for w in splinters:
			word = w.lower().rstrip(',.:;!?')
			words[word] = list(set(words.get(word, [index]) + [index]))
		
		return words

def file_strings(dir):
	ret = []
	for root, dirs, files in os.walk(dir):
		for f in files:
			fullpath = os.path.join(root, f)
			if os.path.splitext(fullpath)[1] == '.note':
				ret.append(fullpath)
	ret.sort()
	return ret
				
def find_notes(dir):
	fn = []
	for path, subdirs, files in os.walk(dir):
		for name in files:
			if name.endswith('.note'): 
				fn.append(os.path.join(path, name))
			
	return fn
