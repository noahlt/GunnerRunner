var http = require('http'),
    io = require('socket.io'),
    url = require('url'),
    path = require('path'),
    fs = require('fs');

var players = 0;

function serveFile(relpath, res) {
    fs.readFile(path.join(process.cwd(), relpath), 'binary',
		function(err, file) {
		    if (err) {
			console.error('ERROR READING FILE :`-(');
			res.writeHead(500, {"Content-Type": 'text/plain'});
			res.end();
		    } else {
			res.writeHead(200);
			res.write(file, 'binary');
			res.end();
		    }
		});
}

server = http.createServer(function(req, res) {
	var uri = url.parse(req.url).pathname;
	console.log(uri);
	if (uri == '/') {
	    serveFile('pilot.html', res);
	} else if (uri == '/js/pilot') {
	    serveFile('pilot.js', res);
	} else {
	    console.log('404: ' + uri);
	    res.writeHead(404, {'Content-Type': 'text/plain'});
	    res.end('404 file not found');
	}
    });

server.listen(8080, '0.0.0.0');

var socket = io.listen(server);

var pilotTaken = false;
var gunnerTaken = false;

socket.on('connection', function(client) {
	if (!pilotTaken) {
	    client.send({'role': 'pilot'});
	    client.role = 'pilot';
	    pilotTaken = true;
	    console.log('PILOT CONNECTED');
	} else if (!gunnerTaken) {
	    client.send({'role': 'gunner'});
	    client.role = 'gunner';
	    gunnerTaken = true;
	    console.log('GUNNER CONNECTED');
	} else {
	    client.send('too many players');
	}

	if (pilotTaken && gunnerTaken) {
	    client.send({'gameStart': true});
	    client.broadcast({'gameStart': true});
	}

	client.on('message', function(event) {
		client.broadcast(event);
		//console.log('client message: ' + event);
	    });
	client.on('disconnect', function(event) {
		console.log('our ' + client.role + " disconnected :'-(");
		if (client.role === 'pilot') {
		    pilotTaken = false;
		} else if (client.role === 'gunner') {
		    gunnerTaken = false;
		} else {
		    console.log('something is technically wrong...');
		}
	    });
	/*setInterval(function() {
	  client.send('message');
	  }, 5000); */
    });

