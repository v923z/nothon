import simplejson
import os
from fileutils import notebook_folder
import latex
import markdown

def _save(message):	
	" Writes the stipped document content to disc "
	with open(message['notebook'], 'w') as fout:
		#nb = message
		#nb['nothon version'] = resource.nothon_version
		#print print_notebook(nb, resource.notebook_item_order)
		fout.write('{\n"title" : "%s",\n'%(message["title"]))
		fout.write('"type": "%s",\n'%(message['type']))
		if message['type'] in ('notebook'):
			fout.write('"directory" : "%s",\n'%(message["directory"].strip('<br>')))
		fout.write('"date" : "%s",\n'%(message["date"]))
		fout.write('"nothon version" : 1.3,\n')
		fout.write('"notebook" : %s\n}'%(simplejson.dumps(message['content'][1:], sort_keys=True, indent=4)))
		
class Save():
	
	def __init__(self, resource):
		self.resource = resource
		
	def handler(self, message):
		_save(message)
		return  simplejson.dumps({'success' : 'success'})

class Zip():
	
	def __init__(self, resource):
		self.resource = resource

	def zip_notebook(self, message):
		try:
			import zipfile
		except ImportError:
			return 'Could not import zipfile'

		def zipdir(path, zipper):
			for root, dirs, files in os.walk(path):
				for file in files:
					zipper.write(os.path.join(root, file))

		_save(message)
		fn = message['notebook']
		folder = notebook_folder(fn)
		zipper = zipfile.ZipFile(fn.replace('.note', '.zip'), 'w')
		zipper.write(fn)
		zipdir(folder, zipper)
		
	def handler(self, message):
		self.zip_notebook(message)
		return  simplejson.dumps({'success' : 'success'})

class Tar():
	
	def __init__(self, resource):
		self.resource = resource

	def tar_notebook(self, message):
		try:
			import tarfile
		except ImportError:
			return 'Could not import tarfile'
		
		_save(message)
		fn = message['notebook']
		folder = notebook_folder(fn)
		tar = tarfile.open(fn.replace('.note', '.tgz'), 'w:gz')
		tar.add(fn)
		tar.add(folder)
		tar.close()
		
	def handler(self, message):
		self.tar_notebook(message)
		return  simplejson.dumps({'success' : 'success'})

class Latex():
	
	def __init__(self, resource):
		self.resource = resource

	def handler(self, message):
		_save(message)
		latex.process_note(message['notebook'])
		return  simplejson.dumps({'success' : 'success'})


class Markdown():
	
	def __init__(self, resource):
		self.resource = resource

	def handler(self, message):
		_save(message)
		markdown.process_note(message['notebook'])
		return  simplejson.dumps({'success' : 'success'})
