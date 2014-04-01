import os
import simplejson
import calendar
import datetime
import time
from random import randrange

def get_file_from_disc(file):
	# TODO: resolve relative paths
	if os.path.exists(file):
		try:
			f = open(file, 'r')
			return f.read()
		except:
			return 'Could not load file %s'%(file)
	else:
			return 'File %s does not exist'%(file)

def _save_notebook(fn, nb):
	return write_to_disc(simplejson.dumps(nb, sort_keys=True, indent=4), fn)
	
def print_notebook(nb, objects):
	def safe_notebook_cell(nb, obj):
		if obj in nb: return simplejson.dumps(nb[obj], sort_keys=True, indent=4)
		return '""'
	
	nb_str = '{\n'	
	nb_str += ',\n'.join(['"%s" : %s'%(obj, safe_notebook_cell(nb, obj)) for obj in objects])
	nb_str += '\n}'
	return nb_str

def write_to_disc(string, fn):
	try:
		with open(fn, 'w') as fout:
			fout.write(string.encode('utf-8'))
		return {'success': 'success'}
	except EnvironmentError: 
		return {'success': 'Could not write file %s'%(fn)}
	
def write_notebook(fn, nb, objects):
	return write_to_disc(print_notebook(nb, objects), fn)
		
def create_notebook_folder(fn):
	# Creates the helper folder beginning with _fn
	new_path = notebook_folder(fn)
	if not os.path.exists(new_path): 
		os.makedirs(new_path)
	return new_path

def notebook_folder(fn):
	path, stem = os.path.split(fn)
	# create a hidden folder
	return os.path.join(path, '_' + stem)
	
def get_file_path(fn, base_path):
	# This function returns the filepath, based on, whether the user intended an absolute, or a relative path
	if fn.startswith('/'): return fn
	elif fn.startswith('./'): return os.path.join(base_path, fn)
	else: return fn
	
def get_notebook(fn):
	with open(fn, 'r') as fin:
		data = simplejson.load(fin)
	return data

def shuffle_dir(dirlist):
	if not isinstance(dirlist[-1], tuple): return dirlist
	i = 0
	for n in dirlist:
		if isinstance(n, tuple): break
		i += 1    
	return dirlist[i:] + dirlist[:i]

def check_for_special_folder(dir, marker):
	last_dir = dir.rstrip(os.sep).split(os.sep)[-1]
	if last_dir.startswith(marker): return True
	return False
	
def dir_tree(dir, ext='.note'):
	tree = []
	# TODO: We should also skip the static, and python directories, for those should not contain any documents
	if check_for_special_folder(dir, '_'): return tree
	
	for item in os.listdir(dir):
		path = os.path.join(dir, item)
		if os.path.isdir(path):
			subtree = dir_tree(path, ext)
			if len(subtree) > 0:
				tree.append((item, subtree))
		elif item.endswith(ext):
			tree.append(item)
	tree.sort()
	return tree

def extract_headers(fn):
	output = ""
	data = get_notebook(fn)
	content = data['notebook']
	for element in content:
		for cell_name in element['content']:
			cell = element['content'][cell_name]
			if 'props' in cell and 'intoc' in cell['props'].split(';'):
				output += '<p><input type="checkbox"/><a href="?name=%s#%s" class="toc_link">'%(fn, element['id']) + cell['content'] + '</a></p>'
			
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
								# TODO: This is probably unsafe: it won't work on windows
								h = extract_headers('Calendar/%s/%s/%s'%(year[0],month[0],day))
							except simplejson.decoder.JSONDecodeError:
								print('WARNING: could not decode JSON (most probably this is not a proper nothon file)')
							if h != None:
								dayofweek = time.strftime("%A",datetime.date(int(year[0]),int(month[0]),int(d)).timetuple())
								# TODO: This is probably unsafe: it won't work on windows
								str_tl += "<li id='li_%d_%d'><a href='?name=Calendar/%s/%s/%s'>%s</a> <input type='button' class='toc_paste_button' value='Paste'/> <input type='button' class='toc_undo_button' value='Undo'/>"%(randrange(1000000), randrange(1000000), year[0], month[0], day, str(dayofweek) + ' ' + d)
								str_tl += "<div class='toc_entry'>"
								str_tl += h
								str_tl += "</div>"
								str_tl += '</li>'
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
				# TODO: This is probably unsafe: it won't work on windows
				str_tl += "<li id='li_%d_%d'><a href='?name=%s/%s'>%s</a> <input type='button' class='toc_paste_button' value='Paste'/> <input type='button' class='toc_undo_button' value='Undo'/>"%(randrange(1000000), randrange(1000000), path, elem, elem)
				str_tl += "<div class='toc_entry'>"
				str_tl += h
				str_tl += "</div>"
				str_tl += '</li>'
		elif len(elem) == 2: # directory
			str_tl += "<li>%s</li>"%elem[0]
			str_tl += '<ul>\n'
			# TODO: This is probably unsafe: it won't work on windows
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

def unwrap_tree(tree, path, dirlisting_style):
	if dirlisting_style == 'windows':  tree = shuffle_dir(tree)

	tree_str = '<ul>\n'
	for elem in tree:
		if isinstance(elem, basestring):  #file
			if elem.endswith('.bibnote'):
				tree_str += '<li id="%s" data="addClass: \'bibnote\'"><a href="?bibnote=%s">%s</a>\n'%(os.path.join(path, elem), os.path.join(path, elem), os.path.join('', elem))
			else:
				tree_str += '<li id="%s"><a href="?name=%s">%s</a>\n'%(os.path.join(path, elem), os.path.join(path, elem), os.path.join('', elem))				
		elif len(elem) == 2: 	# directory
			tree_str += '<li id="%s" class="folder">%s\n'%(elem[0], elem[0])
			tree_str += unwrap_tree(elem[1], os.path.join(path, elem[0]), dirlisting_style)
	return tree_str + '</ul>\n'


def make_bibliography():
	tree = dir_tree('.', '.bibnote')
	bib_str = "<div class='TOC'>"
	bib_str += unwrap_tree(tree, '.', None)
	bib_str += "</div>"
	
	return {'content' : {'content' : bib_str} }
	
