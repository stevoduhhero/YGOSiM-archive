<<<<<<< HEAD
var commands = require('./commands.js');
function messageParser(msg, room, user, socket) {
	if (!msg || !msg.trim().length) return;
	var cmd = '',
		data = '';
	if (msg.substr(0, 3) === '>> ') msg = '/eval ' + msg.substr(3);
	if (msg.charAt(0) === '/' && msg.charAt(1) !== '/') {
		var spaceIndex = msg.indexOf(' ');
		if (spaceIndex > 0) {
			cmd = msg.substr(1, spaceIndex - 1);
			data = msg.substr(spaceIndex + 1);
		} else {
			cmd = msg.substr(1);
			data = '';
		}
	} else if (msg.charAt(0) === '!') {
		var spaceIndex = msg.indexOf(' ');
		if (spaceIndex > 0) {
			cmd = msg.substr(0, spaceIndex);
			data = msg.substr(spaceIndex + 1);
		} else {
			cmd = msg;
			data = '';
		}
	}
	cmd = cmd.toLowerCase();
	var broadcast = false;
	if (cmd.charAt(0) === '!') {
		broadcast = true;
		cmd = cmd.substr(1);
	}
	
	if ((!room && cmd !== 'join')) return;
	if (!cmd) return true;
	var command = commands[cmd];
	if (typeof command === 'string') command = commands[command];
	if (!command && cmd) {
		socket.send(room, 'The command "' + msg + '" doesn\'t exist.');
		return false;
	}
	var result;
	try {
		result = command(data, room, user, socket, cmd, msg);
	} catch(err) {
		var stack = err.stack + '\n\n' +
				'Additional information:\n' +
				'user = ' + user.name + '\n' +
				'room = ' + ((room) ? room.id : 'undefined') + '\n' +
				'message = ' + msg;
		if (room && room.addLog) room.addLog(stack);
	}
	if (result === undefined) result = false;
	return result;
}
module.exports = messageParser;
=======
var commands = require('./commands.js');
function messageParser(msg, room, user, socket) {
	if (!msg || !msg.trim().length) return;
	var cmd = '',
		data = '';
	if (msg.substr(0, 3) === '>> ') msg = '/eval ' + msg.substr(3);
	if (msg.charAt(0) === '/' && msg.charAt(1) !== '/') {
		var spaceIndex = msg.indexOf(' ');
		if (spaceIndex > 0) {
			cmd = msg.substr(1, spaceIndex - 1);
			data = msg.substr(spaceIndex + 1);
		} else {
			cmd = msg.substr(1);
			data = '';
		}
	} else if (msg.charAt(0) === '!') {
		var spaceIndex = msg.indexOf(' ');
		if (spaceIndex > 0) {
			cmd = msg.substr(0, spaceIndex);
			data = msg.substr(spaceIndex + 1);
		} else {
			cmd = msg;
			data = '';
		}
	}
	cmd = cmd.toLowerCase();
	var broadcast = false;
	if (cmd.charAt(0) === '!') {
		broadcast = true;
		cmd = cmd.substr(1);
	}
	
	if ((!room && cmd !== 'join')) return;
	if (!cmd) return true;
	var command = commands[cmd];
	if (typeof command === 'string') command = commands[command];
	if (!command && cmd) {
		socket.send(room, 'The command "' + msg + '" doesn\'t exist.');
		return false;
	}
	var result;
	try {
		result = command(data, room, user, socket, cmd, msg);
	} catch(err) {
		var stack = err.stack + '\n\n' +
				'Additional information:\n' +
				'user = ' + user.name + '\n' +
				'room = ' + ((room) ? room.id : 'undefined') + '\n' +
				'message = ' + msg;
		if (room && room.addLog) room.addLog(stack);
	}
	if (result === undefined) result = false;
	return result;
}
module.exports = messageParser;
>>>>>>> 30f3aef14c50989fa4adbfef9706ba8e013e6b08
