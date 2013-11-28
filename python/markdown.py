import simplejson
import os
import sys
try:
	from bs4 import BeautifulSoup
except ImportError:
	from BeautifulSoup import BeautifulSoup

def preserve_markup(elem):
	return ''.join(['%s'%x for x in elem.contents])

def markdownify(text):
	text = text.replace('&nbsp;', '  ')
	return text.replace('<br>', '\n')
	
def text_cell_markdown(text):
	text = parse_lists(text)
	soup = BeautifulSoup(text)
	inline_math = []
	display_math = []
	for b in soup.find_all('span', {'style' : 'background-color: rgb(255, 255, 0);'}):
		b.replace_with('\\colorbox{yellow}{%s}'%(b.text))
	# We have to protect the math environments against the '_' -> '\_' replacement!
	for i, b in enumerate(soup.find_all('span', 'nothon_math')):
		inline_math.append('$%s$'%(b.text.replace('\\(', '').replace('\\)', '').replace('<br>', '')))
		b.replace_with('~~~INLINEMATH%d~~~'%(i))
	for i, b in enumerate(soup.find_all('div', 'nothon_math')):
		display_math.append('\n\\begin{equation}\n%s\n\\end{equation}\n'%(b.text.replace('\\[', '').replace('\\]', '').replace('<br>', '\n')))
		b.replace_with('~~~DISPLAYMATH%d~~~'%(i))
	for b in soup.find_all('span', 'note'):
		bb = b.find('span')
		b.replace_with('\\note{%s}'%preserve_markup(bb))
	for b in soup.find_all('span', 'link_span'):
		bb = b.find('a')
		b.replace_with('\\hyperref[%s]{%s}'%(bb.get('href'), bb.string))
	for b in soup.find_all('b'):
		b.replace_with('**%s**'%preserve_markup(b))
	for b in soup.find_all('i'):
		b.replace_with('*%s*'%preserve_markup(b))
	for b in soup.find_all('u'):
		b.replace_with('\\underline{%s}'%preserve_markup(b))
	for b in soup.find_all('hr'):
		b.replace_with('\n\\hrulefill\n')
	
	text = markdownify(soup.text)
	for i, math in enumerate(display_math):
		text = text.replace('~~~DISPLAYMATH%d~~~'%(i), display_math[i])
	for i, math in enumerate(inline_math):
		text = text.replace('~~~INLINEMATH%d~~~'%(i), inline_math[i])
	return text.replace('<br>', '').replace('</br>', '')

def parse_lists(text):
	text = text.replace('<ol>', '\n').replace('</ol>', '\n')
	text = text.replace('<ul>', '\n\\begin{itemize}\n').replace('</ul>', '\n\\end{itemize}\n')
	text = text.replace('<li>', '\n* ').replace('</li>', '')	
	return text
	    
class MarkdownClass(object):
	
	def __init__(self, filename):
		with open(filename, 'r') as fin:
			data = simplejson.load(fin)
			
		self.content = data["notebook"]
		self.date = data["date"]
		self.title = '\n# %s\n\n'%(data['title'].replace('<br>', ''))
		self.note = ''
		
	def parse_note(self):
		for element in self.content:
			exec('md = markdown_%s(element)'%(element['type']))
			self.note += md
			
	pass

def markdown_code(dictionary):
	text = '\n\n**%s**\n'%(dictionary['content']['code_header']['content'])
	text += '\n**%s**\n'%(dictionary['content']['code_date']['content'])
	text += '\n\n\t' + dictionary['content']['code_body']['content'].replace('\n', '\n\t') + '\n\n'
	return text
	
def markdown_plot(dictionary):
	text = '\n\n%s\n'%(dictionary['content']['plot_header']['content'].replace('\n', '\n\t'))
	text += '\n![Alt %s](%s "%s")\n'%(dictionary['content']['plot_caption']['content'], 
		dictionary['content']['plot_file']['content'],
		dictionary['content']['plot_caption']['content'])
	return text

def markdown_head(dictionary):
	text = '\n\n**%s**\n'%(dictionary['content']['head_header']['content'])
	text += '\n**%s**\n\n'%(dictionary['content']['head_date']['content'])
	text += dictionary['content']['head_body']['content'].replace('<br>', '\n\t').replace('#', '\#') + '\n'
	return text

def markdown_text(dictionary):
	text = '\n\n## %s\n\n'%(dictionary['content']['text_header']['content'])
	text += text_cell_markdown(dictionary['content']['text_body']['content'])
	return text

def markdown_paragraph(dictionary):
	return dictionary['content']['paragraph_body']['content']

def process_note(notefile):
	fn = MarkdownClass(notefile)
	fn.parse_note();
	with open(notefile.split('.')[0] + '.md', "w") as fout:
		fout.write(fn.title.encode('utf-8') + fn.note.encode('utf-8'))
		
if __name__=="__main__":
	if not os.path.exists(sys.argv[1]):
		print 'Input file %s does not exist!'%(sys.argv[1])
		sys.exit()
	
	process_note(sys.argv[1])
