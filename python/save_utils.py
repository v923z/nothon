import simplejson
import os
from shutil import copytree, move
from fileutils import notebook_folder
import latex
import markdown
from cell_utils import write_notebook

def _save(message, fn, resource):
	" Writes the stipped document content to disc "
	nb = { 'title' : message['title'],
			'type' : message['type'],
			'date' : message['date'],
			'directory' : message["directory"].strip('<br>'), 
			'nothon version' : resource.nothon_version
	}

	if message['type'] in ('notebook'):
		nb['notebook'] = message['notebook']
		write_notebook(fn, nb, resource.notebook_item_order)
	# This is probably not needed: saving of the bibliography is handled through the bibliography class
	if message['type'] in ('bibliography'):
		nb['bibliography'] = message['bibliography']
		write_bibliography(fn, nb, resource.bibliography_item_order)
		
class Save():
	
	def __init__(self, resource):
		self.resource = resource
		
	def handler(self, message):
		print message['sub_command']
		if message['sub_command'] in ('save_notebook_as', 'rename_notebook'):
			if os.path.exists(message['notebook_address']):
				success = 'File %s already exists.\n Choose a different name'%(message['notebook_address'])
			else:
				_save(message, message['notebook_address'], self.resource)
				if message['sub_command'] in ('save_notebook_as'):
					copytree(notebook_folder(message['file']), notebook_folder(message['notebook_address']))
				if message['sub_command'] in ('rename_notebook'):
					move(notebook_folder(message['file']), notebook_folder(message['notebook_address']))
					os.rename(message['file'], message['notebook_address'])
				success = 'success'
		else:		
			try:
				_save(message, message['file'], self.resource)
				success = 'success'
			except:
				success = 'failed'
		return  simplejson.dumps({'success' : success, 'notebook_address': message['notebook_address']})

class Zip():
	
	def __init__(self, resource):
		self.resource = resource

	def zip_notebook(self, message):
		try:
			import zipfile
		except ImportError:
			return simplejson.dumps({'success' : 'Could not import module "zipfile".'})

		def zipdir(path, zipper):
			for root, dirs, files in os.walk(path):
				for file in files:
					zipper.write(os.path.join(root, file))

		_save(message, message['file'], self.resource)
		fn = message['notebook']
		folder = notebook_folder(fn)
		zipper = zipfile.ZipFile(fn.replace('.note', '.zip'), 'w')
		zipper.write(fn)
		if os.path.exists(folder): zipdir(folder, zipper)
		zipper.close()
		return simplejson.dumps({'success' : 'success'})
		
	def handler(self, message):
		return self.zip_notebook(message)

class Tar():
	
	def __init__(self, resource):
		self.resource = resource

	def tar_notebook(self, message):
		try:
			import tarfile
		except ImportError:
			return simplejson.dumps({'success' : 'Could not import module "tarfile".'})

		_save(message, message['file'], self.resource)
		fn = message['notebook']
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
		_save(message, message['file'], self.resource)
		latex.process_note(message['notebook'])
		return  simplejson.dumps({'success' : 'success'})


class Markdown():
	
	def __init__(self, resource):
		self.resource = resource

	def handler(self, message):
		_save(message, message['file'], self.resource)
		markdown.process_note(message['notebook'])
		return  simplejson.dumps({'success' : 'success'})
