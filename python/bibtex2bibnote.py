import sys
from pybtex.database.input import bibtex
from fileutils import write_notebook
import simplejson
import datetime
from StringIO import StringIO
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
			entry = bibdata.entries[key]
			new_dic = {}
			new_dic['key'] = key
			new_dic['owner'] = owner
			for skey in entry.fields:
				new_dic[skey] = entry.fields[skey]

			new_dic['author'] = ' and '.join([', '.join(author.last() + author.first()) for author in entry.persons.get('author')])
			new_dic['count'] = count+1
			new_dic['type'] = entry.type.lower()
			new_dic['stars'] = 1
				
			group = entry.fields.get('__markedentry')
			if group:
				# TODO: parsing the __markedentry might be a bit more complecated, if there are multiple users.
				group = group.replace('[', '').replace(']', '').split(':')[1]
				try: 
					new_dic['group'] = '%05d'%(10**(int(group)-1))
				except:
					new_dic['group'] = '00000'
			else:
				new_dic['group'] = '00000'
				
			fn = entry.fields.get('file')
			if fn:
				nfn = []
				for part in fn.split(';'):
					nfn.append(part.split(':')[1])
					
				new_dic['file'] = ', '.join(nfn)
			
			self.bibliography['%s'%(count+1)] = new_dic

		return self.bibliography
	
	def string_reader(self, string, count=0):
		# Instead of working with a file on disc, this function parses a bibtex string
		# We assume a single bibtex entry here
		parser = bibtex.Parser()
		bibdata = parser.parse_stream(StringIO(string))
		new_dic = {}
		
		try:
			key = bibdata.entry_keys[0]
		except:
			return {'success': 'Could not parse bibtex string'}
		entry = bibdata.entries[key]
		for skey in entry.fields:
			new_dic[skey] = entry.fields[skey]

		new_dic['type'] = entry.type.lower()
		new_dic['count'] = count
		new_dic['author'] = ' and '.join([', '.join(author.last() + author.first()) for author in bibdata.entries[key].persons.get('author')])
		return {'success': 'success', 'entry': new_dic, 'count': count}
		
	def writer(self, file):
		if self.outformat in ('bibnote'):
			data = {'type': 'bibliography', 'nothon version': self.resource.nothon_version}
			data['bibliography'] = self.bibliography
			data['date'] = datetime.datetime.now().strftime(self.resource.time_format)
			write_notebook(file, data, self.resource.bibliography_item_order)
			
	def endnote(self):
		pass
	
if __name__ == "__main__":
	if len(sys.argv) < 2:
		print '\n\tSyntax: python bibtex2bibnote.py in.bib [out.bibnote]\n'
		sys.exit()
		
	if len(sys.argv) == 2: fn = sys.argv[1].replace('.bib', '.bibnote')
	else: fn = sys.argv[2]
	
	translator = Translator('bibnote')
	data = translator.reader(sys.argv[1])
	translator.writer(fn)
