import feedparser

class Arxiv(object):
	
	def __init__(self, resource, render):
		self.resource = resource
		self.render = render

	def parse(self, link):
		arxiv = {'papers': []}
		parser = feedparser.parse('http://export.arxiv.org/rss/cond-mat?version=2.0')
		for entry in parser.entries:
			arxiv['papers'].append({'id': entry['id'], 'link': entry['link'], 
			'summary': entry['summary'].replace('Authors: ', ''), 'title': entry['title']})
			
		return arxiv
