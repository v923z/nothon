import simplejson
import os
import base64
from fileutils import create_notebook_folder

try:
	from pylab import *
except:
	pass
	
class Plot():
	
	def __init__(self, resource):
		self.resource = resource
		pass
		
	def read_plot(self, fn):
		try:
			with open(fn, "rb") as image_file:
				return '<img class="plot_image" src="data:image/png;base64,' + base64.b64encode(image_file.read()) + '"/>'
		except IOError:
			return '<span class="code_error">Could not read file from disc</span>'

	def handler(self, message):
		code = message['content'].replace('<p>', '\n').replace('</p>', '').replace('<br>', '\n')
		exit_status = False
		pwd = os.getcwd()
		if message['directory']: os.chdir(message['directory'].strip('<br>'))
		new_path = create_notebook_folder(message['doc_title'])
		fn = message['filename'].replace('./', '')
		print new_path, fn
		if code.startswith('#gnuplot') or code.startswith('# gnuplot'):
			with open(fn + '.gp', 'w') as fout:
				# We should make this configurable from the resource
				fout.write("set term png; set out '%s.png'\n"%(os.path.join(new_path, fn)) + code)
				if self.resource.plot_pdf_output:
					fout.write("\nset term pdfcairo; set out '%s.pdf'\n replot\n"%(os.path.join(new_path, fn)))
			os.system("gnuplot %s.gp"%(fn))
			os.system("rm %s.gp -f"%(fn))
			
		else:
			if not self.resource.has_matplotlib:
				exit_status = 'Could not import matplotlib. Choose gnuplot as the plotting back-end.'
				
			else:
				x = linspace(-10, 10, 100)
				try:
					exec(code)
					savefig(os.path.join(new_path, fn + '.png'))
					if self.resource.plot_pdf_output: 
						savefig(os.path.join(new_path, fn + '.pdf'))
					close()
				except:
					exit_status = traceback.format_exc().replace('\n', '<br>')

		os.chdir(pwd)
		if not exit_status:
			exit_status = self.read_plot(os.path.join(new_path, fn + '.png'))

		return simplejson.dumps({ "scroller" : message['body'],
							message['title'] : os.path.join(new_path, fn + '.png'), 
							message['body'] : exit_status})

	def render(self, dictionary, render):
		dictionary['content']['plot_body'] = {'content' : self.read_plot(dictionary['content']['plot_file']['content'])}
		return render.plot_html(dictionary['count'], dictionary['content'])