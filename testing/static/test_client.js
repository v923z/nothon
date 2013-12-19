var status = new Object();

function xml_http_post(url, data, callback) {
    var req = false;
    try {
        // Firefox, Opera 8.0+, Safari
        req = new XMLHttpRequest();
    }
    catch (e) {
        // Internet Explorer
        try {
            req = new ActiveXObject("Msxml2.XMLHTTP");
        }
        catch (e) {
            try {
                req = new ActiveXObject("Microsoft.XMLHTTP");
            }
            catch (e) {
                alert("Your browser does not support AJAX!");
                return false;
            }
        }
    }
    req.open("POST", url, true);
    req.onreadystatechange = function() {
        if (req.readyState == 4) {
            callback(req);
        }
    }
    req.send(data);
}

function start() {
	var message = new Object()
	message.command = "start"
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), message_handler)
}

function stop() {
	var message = new Object()
	message.command = "stop"
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), message_handler)
}

function query() {
	var message = new Object()
	message.command = "query"
    xml_http_post("http://127.0.0.1:8080/", JSON.stringify(message), message_handler)
}

function message_handler(req) {
	var message = JSON.parse(req.responseText)
	if(message["state"] == "started") { status = message }
	else if(message["state"] == "stopped") { status = message }
	if(message["state"] == "running") { status = message }
}
