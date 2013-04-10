import simplejson
import os
import sys
import code_handling
from pygments import highlight
from pygments.lexers import get_lexer_for_filename, get_lexer_by_name
from pygments.formatters import LatexFormatter

from code_handling import *

def latexify(text):
	return text.replace('_', '\_').replace('#', '\#').replace('&', '\&{}').replace('%', '\%').replace('<br>', '\n\\\\ ')
	
class Latex(object):
	
	def __init__(self, filename):
		templates = [file.split('.')[0] for file in os.listdir('../templates/') if file.endswith('.tex')]
		self.template = {}
		for fn in templates:
			with open('../templates/' + fn + '.tex', 'r') as fin: 
				self.template[fn] = fin.read()

		with open(filename, 'r') as fin:
			data = simplejson.load(fin)
			
		self.content = data["notebook"]
		self.date = data["date"]
		self.title = latexify(data['title'].replace('<br>', '\n'))
		self.note = ''
		
	def parse_note(self):
		for element in self.content:
			exec('latex = latex_%s(element, self.template)'%(element['type']))
			self.note += latex
			
	pass

def latex_code(dictionary, template):	
	fn, tag, linenos, include = code_arguments(dictionary['content']['code_header']['content'])
	try:
		lexer = get_lexer_for_filename(fn)
	except:
		lexer = get_lexer_by_name('text')
	
	code_highlight = highlight(dictionary['content']['code_body']['content'], lexer, LatexFormatter(linenos=linenos))
	text = template['code']
	text = text.replace('~code.header', latexify(dictionary['content']['code_header']['content']))
	text = text.replace('~code.date', dictionary['content']['code_date']['content'])
	text = text.replace('~code.body', code_highlight) 
	return text
	
def latex_plot(dictionary, template):
	text = template['plot']
	text = text.replace('~plot.header', dictionary['content']['plot_header']['content'].replace('<p>', '\n').replace('</p>', '').replace('<br>', '\n'))
	text = text.replace('~plot.file', dictionary['content']['plot_file']['content'].replace('.png', '.pdf'))
	text = text.replace('~plot.caption', dictionary['content']['plot_caption']['content'].replace('<p>', '\n').replace('</p>', '').replace('<br>', '\n'))
	text = text.replace('~plot.label', dictionary['content']['plot_file']['content'].replace('.png', ''))
	return text

def latex_head(dictionary, template):
	text = template['head']
	text = text.replace('~head.header', latexify(dictionary['content']['head_header']['content']))
	text = text.replace('~head.body', dictionary['content']['head_body']['content'].replace('<br>', '\n'))
	text = text.replace('~head.date', dictionary['content']['head_date']['content'])
	return text

def latex_text(dictionary, template):
	# TODO: we should latexify only those segments of the text that are outside a LaTeX environment!
	text = template['text']
	header = replace_html_markups(latexify(dictionary['content']['text_header']['content']))
	body = replace_html_markups(latexify(dictionary['content']['text_body']['content']))
	text = text.replace('~text.header', header)
	text = text.replace('~text.body', body)
	return text

def replace_html_markups(text):
	text.replace('<b>', '\textbf{').replace('</b>', '}')
	text.replace('<i>', '\textit{').replace('</i>', '}')
	# TODO: we should be able to get the color from the span, and insert it, in case the user used something else
	text.replace('<span style=\"background-color: rgb(255, 255, 0);\">', '\colorbox{yellor}{').replace('</span>', '}')
	return text

if __name__=="__main__":
	if not os.path.exists(sys.argv[1]):
		print 'Input file %s does not exist!'%(sys.argv[1])
		sys.exit()
		
	fn = Latex(sys.argv[1])		 
	fn.parse_note();
	formatter = LatexFormatter()
	defs = formatter.get_style_defs()
	out = fn.template['article'].replace('~article.title', fn.title).replace('~article.content', str(fn.note)).replace('~article.defs', str(defs)).replace('~article.date', str(fn.date))
	with open(sys.argv[1].split('.')[0] + '.tex', "w") as fout:
		fout.write(out)
