import feedparser
import datetime
import simplejson
import os
from bs4 import BeautifulSoup

from fileutils import check_for_special_folder

class Arxiv(object):
	
	def __init__(self, resource, render):
		self.resource = resource
		self.render = render

	def handler(self, message):
		command = message.get('command')
		print 'Handling arxiv command %s %s'%(command, datetime.datetime.now().strftime("%H:%M:%S.%f"))
		if command in ('save_entry'):
			result = {'success': 'success'}
		else: 
			result = {'success': 'undefined command: %s'%(command)}
			
		print 'Returning from arxiv command %s %s'%(command, datetime.datetime.now().strftime("%H:%M:%S.%f"))
		return result
			
	def parse(self, link, keyword=None, includeonly=None):
		arxiv = {'papers': []}
		parser = feedparser.parse('http://export.arxiv.org/rss/%s?version=2.0'%(link))
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
				if i == 1: 
					abstract = ''.join([unicode(elem) for elem in p.contents])
				else: abstract = ''
				
			paper = {'has_keyword': False,				
						'arxiv_id': entry['link'].split('/')[-1], 
						'id': entry['id'], 'url': entry['link'], 
						'author': ' and '.join(authors),
						'authors_raw': authors_raw, 
						'title': strip_title(entry['title']),
						'full_title': entry['title'], 
						'timestamp': datetime.datetime.now().strftime('%Y.%m.%d'), 
						'journal': 'arxiv',
						'pages': entry['link'].split('/')[-1], 
						'abstract': abstract, 
						'year': datetime.datetime.now().strftime('%Y'), 
						'pdflink': pdf_link(entry['title'])}
									
			if keyword:
				if keyword_in_paper(paper, keyword): 
					print paper
					paper['has_keyword'] = True

			if includeonly:
				if keyword_in_paper(paper, includeonly): arxiv['papers'].append(paper)
			else:
				arxiv['papers'].append(paper)
				
		arxiv['dictionary'] = simplejson.dumps({entry['arxiv_id']: entry for entry in arxiv['papers']})
		arxiv['bibnotes'] = simplejson.dumps(list_bibnotes('.'))
		return arxiv

def strip_title(title):
	# Removes the trailing garbage from a title string: "This is some title. (arXiv:1401.1234v1 [cond-mat.mtrl-sci])"
	# We might have to re-consider this, for this is not entirely safe.
	title = title[:title.rfind('(')]
	return title[:title.rfind('.')]

def pdf_link(title):
	# Returns the link to the pdf as derived from "This is some title. (arXiv:1401.1234v1 [cond-mat.mtrl-sci])"
	title = title[title.rfind('(arXiv:'):]
	return title[7:title.find(' ')]
	
def list_bibnotes(dir):
	bibnote_list = []
	for root, dirs, files in os.walk('.'):
		for dir in dirs:
			if check_for_special_folder(dir, '_'): dirs.remove(dir)
		for file in files:
			if file.endswith('.bibnote'):
				bibnote_list.append(os.path.join(root, file))
				
	return bibnote_list

def keyword_in_paper(paper, keywords):
	# Returns true, if any of the keywords can be found in the paper, otherwise false
	fields = ['author', 'title', 'abstract']
	for field in fields:
		field_text = paper.get(field, '').lower()
		for keyword in keywords:
			if keyword in field_text: return True

	return False
