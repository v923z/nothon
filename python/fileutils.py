import os

def shuffle_dir(dirlist):
	if not isinstance(dirlist[-1], tuple): return dirlist
	i = 0
	for n in dirlist:
		if isinstance(n, tuple): break
		i += 1    
	return dirlist[i:] + dirlist[0:i]

def dir_tree(dir):
	tree = []
	for item in os.listdir(dir):
		path = os.path.join(dir, item)
		if os.path.isdir(path):
			subtree = dir_tree(path)
			if len(subtree) > 0:
				tree.append((item,subtree))
		elif item.endswith('.note'):
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
