import simplejson
import os
import base64

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
		print message['directory']
		if message['directory']: os.chdir(message['directory'].strip('<br>'))
		
		if code.startswith('#gnuplot') or code.startswith('# gnuplot'):
			with open(message['filename'] + '.gp', 'w') as fout:
				fout.write("set term png; set out '%s.png'\n"%(pwd + '/' + message['filename']) + code)				
				if self.resource.plot_pdf_output:
					fout.write("\nset term pdfcairo; set out '%s.pdf'\n replot\n"%(pwd + '/' + message['filename']))
			os.system("gnuplot %s.gp"%(message['filename']))
			os.system("rm %s.gp -f"%(message['filename']))
		
		if not self.resource.has_matplotlib:
			exit_status = 'Could not import matplotlib. Choose gnuplot as the plotting back-end.'
			
		else:
			x = linspace(-10, 10, 100)
			try:
				exec(code)
				savefig(pwd + '/' + message['filename'] + '.png')
				if self.resource.plot_pdf_output: 
					savefig(pwd + '/' + message['filename'] + '.pdf')
				close()
			except:
				exit_status = traceback.format_exc().replace('\n', '<br>')

		os.chdir(pwd)
		if not exit_status:
			exit_status = self.read_plot(message['filename'] + '.png')

		return simplejson.dumps({ "scroller" : message['body'],
							message['title'] : message['filename'] + '.png', 
							message['body'] : exit_status})

	def render(self, dictionary, render):
		dictionary['content']['plot_body'] = {'content' : self.read_plot(dictionary['content']['plot_file']['content'])}
		return render.plot_html(dictionary['count'], dictionary['content'])
