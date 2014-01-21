import feedparser
import datetime
import simplejson
from bs4 import BeautifulSoup

class Arxiv(object):
	
	def __init__(self, resource, render):
		self.resource = resource
		self.render = render

	def handler(self, message):
		command = message.get('command')
		print 'Handling arxiv command %s %s'%(command, datetime.datetime.now().strftime("%H:%M:%S.%f"))
		if command in ('bibtex'):
			result = {'success': 'success'}
		else: 
			result = {'success': 'undefined command: %s'%(command)}
			
		print 'Returning from arxiv command %s %s'%(command, datetime.datetime.now().strftime("%H:%M:%S.%f"))
		return result
			
	def parse(self, link, keywords=None, includeonly=None):
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
				
			arxiv['papers'].append({'arxiv_id': entry['link'].split('/')[-1], 
									'id': entry['id'], 'url': entry['link'], 
									'author': ' and '.join(authors),
									'authors_raw': authors_raw, 
									'title': strip_title(entry['title']),
									'full_title': entry['title'], 
									'timestamp': datetime.datetime.now().strftime('%Y.%m.%d'), 
									'journal': 'arxiv',
									'pages': entry['link'], # FIXME!
									'url': entry['link'], 
									'abstract': abstract})
			# TODO:	change the order of entries, if keywords are supplied
			# TODO: remove papers, if includeonly argument is supplied
		arxiv['dictionary'] = simplejson.dumps({entry['arxiv_id']: entry for entry in arxiv['papers']})
		return arxiv

def strip_title(title):
	# Removes the trailing garbage from a title string: "This is some title. (arXiv:1401.1234v1 [cond-mat.mtrl-sci])"
	title = title[:title.rfind('(')]
	return title[:title.rfind('.')]
