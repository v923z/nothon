import sys
from pybtex.database.input import bibtex
from fileutils import write_notebook
import simplejson
import datetime
from resource import NothonResource

class Translator(object):
	
	def __init__(self, outformat):
		self.resource = NothonResource()
		self.outformat = outformat
		self.fields = {'author': '', 'count': '', 'file': '', 'group': '', 'id': '', 'journal': '', 'key': '', 
		'keywords': '', 'notebook': '', 'number': '', 'owner': '', 'pages': '', 'publisher': '', 'stars': '',
        'timestamp': '', 'title': '', 'type': '', 'url': '', 'volume': '', 'year': ''}
		
	def reader(self, file, owner='v923z'):
		parser = bibtex.Parser()
		bibdata = parser.parse_file(file)
		self.bibliography = {}
		for count, bib_id in enumerate(bibdata.entries):
			new_dic = self.fields
			new_dic['owner'] = owner
			for key in bibdata.entries[bib_id].fields:
				new_dic[key] = bibdata.entries[bib_id].fields[key]
			new_dic['author'] = ' and '.join([', '.join(author.last() + author.first()) for author in bibdata.entries[bib_id].persons['author']])
			new_dic['count'] = count
			new_dic['type'] = bibdata.entries[bib_id].type
			new_dic['group'] = '00000'
			
			self.bibliography['%s'%count] = new_dic

		return self.bibliography
		
	def writer(self, file):
		if self.outformat in ('bibnote'):
			data = {}
			data['bibliography'] = self.bibliography
			data['date'] = datetime.datetime.now().strftime(self.resource.time_format)
			write_notebook(file, data, self.resource.bibliography_item_order)
			
if __name__ == "__main__":
	
	translator = Translator('bibnote')
	data = translator.reader(sys.argv[1])
	translator.writer(sys.argv[1].replace('.bib', '.bibnote'))
