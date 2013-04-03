def code_formatter(fn, delimiters, tag=False, linenos=False, include=False):
	from pygments import highlight
	from pygments.lexers import get_lexer_for_filename, get_lexer_by_name
	from pygments.formatters import HtmlFormatter    
	try:
		with open(fn, 'r') as fin: code_string = fin.readlines()
	except IOError:
		return '<span class="code_error">File doesn\'t exist</span>'
    
	try:
		lexer = get_lexer_for_filename(fn)
	except:
		lexer = get_lexer_by_name('text')
        
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
    
	if state == -1: return '<span class="code_error">Couldn\'t find first tag %s</span>'%(delimiters[0] + ' ' + tag)
	if state == 0: return '<span class="code_error">Couldn\'t find second tag %s</span>'%(tag + ' ' + delimiters[1])
	return highlight(''.join(code), lexer, HtmlFormatter(linenos=linenos))

def code_arguments(string):
	sp = string.rstrip('<br>').rstrip('\t').rstrip('\n').split(' ')
	if len(sp) == 0: return False, False, False, False
	fn = sp[0]
	tag, linenos, include = False, False, False
	if '-lineno' in sp: linenos=True
		
	if '-tag' in sp and len(sp) > sp.index('-tag'):
		tag = sp[sp.index('-tag') + 1]
		
	if '-include' in sp: include = True
		
	return fn, tag, linenos, include
