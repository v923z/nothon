import feedparser
from bs4 import BeautifulSoup

class Arxiv(object):
	
	def __init__(self, resource, render):
		self.resource = resource
		self.render = render

	def parse(self, link):
		arxiv = {'papers': []}
		parser = feedparser.parse('http://export.arxiv.org/rss/cond-mat?version=2.0')
		for entry in parser.entries:
			soup = BeautifulSoup(entry['summary'].replace('\n', ' '))
			#arxiv['papers'].append({'id': entry['id'], 'link': entry['link'], 
			#'summary': entry['summary'].replace('Authors: ', ''), 'title': entry['title']})

			authors = []		
			for i, p in enumerate(soup.findAll('p')):
				if i == 0:
					authors_raw = str(p).replace('Authors: ', '')
					for a in p.findAll('a'):
						authors.append(a.contents[0])
				if i == 1: abstract = ''.join(p.contents)
			arxiv['papers'].append({'id': entry['id'], 'link': entry['link'], 
									'authors': ' and '.join(authors), 'authors_raw': authors_raw, 
									'title': strip_title(entry['title']), 'full_title': entry['title'], 
									'abstract': abstract})
							
		return arxiv

def strip_title(title):
	# Removes the trailing garbage from a title string: "This is some title. (arXiv:1401.1234v1 [cond-mat.mtrl-sci])"
	title = title[:title.rfind('(')]
	return title[:title.rfind('.')]
