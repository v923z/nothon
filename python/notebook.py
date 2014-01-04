from python.plot_utils import Plot
from python.head_utils import Head
from python.code_utils import Code

class Notebook(object):
	""" Entry point for handling notebook files """
		
	def __init__(self, resource):
		self.resource = resource
		
	def handler(self, message):
		if message.get('sub_command') in ('plot', 'head', 'code'):
			exec('obj = %s(nothon_resource)'%(message.get('command').title()))
			return obj.handler(message)

			
	def parse_note(self):
		pass
		
	def zip_notebook(self, message):
		try:
			import zipfile
		except ImportError:
			return simplejson.dumps({'success' : 'Could not import module "zipfile".'})

		def zipdir(path, zipper):
			for root, dirs, files in os.walk(path):
				for file in files:
					zipper.write(os.path.join(root, file))

		save_notebook(message, message['file'], self.resource)
		fn = message.get('file')
		folder = notebook_folder(fn)
		zipper = zipfile.ZipFile(fn.replace('.note', '.zip'), 'w')
		zipper.write(fn)
		if os.path.exists(folder): zipdir(folder, zipper)
		zipper.close()
		return simplejson.dumps({'success' : 'success'})
		
	def handler(self, message):
		return self.zip_notebook(message)

	def tar_notebook(self, message):
		try:
			import tarfile
		except ImportError:
			return simplejson.dumps({'success' : 'Could not import module "tarfile".'})

		save_notebook(message, message['file'], self.resource)
		fn = message.get('file')
		folder = notebook_folder(fn)
		tar = tarfile.open(fn.replace('.note', '.tgz'), 'w:gz')
		tar.add(fn)
		if os.path.exists(folder): tar.add(folder)
		tar.close()
		return simplejson.dumps({'success' : 'success'})
		
	def handler(self, message):
		return self.tar_notebook(message)

class Latex():
	
	def __init__(self, resource):
		self.resource = resource

	def handler(self, message):
		save_notebook(message, message['file'], self.resource)
		latex.process_note(message.get('file'))
		return  simplejson.dumps({'success' : 'success'})


class Markdown():
	
	def __init__(self, resource):
		self.resource = resource

	def handler(self, message):
		save_notebook(message, message['file'], self.resource)
		markdown.process_note(message.get('file'))
		return  simplejson.dumps({'success' : 'success'})

	
