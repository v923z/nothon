class NothonResource(object):
	def __init__(self):
		self.nothon_version = 1.4
		self.server = '127.0.0.1:8080/'
		self.database = 'nothon.db'
		self.code_delimiter = ('*-', '-*')
		self.plot_pdf_output = True
		self.listed = ('.note', '.bibnote')
		self.dirlisting_style = 'windows'
		self.base_path = '/home/v923z/sandbox/nothon'
		self.notebook_item_order = ['title', 'type', 'directory', 'date', 'nothon version', 'notebook']
		self.new_notebook = {"_metadata": {
					"type": "notebook", 
					"date": "",
					"directory": "",
					"nothon version": self.nothon_version },
					"notebook": []}
		self.new_bibliography = {"_metadata": {
					"type": "bibliography", 
					"date": "",
					"directory": "",
					"nothon version": self.nothon_version },
					"bibliography": {}}
		self.plot_preamble = {'python': 'x = linspace(-20, 20, 100)'}
		self.time_format = '%a %b %d %Y %H:%M:%S'
		self.has_matplotlib = False
		self.has_pygments = False
		self.bibliography_bibtex = ['type', 'author', 'title', 'year', 'journal', 'page', 'key', 'url', 'doi', 'file', 'keywords', 'owner', 'timestamp']
		self.bibliography_nothon_header = ['type', 'author', 'title', 'year', 'journal', 'key', 'group', 'stars']
