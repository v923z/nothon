import os
import simplejson
import calendar
import datetime
import time
from random import randrange
from collections import defaultdict
import base64


def get_file_from_disc(filename):
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
	
def get_notebook(fn, new_note=False):
	if not os.path.exists(fn) and new_note:
		_save_notebook(fn, new_note)			
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

def file_list(dir, ext='.note'):
	l = []
	# TODO: We should also skip the static, and python directories, for those should not contain any documents
	if check_for_special_folder(dir, '_'): return l
	
	for item in os.listdir(dir):
		path = os.path.join(dir, item)
		if os.path.isdir(path):
			sublist = file_list(path, ext)
			if len(sublist) > 0:
				l += sublist
		elif item.endswith(ext):
			l.append(os.path.join(dir,item))
	return l

def extract_headers(fn):
	output = ""
	data = get_notebook(fn)
	content = data['notebook']
	for element in content:
		for cell_name in element['content']:
			cell = element['content'][cell_name]
			if cell.get('toc') == 'true':
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

	l = file_list('Calendar') 
	tree = defaultdict(lambda: defaultdict(lambda: defaultdict(str)))
	for fn in l:
		try:
			data = get_notebook(fn)
			(year,month,day) = data['_metadata']['raw_date'].split('.')
			tree[year][month][day] = fn
		except:
			print('WARNING: could not parse note file %s'%fn)

	for year in reversed(sorted(tree.keys())):
		str_tl += "<div class='timeline_year'>%s"%year
		for month in reversed(sorted(tree[year].keys())):
			str_tl += "<div class='timeline_month'>%s"%(calendar.month_name[int(month)])
			for day in reversed(sorted(tree[year][month].keys())):
				dayofweek = time.strftime("%A",datetime.date(int(year),int(month),int(day)).timetuple())	
				fn = tree[year][month][day]
				h = extract_headers(fn)
				dayofweek = time.strftime("%A",datetime.date(int(year),int(month),int(day)).timetuple())
				str_tl += "<li id='li_%d_%d'><a href='?name=%s'>%s</a> <input type='button' class='toc_paste_button' value='Paste'/> <input type='button' class='toc_undo_button' value='Undo'/>"%(randrange(1000000), randrange(1000000), fn, str(dayofweek) + ' ' + day)
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
			h = extract_headers('%s/%s'%(path,elem))
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
				tree_str += '<li id="?bibnote=%s" class="bibnote">%s\n'%(os.path.join(path, elem), os.path.join('', elem))
			else:
				tree_str += '<li id="?name=%s">%s\n'%(os.path.join(path, elem), os.path.join('', elem))				
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
	
def get_image(fn, directory, message):
	try:
		fn = get_file_path(fn, directory)
		# TODO: figure out image size, deal with SVG files
		ext = os.path.splitext(fn)[1]
		if ext.lower() in ('.png', '.jpg', '.jpeg', '.bmp', '.tiff'):
			with open(fn, "rb") as image_file:
				message['status'] = 'success'
				message['image_data'] = base64.b64encode(image_file.read())
	except IOError:
		message['status'] = 'failure'

	return message
