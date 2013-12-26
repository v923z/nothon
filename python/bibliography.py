import simplejson
from fileutils import get_notebook
import uuid

class Bibliography():

	def __init__(self, resource):
		print 'init'
		self.resource = resource
	
	def handler(self, message):
		if message['sub_command'] in ('get_bibliography'):
			try:
				data = get_notebook(message['file'])
				bibliography = data.get('bibliography')
				new_bib = {}
				for element in bibliography:
					# TODO: note that this will miserably fail, if there is no uuid
					# We would have to write that to disc in parse_bibliography
					# TODO: this should be done a bit better: we should not bail out, if one entry is incorrect
					element['author'] = ' and '.join(name['given'] + ' ' + name['family'] for name in element['author'])
					new_bib[element['uuid']] = element
				return simplejson.dumps({'success' : 'success', 'bibliography' : new_bib})
			except:
				return simplejson.dumps({'success' : 'failed', 'bibliography' : None})
				
		else: return simplejson.dumps({'success' : 'failed'})


def parse_bibliography(fn, resource):
	body_str = ''
	data = get_notebook(fn)
	bibliography = data.get('bibliography')
	
	print resource.bibliography_nothon_header
	header_str = '<tr><th>#</th>'
	header_str += ''.join(['<th>%s</th>'%(elem.title()) for elem in resource.bibliography_nothon_header])
	header_str += '</tr>'
	note = {'table_header' : header_str}
	if bibliography:
		for i, entry in enumerate(bibliography):
			body_str += render_bibtex_entry(i, entry, resource)
	note['table_body'] = body_str
	note['bibliography'] = simplejson.dumps(bibliography)
	return note

def render_bibtex_entry(i, entry, resource):
	uid = entry.get('uuid', str(uuid.uuid4()))
	table_entry = '\n\t\t\t\t\t<tr id="%s"><td>%d</td>'%(uid, i+1)
	for element in resource.bibliography_nothon_header:
		if element in ('author'):
			table_entry += '<td id="%s-%s">%s</td>'%(uid, element, render_authors(entry))

		else: table_entry += '<td id="%s-%s">%s</td>'%(uid, element, entry.get(element, ""))
	table_entry += '</tr>'
	
	return table_entry

def render_authors(entry):
	authors = entry.get('author')
	if not authors: return ''
	if len(authors) == 1:
		return '%s %s'%(authors[0]['given'], authors[0]['family'])
	else:
		return '%s %s et al.'%(authors[0]['given'], authors[0]['family'])
