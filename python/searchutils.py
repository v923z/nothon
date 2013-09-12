import os
import simplejson
from fileutils import get_notebook

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
	content = get_notebook_content(fn)
	for element in content:
		for cell_name in element['content']:
			cell = element['content'][cell_name]
			if 'props' in cell and 'searchable' in cell['props'].split(';'):
				if cell['content'].find(string) > -1: return fn
	return False
