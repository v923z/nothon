import web
import datetime
import simplejson
import threading
import time

# This is a global dictionary that the thread can write into
it = { 'num' : 0, 'state' : 'inactive', 'thread' : None, 'result' : None }

class Test(threading.Thread):
    def __init__(self, num):
        self.num = num
        threading.Thread.__init__(self)
 
    def run(self):
        global it
        it['state'] = 'active'
        for i in range(self.num):
            time.sleep(0.5)
            it['num'] = i
        it['result'] = self.num
        it['state'] = 'inactive'
        # We could, perhaps, delete the thread here, except I don't know how...
        it['thread'] = None

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
			a = Test(15)
			# If we store the thread itself in the dictionary, we could kill it at will with 
			# a._Thread__stop(). However, that doesn't guarantee that the stack will be cleaned up!
			it['thread'] = a
			a.start()
			a.join(timeout=2)
			if a.isAlive():
				return simplejson.dumps({'status' : 'started', 'time' : 'still running'})
			else: 
				return simplejson.dumps({'status' : 'started', 'time' : 'finished'})
		#if message['command'] in ('stop'):
			#return simplejson.dumps({'status' : 'stopped', 'time' : 'stopped: %s'%(datetime.datetime.now())})
		if message['command'] in ('query'):
			return simplejson.dumps({'status' : 'queried', 'time' : it['state'] + ' ' + str(it['num']) + ' queried: %s'%(datetime.datetime.now())})

if __name__ == "__main__": 
	app = web.application(('/','Index'), globals())
	app.run()
