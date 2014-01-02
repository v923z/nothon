class NothonResource(object):
	def __init__(self):
		self.nothon_version = 1.3
		self.code_delimiter = ('*-', '-*')
		self.plot_pdf_output = True
		self.dirlisting_style = 'windows'
		self.base_path = '/home/v923z/sandbox/nothon'
		self.notebook_item_order = ['title', 'type', 'directory', 'date', 'nothon version', 'notebook']
		self.bibliography_item_order = ['type', 'date', 'nothon version', 'bibliography']
		self.time_format = '%a %b %d %Y %H:%M:%S'
		self.has_matplotlib = False
		self.has_pygments = False
		self.bibliography_bibtex = ['type', 'author', 'title', 'year', 'journal', 'page', 'key', 'url', 'doi', 'file', 'keywords', 'owner', 'timestamp']
		self.bibliography_nothon_header = ['type', 'author', 'title', 'year', 'journal', 'key', 'group', 'stars']
