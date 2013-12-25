import simplejson
from fileutils import get_notebook
import uuid

def parse_bibliography(fn, resource):
	body_str = ''
	data = get_notebook(fn)
	bibliography = data.get('bibliography')
	
	print resource.bibliography_nothon_header
	header_str = '<tr><th>#</th>'
	header_str += ''.join(['<th>%s</th>'%(elem) for elem in resource.bibliography_nothon_header])
	header_str += '</tr>'
	note = {'table_header' : header_str}
	if bibliography:
		for i, entry in enumerate(bibliography):
			body_str += render_bibtex_entry(i, entry, resource)
	note['table_body'] = body_str
	return note

def render_bibtex_entry(i, entry, resource):
	uid = entry.get('uuid', str(uuid.uuid4()))
	table_entry = '\n\t\t\t\t\t<tr id="%s"><td>%d</td>'%(uid, i+1)
	for element in resource.bibliography_nothon_header:
		if element in ('author'):
			table_entry += '<td>%s</td>'%(render_authors(entry))

		else: table_entry += '<td>%s</td>'%(entry.get(element, ""))
	table_entry += '</tr>'
	
	return table_entry

def render_authors(entry):
	authors = entry.get('author')
	if not authors: return ''
	if len(authors) == 1:
		return '%s %s'%(authors[0]['given'], authors[0]['family'])
	else:
		return '%s %s et al.'%(authors[0]['given'], authors[0]['family'])
