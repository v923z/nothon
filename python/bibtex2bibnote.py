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
				
	def reader(self, file, owner='v923z'):
		parser = bibtex.Parser()
		bibdata = parser.parse_file(file)
		self.bibliography = {}
		for count, key in enumerate(bibdata.entries):
			new_dic = {}
			new_dic['key'] = key
			new_dic['owner'] = owner
			for skey in bibdata.entries[key].fields:
				new_dic[skey] = bibdata.entries[key].fields[skey]

			new_dic['author'] = ' and '.join([', '.join(author.last() + author.first()) for author in bibdata.entries[key].persons.get('author')])
			new_dic['count'] = count+1
			new_dic['type'] = bibdata.entries[key].type
			new_dic['stars'] = 1
				
			group = bibdata.entries[key].fields.get('__markedentry')
			if group:
				# TODO: parsing the __markedentry might be a bit more complecated, if there are multiple users.
				group = group.replace('[', '').replace(']', '').split(':')[1]
				try: 
					new_dic['group'] = '%05d'%(10**(int(group)-1))
					print new_dic['group']
				except:
					new_dic['group'] = '00000'
			else:
				new_dic['group'] = '00000'
				
			fn = bibdata.entries[key].fields.get('file')
			if fn:
				nfn = []
				for part in fn.split(';'):
					nfn.append(part.split(':')[1])
					
				new_dic['file'] = ', '.join(nfn)
			
			self.bibliography['%s'%(count+1)] = new_dic

		return self.bibliography
		
	def writer(self, file):
		if self.outformat in ('bibnote'):
			data = {'type': 'bibliography', 'nothon version': self.resource.nothon_version}
			data['bibliography'] = self.bibliography
			data['date'] = datetime.datetime.now().strftime(self.resource.time_format)
			write_notebook(file, data, self.resource.bibliography_item_order)
			
if __name__ == "__main__":
	
	translator = Translator('bibnote')
	data = translator.reader(sys.argv[1])
	translator.writer(sys.argv[1].replace('.bib', '.bibnote'))
