import web
import datetime
import simplejson

class Index(object):
	def GET(self):
		content = """<html><head><script src="/static/test_client.js"></script></head>
					<body><div>GET: Server queried at %s</div>
					<input type="button" value="Start" onclick="start();"/>
					<input type="button" value="Stop" onclick="stop();"/>
					<input type="button" value="Query" onclick="query();"/>
					<div id="placeholder"></div>
					</body></html>"""%(datetime.datetime.now())
		return 	content

	def POST(self):
		print simplejson.loads(web.data())
		return 	'<html><body><POST: Server queried at %s</body></html>'%(now())
		

if __name__ == "__main__": 
	app = web.application(('/','Index'), globals())
	app.run()
