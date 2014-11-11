import os
import os.path
import simplejson
from fileutils import get_notebook, write_to_disc, dir_tree
import datetime

class Search(object):

	def __init__(self, resource):
		self.resource = resource
		pass

	def create_database(self):
		if not os.path.exists(self.resource.database):
			database = {'_metadata': {
				'type': 'database', 
				'date': datetime.datetime.now().strftime("%a %b %d %Y %H:%M:%S"),
				'nothon version': self.resource.nothon_version },
				'files': {}, 
				'words': {}}
			
			database['files'] = {f: i for i, f in enumerate(file_strings('.'))}
			print database['files']
			write_to_disc(simplejson.dumps(database, sort_keys=True, indent=4), self.resource.database)
		else: pass
		
	def update_database(self, fn):
		create_database(self.resource.database)
		with open(self.resource.database, 'r') as fin:
			db = simplejson.load(fin)
		files = db['files']
		
		if key in files: indx = files[key]
		else: indx = max([files[key] for key in files])
		
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

def find_string_in_file(filelist, string):
	flist = []
	for fn in filelist:
		ret = inspect_file(fn, string)
		if ret: flist.append(ret)
	return flist

def inspect_file(fn, string):
	content = get_notebook(fn)
	for element in content:
		for cell_name in element['content']:
			cell = element['content'][cell_name]
			if 'props' in cell and 'searchable' in cell['props'].split(';'):
				if cell['content'].find(string) > -1: return fn
	return False
