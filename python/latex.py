import simplejson
import os
import sys
import code_handling
from pygments import highlight
from pygments.lexers import get_lexer_for_filename, get_lexer_by_name
from pygments.formatters import LatexFormatter
from bs4 import BeautifulSoup

from code_handling import *
import resource

nothon_resource = resource.NothonResource()

def replace_html_markups(text):
	text = text.replace('<b>', '\\textbf{').replace('</b>', '}')
	text = text.replace('<i>', '\\textit{').replace('</i>', '}')
	text = text.replace('<u>', '\\underline{').replace('</u>', '}')	
	# TODO: we should be able to get the color from the span, and insert it, in case the user used something else
	return text.replace('<span style=\"background-color: rgb(255, 255, 0);\">', '\\colorbox{yellow}{').replace('</span>', '}')

def latexify(text):
	text = text.replace('&nbsp;', '\quad').replace('_', '\_').replace('#', '\#').replace('&amp;', '\&{}')
	return text.replace('&lt;', '<').replace('&gt;', '>').replace('%', '\%').replace('<br>', '\n\\\\ ')

def preserve_markup(elem):
	return ''.join(['%s'%x for x in elem.contents])
	
def text_cell_latex(text):
	text = parse_lists(text)
	soup = BeautifulSoup(text)
	inline_math = []
	display_math = []
	for b in soup.find_all('span', {'style' : 'background-color: rgb(255, 255, 0);'}):
		b.replace_with('\\colorbox{yellow}{%s}'%(b.text))
	# We have to protect the math environments against the '_' -> '\_' replacement!
	for i, b in enumerate(soup.find_all('span', 'nothon_math')):
		inline_math.append('$%s$'%(b.text.lstrip('\\(').rstrip('\\)').replace('<br>', '')))
		b.replace_with('~~~INLINEMATH%d~~~'%(i))
	for i, b in enumerate(soup.find_all('div', 'nothon_math')):
		display_math.append('\n\\begin{equation}\n%s\n\\end{equation}\n'%(b.text.lstrip('\\[').rstrip('\\]').replace('<br>', '')))
		b.replace_with('~~~DISPLAYMATH%d~~~'%(i))
	for b in soup.find_all('span', 'note'):
		bb = b.find('span')
		b.replace_with('\\note{%s}'%preserve_markup(bb))
	for b in soup.find_all('span', 'link_span'):
		bb = b.find('a')
		b.replace_with('\\hyperref[%s]{%s}'%(bb.get('href'), bb.string))
	for b in soup.find_all('b'):
		b.replace_with('\\textbf{%s}'%preserve_markup(b))
	for b in soup.find_all('i'):
		b.replace_with('\\textit{%s}'%preserve_markup(b))
	for b in soup.find_all('u'):
		b.replace_with('\\underline{%s}'%preserve_markup(b))
	for b in soup.find_all('hr'):
		b.replace_with('\n\\hrulefill\n')
	
	text = latexify(soup.text)
	for i, math in enumerate(display_math):
		text = text.replace('~~~DISPLAYMATH%d~~~'%(i), display_math[i])
	for i, math in enumerate(inline_math):
		text = text.replace('~~~INLINEMATH%d~~~'%(i), inline_math[i])
	return text

def parse_lists(text):
	text = text.replace('<ol>', '\n\\begin{enumerate}\n').replace('</ol>', '\n\\end{enumerate}\n')
	text = text.replace('<ul>', '\n\\begin{itemize}\n').replace('</ul>', '\n\\end{itemize}\n')
	text = text.replace('<li>', '\n\\item ').replace('</li>', '')	
	return text
	    
class Latex(object):
	
	def __init__(self, filename):
		template_dir = nothon_resource.base_path + '/templates/'
		templates = [file.split('.')[0] for file in os.listdir(template_dir) if file.endswith('.tex')]
		self.template = {}
		for fn in templates:
			with open(template_dir + fn + '.tex', 'r') as fin:
				self.template[fn] = fin.read()

		with open(filename, 'r') as fin:
			data = simplejson.load(fin)
			
		self.content = data["notebook"]
		self.date = data["date"]
		self.title = latexify(data['title'].replace('<br>', ''))
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
	plot_code = dictionary['content']['plot_header']['content'].replace('<p>', '\n').replace('</p>', '').replace('<br>', '\n')
	if plot_code.startswith('#gnuplot') or plot_code.startswith('# gnuplot'):
		lexer = get_lexer_by_name('text')
	else:
		lexer = get_lexer_by_name('python')
		
	text = text.replace('~plot.header', highlight(plot_code, lexer, LatexFormatter()))
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
	body = text_cell_latex(dictionary['content']['text_body']['content'])
	header = text_cell_latex(dictionary['content']['text_header']['content'])

	text = text.replace('~text.header', header)
	text = text.replace('~text.body', body)
	return text

def latex_paragraph(dictionary, template):
	text = template['paragraph']
	body = text_cell_latex(dictionary['content']['paragraph_body']['content'])
	text = text.replace('~paragraph.body', body)
	return text

def process_note(notefile):
	fn = Latex(notefile)
	fn.parse_note();
	formatter = LatexFormatter()
	defs = formatter.get_style_defs()
	out = fn.template['article'].replace('~article.title', fn.title).replace('~article.content', (fn.note).encode('utf-8')).replace('~article.defs', str(defs)).replace('~article.date', str(fn.date))
	with open(notefile.split('.')[0] + '.tex', "w") as fout:
		fout.write(out)
		
if __name__=="__main__":
	if not os.path.exists(sys.argv[1]):
		print 'Input file %s does not exist!'%(sys.argv[1])
		sys.exit()
	
	process_note(sys.argv[1])
