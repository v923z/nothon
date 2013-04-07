import simplejson
import os
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
	text = template['text']
	text = text.replace('~text.header', latexify(dictionary['content']['text_header']['content']))
	text = text.replace('~text.body', latexify(dictionary['content']['text_body']['content']))
	return text

if __name__=="__main__":
	fn = Latex('test12.note')
	fn.parse_note();
	formatter = LatexFormatter()
	defs = formatter.get_style_defs()
	print fn.template['article'].replace('~article.title', fn.title).replace('~article.content', str(fn.note)).replace('~article.defs', str(defs)).replace('~article.date', str(fn.date))
	#print fn.note
