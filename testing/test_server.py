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
		message = simplejson.loads(web.data())
		print message
		if message['command'] in ('start'):
			return simplejson.dumps({'status' : 'started', 'time' : 'started: %s'%(datetime.datetime.now())})
		if message['command'] in ('stop'):
			return simplejson.dumps({'status' : 'stopped', 'time' : 'stopped: %s'%(datetime.datetime.now())})
		if message['command'] in ('query'):
			return simplejson.dumps({'status' : 'queried', 'time' : 'queried: %s'%(datetime.datetime.now())})

if __name__ == "__main__": 
	app = web.application(('/','Index'), globals())
	app.run()
