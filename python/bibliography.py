import simplejson
from fileutils import get_notebook

def parse_bibliography(fn):
	note_str = ''
		
	data = get_notebook(fn)
	bibliography = data.get('bibliography')
	if bibliography:
		for entry in bibliography:
			note_str += render_bibtex_entry(entry)
	note = {'table_content' : note_str}
	return note

def render_bibtex_entry(entry):
	table_entry = '\n\t\t\t\t\t<tr>'
	table_entry += '<td>%s</td>'%(entry.get('count', ""))
	table_entry += '<td>%s</td>'%(entry['bibtex'].get('type', "").lower())
	table_entry += '<td>%s</td>'%(render_authors(entry['bibtex']))
	table_entry += '<td>%s</td>'%(entry['bibtex'].get('title', ""))
	table_entry += '<td>%s</td>'%(entry['bibtex'].get('year', ""))
	table_entry += '<td>%s</td>'%(entry['bibtex'].get('journal', ""))
	table_entry += '<td>%s</td>'%(entry.get('owner', ""))
	table_entry += '<td>%s</td>'%(entry.get('timestamp', ""))
	table_entry += '<td>%s</td>'%(entry['bibtex'].get('key', ""))
	table_entry += '</tr>'
	
	return table_entry

def render_authors(entry):
	authors = entry.get('author')
	if not authors: return ''
	if len(authors) == 1:
		return '%s %s'%(authors[0]['given'], authors[0]['family'])
	else:
		return '%s %s et al.'%(authors[0]['given'], authors[0]['family'])
		
	#return ', '.join(['%s %s'%(author['given'], author['family']) for author in authors])
