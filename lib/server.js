//ate
global.escapehtml = function(unsafe) {
	return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
};
global.string = function(str) {
	if (typeof str === 'string' || typeof str === 'number') return '' + str;
	return '';
};
global.toId = function(text) {
	if (text && text.id) text = text.id;
	else if (text && text.userid) text = text.userid;
	return string(text).toLowerCase().replace(/[^a-z0-9]+/g, '');
};
global.models = require('./ate/models.js');
global.User = require('./ate/User.js');
global.Room = require('./ate/Room.js');
global.parse = require('./ate/parse.js');
global.events = require('./events');
global.Ladder = require('./ladder.js');
global.ladders = {'advanced': new Ladder('main', 'advanced')};
global.Formats = ["Random", "Advanced", "Traditional", "Unlimited"];
//ygosim
/**
 * Module dependencies.
 */
var chalk = require('chalk');
var compression = require('compression');
var express = require('express');
var http = require('http');
var logger = require('morgan');
var path = require('path');
var socketio = require('socket.io');

/**
 * Create an express application.
 */

var app = express();
var server = http.Server(app);
var io = socketio(server);

global.Config = require('./ate/Config.js');

// turn on console logging
app.use(logger('dev'));

// compress all requests
app.use(compression());

/**
 * Serve the static files. 
 */

app.use(express.static(path.join(__dirname, '../public')));

/**
 * GET /
 * Home page.
 */

app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/duel-' + ':id*', function(req, res, next) {
	var duelId = req.params.id;
	res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/replay-' + ':id*', function(req, res, next) {
	var duelId = req.params.id;
	res.sendFile(path.join(__dirname, '../index.html'));
});

/**
 * Socket connections.
 */
io.on('connection', function(socket) {
	if (Config.bannedIps[socket.handshake.address]) {
		//banned ip
		socket.emit('e', 'banned');
		socket.disconnect();
		return;
	}
	var user = new User(socket);
	socket.on('e', function(data) {
		var user = socket.user;
		if (typeof data !== "object" || !data.event) return;
		console.log(data.event);
		if (events[data.event]) {
			var eventName = data.event;
			var event = events[eventName];
			if (typeof event === 'string') event = events[event];
			event(user, data, socket, eventName);
		}
	});
	socket.on('disconnect', function() {
		var user = socket.user;
		user.disconnect(socket);
	});
});

/**
 * Start Express server.
 */

app.set('port', 8000);
server.listen(app.get('port'), function() {
	var env = '\n[' + chalk.green(app.get('env')) + ']';
	var port = chalk.magenta(app.get('port'));
	console.log(env + ' Listening on port ' + port + '...\n');
});
