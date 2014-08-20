import simplejson
import os
from shutil import copytree, move
import latex
import markdown

class Zip():
	
	def __init__(self, resource):
		self.resource = resource

	def zip_notebook(self, fn, folder, zipout):
		try:
			import zipfile
		except ImportError:
			return {'success' : 'Could not import module "zipfile".'}

		def zipdir(path, zipper):
			for root, dirs, files in os.walk(path):
				for file in files:
					zipper.write(os.path.join(root, file))
		
		zipper = zipfile.ZipFile(zipout, 'w')
		zipper.write(fn)
		if os.path.exists(folder): zipdir(folder, zipper)
		zipper.close()
		return {'success' : 'success'}

class Tar():
	
	def __init__(self, resource):
		self.resource = resource

	def tar_notebook(self, fn, folder, tarout):
		try:
			import tarfile
		except ImportError:
			return {'success' : 'Could not import module "tarfile".'}
		
		tar = tarfile.open(tarout, 'w:gz')
		tar.add(fn)
		if os.path.exists(folder): tar.add(folder)
		tar.close()
		return {'success' : 'success'}

class Latex():
	
	def __init__(self, resource):
		self.resource = resource

	def process(self, fn):
		latex.process_note(fn)
		return {'success' : 'success'}


class Markdown():
	
	def __init__(self, resource):
		self.resource = resource

	def process(self, fn):
		markdown.process_note(fn)
		return {'success' : 'success'}
