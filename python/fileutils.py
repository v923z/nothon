import os
import simplejson
import calendar
import datetime
import time
from random import randrange

def create_notebook_folder(fn):
	# Creates the helper folder beginning with _fn
	new_path = notebook_folder(fn)
	if not os.path.exists(new_path): 
		os.makedirs(new_path)
	return new_path

def notebook_folder(fn):
	path, stem = os.path.split(fn)
	return os.path.join(path, '_' + stem.split('.')[0])
	
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

def dir_html(tree, dirlisting_style):
	tree_string = '<ul>'
	if dirlisting_style == 'windows':  tree = shuffle_dir(tree)
	for n in tree:
		if isinstance(n,tuple):
			tree_string += '<li id="%s" class="folder">%s\n'%(n[0], n[0])
			tree_string += dir_html(n[1], dirlisting_style)
		else:
			tree_string += '<li id="%s"><a href="?name=%s">%s</a>\n'%(n, n, n)

	return tree_string + '</ul>\n'


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
								h = extract_headers('Calendar/%s/%s/%s'%(year[0],month[0],day))
							except simplejson.decoder.JSONDecodeError:
								print('WARNING: could not decode JSON (most probably this is not a proper nothon file)')
							if h != None:
								dayofweek = time.strftime("%A",datetime.date(int(year[0]),int(month[0]),int(d)).timetuple())
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
				str_tl += "<li id='li_%d_%d'><a href='?name=%s/%s'>%s</a> <input type='button' class='toc_paste_button' value='Paste'/> <input type='button' class='toc_undo_button' value='Undo'/>"%(randrange(1000000), randrange(1000000), path, elem, elem)
				str_tl += "<div class='toc_entry'>"
				str_tl += h
				str_tl += "</div>"
				str_tl += '</li>'
		elif len(elem) == 2: # directory
			str_tl += "<li>%s</li>"%elem[0]
			str_tl += '<ul>\n'
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

def unwrap_bibtree(tree, path):
	tree_str = ''
	for elem in tree:
		if isinstance(elem, basestring):  #file
			tree_str += "<li><a href='?name=%s/%s'>%s</a>"%(path, elem, os.path.join(path, elem))
		elif len(elem) == 2: 	# directory
			tree_str += "<li>%s</li>"%(elem[0])
			tree_str += '<ul>\n'
			tree_str += unwrap_bibtree(elem[1], os.path.join(path, elem[0]))
			tree_str += '</ul>\n'
	return tree_str


def make_bibliography():
	tree = dir_tree('.', '.bibnote')
	bib_str = "<div class='TOC'>"
	bib_str += unwrap_bibtree(tree, '.')
	bib_str += "</div>"
	
	return {'content' : {'content' : bib_str} }
	
