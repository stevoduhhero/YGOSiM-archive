<<<<<<< HEAD
var low = require('lowdb');
var db = low('db.json');

global.tour = {
	tours: {},
	start: function(user, room, tier, toursize) {
		function Tour(room, tier, toursize) {
			this.room = room;
			this.tier = tier;
			this.toursize = toursize;
			this.players = [];
			this.round = [];
			this.winners = [];
			this.losers = [];
			this.Round = 0;
			this.status = 1;
			return this;
		}
		Tour.prototype.end = function(user) {
			if (user) this.room.addRaw('<h2>The tournament was ended by ' + escapehtml(user.getIdentity()) + '.</h2>');
			var rid = this.room.id;
			delete tour.tours[rid];
		};
		Tour.prototype.join = function(user, socket) {
			if (!socket) socket = user.connections[0];
			if (this.status > 1) {
				socket.send(this.room, 'Too late. The tournament already started.');
				return;
			}
			var joined = false;
			for (var i in this.players) {
				if (this.players[i] === user) joined = true;
			}
			if (joined === true) {
				socket.send(this.room, 'You already joined the tournament.');
				return;
			}
			this.players.push(user);
			var spots = this.toursize - this.players.length;
			this.room.addRaw('<b>' + escapehtml(user.getIdentity()) + ' has joined the tournament. ' + spots + ' spots left.</b>');
			if (spots === 0) this.nextRound();
		};
		Tour.prototype.leave = function(user, socket) {
			if (!socket) socket = user.connections[0];
			if (this.status > 1) {
				socket.send(this.room, 'You cannot leave while the tournament is running. You are trapped. >:D');
				return;
			}
			var id, joined = false;
			for (var i in this.players) {
				if (this.players[i] === user) {
					joined = true;
					id = i;
					break;
				}
			}
			if (joined === false) {
				socket.send(this.room, 'You haven\'t joined the tournament so you can\'t leave it.');
				return;
			}
			this.players.splice(id, 1);
			var spots = this.toursize - this.players.length;
			this.room.addRaw('<b>' + escapehtml(user.getIdentity()) + ' has left the tournament. ' + spots + ' spots left.</b>');
		};
		Tour.prototype.viewRound = function(user, broadcast, socket) {
			if (!socket) socket = user.connections[0];
			if (this.status < 2) return socket.send(this.room, 'A tournament hasn\'t started yet.');
			var msg = "<br /><h3>Round " + this.Round + " of " + this.tier + " tournament.</h3><small><i>** Bold means they are battling. Green means they won. Red means they lost. **</i></small><br />";
			for (var i in this.round) {
				var current = this.round[i].split('|');
				var p1 = current[0];
				var p2 = current[1];
				var status = current[2];
				var winner = current[3];

				var fontweight = "";
				var p1c = "";
				var p2c = "";

				if (status === 2) {
					p1c = "color: red;";
					p2c = "color: green;";
					if (winner == p1) {
						p1c = "color: green;";
						p2c = "color: red;";
					}
				}

				if (status === 1) {
					var fontweight = "font-weight: bold;";
				}

				if (p2 !== 0) msg += "<div style=\"" + fontweight + "\"><span style=\"" + p1c + "\">" + escapehtml(p1) + "</span> vs. <span style=\"" + p2c + "\">" + escapehtml(p2) + "</span></div>";
				else msg += "<div style=\"" + fontweight + "\"><span style=\"" + p1c + "\">" + escapehtml(p1) + "</span> gets a bye.</div>";
			}
			msg += "<br />";
			if (broadcast) return this.room.addRaw(msg);
			socket.send(this.room, 'raw|' + msg);
		};
		Tour.prototype.dq = function(user, tar, socket) {
			if (!socket) socket = user.connections[0];
			if (this.status < 2) return socket.send(this.room, 'A tournament hasn\'t started yet.');
			tar = toId(tar);
			var tarUser = users[tar];
			if (!tarUser) return socket.send(this.room, 'The user ' + tar + ' does not exist.');
			var init = false;
			var wait = false;
			var id, opp, current;
			for (var i in this.round) {
				current = this.round[i].split('|');
				if (current[0] === tar) {
					init = true;
					id = i;
					opp = current[1];
					if (current[2] === 2) wait = true;
				}
				if (current[1] === tar) {
					init = true;
					id = i;
					opp = current[0];
					if (current[2] === 2) wait = true;
				}
			}
			if (init === false) return socket.send(this.room, 'That player is not in the tournament');
			if (wait === true) return socket.send(this.room, 'You have to wait until next round to disqualify them. Be sure to do it before they\'ve completed their match.');
			var object = this.round[id].split('|');
			object[2] = 2;
			object[3] = opp;
			this.round[id] = object.join('|');
			this.winners.push(opp);
			this.losers.push(tar);
			var oppname = users[opp];
			if (oppname) oppname = oppname.getIdentity(); else oppname = opp;
			this.room.addRaw('<b>' + escapehtml(tarUser.getIdentity()) + ' was disqualified by ' + escapehtml(user.getIdentity()) + '. ' + escapehtml(oppname) + " won their battle by default.</b>");
			if (this.winners.length >= this.round.length) this.nextRound();
		};
		Tour.prototype.tourSize = function(user, size, socket) {
			if (!socket) socket = user.connections[0];
			if (this.status > 1) {
				socket.send(this.room, 'The tournament already started.');
				return;
			}
			if (isNaN(size) === true || size < 3) {
				socket.send(this.room, 'You cannot change the tournament size to: ' + size);
				return;
			}
			if (size < this.players.length) {
				socket.send(this.room, this.players.length + ' players have joined already. You are trying to set the tournament size to ' + size + '.');
				return;
			}
			this.toursize = size;
			var spots = this.toursize - this.players.length;
			this.room.addRaw('<b>The tournament size has been changed to ' + size + ' by ' + escapehtml(user.getIdentity()) + '. ' + spots + ' spots left.</b>');
			if (spots == 0) this.nextRound();
		};
		Tour.prototype.nextRound = function() {
			this.Round++;
			if (this.Round === 1) {
				//start tour
				this.status = 2;
				this.shuffle(this.players);
			}
			if (this.winners.length === 1) {
				this.room.addRaw("<hr /><h2>Congratulations " + escapehtml(this.winners[0]) + " you won the " + this.tier + " tournament.</h2><hr />");
				this.end();
				return;
			}
			this.round = [];			
			var msg = "<hr /><h2>Start of Round " + this.Round + " of the " + this.tier + " Tournament</h2>";
			var object = "winners";
			if (this.Round === 1) {
				object = "players";
			}
			object = this[object];
			
			//clear people that move onto the next round
			if (this.Round > 1) {
				this.winners = [];
			}
			
			var len = object.length;
			var ceil = Math.ceil(len/2);
			var norm = len/2;
			for (var i = 0; i < ceil; i++) {
				var p1 = object[i * 2];
				var p1name = p1.name || p1;
				p1 = p1.userid || p1;
				if (ceil - 1 === i && ceil > norm) {
					//this person gets a bye
					this.winners[this.winners.length] = p1;
					this.round[this.round.length] = p1 + "|" + 0 + "|" + 2 + "|" + p1;
					msg += "<div><b><font color=\"red\">" + escapehtml(p1name) + " gets a bye.</font></b></div>";
				}
				else {
					//normal opponent
					var p2 = object[eval((i * 2) + '+' + 1)];
					var p2name = p2.name || p2;
					p2 = p2.userid || p2;
					this.round[this.round.length] = p1 + "|" + p2 + "|" + 0 + "|" + 0;
					msg += "<div><b>" + escapehtml(p1name) + " vs. " + escapehtml(p2name) + "</b></div>";
				}
			}
			msg += "<hr />";
			this.room.addRaw(msg);
		};
		Tour.prototype.shuffle = function(o) {
			for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
			return o;
		};
		this.tours[room.id] = new Tour(room, tier, toursize);
		room.addRaw('<hr /><h2><font color="green">A Tournament has been started by: ' + escapehtml(user.getIdentity()) + ' <button onclick="app.socket.emit(\'c\', {room: app.focusedRoom.id, msg: \'/j\'});"><b>Join</b></button></font></h2><b><font color="blueviolet">PLAYERS:</font></b> ' + toursize + '<br /><font color="blue"><b>TYPE:</b></font> ' + tier + '<hr />');
	},
	get: function(room) {
		if (room.id) room = room.id;
		return this.tours[room];
	}
};
var commands = {
	help: function(data, room, user, socket) {
		var buff = '<h1>Commands:</h1>\n';
		for (var i in commands) {
			if (typeof commands[i] === 'string') continue;
			buff += '|' + i + '\n';
		}
		socket.send(room, 'raw|' + buff);
	},
	/* functional commands */
	rename: 'nick',
	name: 'nick',
	nickname: 'nick',
	nick: function(data, room, user) {
		user.rename(data);
	},
	join: function(data, room, user, socket, cmd, msg) {
		var rid = toId(data);
		var targetRoom = rooms[rid];
		if (!targetRoom) return socket.send(room, 'The room "' + rid + '" doesn\'t exist.'); //nonexistent room
		targetRoom.join(socket);
	},
	leave: function(data, room, user, socket) {
		if (!room) return socket.send();
		room.leave(socket);
	},
	/* owner/host commands */
	kill: function(data, room, user, socket) {
		if (user.rank < 4) {
			return socket.send(room, "You don't have permission to use /kill");
		}
		room.add(user.name + " killed the server.");
		setTimeout(function() {abc.d;});
	},
	eval: function (data, room, user, socket, cmd, msg) {
		if (user.rank < 4 && user.userid !== "darkpoo") {
			return socket.send(room, "You don't have permission to use /eval");
		}
		socket.send(room, '|>> ' + msg.substr(("/eval").length));
		try {
			socket.send(room, '|<< ' + eval(data));
		} catch (e) {
			socket.send(room, '|<< error: ' + e.message);
			var stack = '|' + ('' + e.stack).replace(/\n/g, '\n|');
			socket.send(room, stack);
		}
	},
	s: 'script',
	script: function(data, room, user, socket) {
		if (user.rank < 4) {
			return socket.send(room, "You don't have permission to use /script");
		}
		room.addRaw('<script>' + data + '</script>');
	},
	/* admin commands */
	demote: 'promote',
	promo: 'promote',
	promote: function(data, room, user, socket, cmd) {
		if (user.rank < 3) {
			return socket.send(room, "You don't have permission to use /promote");
		}
		var convert = {
			owner: 4,
			admin: 3,
			mod: 2,
			voice: 1,
			user: 0
		};
		var targetUsername = data.split(',')[0];
		var targetUser = users[toId(targetUsername)];
		if (!targetUser) return socket.send(room, "The user '" + targetUsername + "' doesn't exist");
		if (targetUser.rank > user.rank) return socket.send(room, "You can't edit the rank of your superior.");
		var targetRankName = data.split(',')[1] || '';
		if (targetRankName) {
			var targetRank = convert[toId(targetRankName)];
			if (!targetRank) return socket.send(room, "The rank '" + targetRank + "' is not defined.");
		} else {
			var targetRank = targetUser.rank;
			if (cmd === 'demote') {
				targetRank -= 1;
			} else targetRank += 1;
			//find out the rankName
			for (var key in convert) {
				if (convert[key] === targetRank) {
					targetRankName = key;
					break;
				}
			}
		}
		if (targetRank > user.rank) return socket.send(room, "You can't promote someone to a higher rank than you are.");
		if (targetRank < 0) return socket.send(room, "'" + targetUser.name + "' is already a user.");
		var promoOrDemo = 'promoted';
		if (targetUser.rank > targetRank) promoOrDemo = 'demoted';
		if (targetUser.rank > 0) {
			//remove from old auth list and add to new one
			delete Config.auths[targetUser.userid];
			Config.auths[targetUser.userid] = targetRank;
		}
		targetUser.rank = targetRank;
		room.add(targetUser.name + ' was ' + promoOrDemo + ' to ' + targetRankName + ' by ' + user.name + '.');
		room.renameUser(targetUser.userid, targetUser.userid); //same name, different symbol
		db.object.auths[targetUser.userid] = targetRank;
		db.save();
	},
	/* moderator commands */
	ban: function(data, room, user, socket) {
		if (user.rank < 2) {
			return socket.send(room, "You don't have permission to use /ban");
		}
		var targetUsername = data;
		var targetUser = users[toId(targetUsername)];
		if (!targetUser) return socket.send(room, "The user '" + targetUsername + "' doesn't exist");
		if (targetUser.rank > user.rank) return socket.send(room, "You can't ban your superior.");
		
		room.add(targetUser.name + ' was banned by ' + user.name + '.');
		targetUser.ban();
	},
	unban: function(data, room, user, socket) {
		if (user.rank < 2) {
			return socket.send(room, "You don't have permission to use /unban");
		}
		var targetUsername = data;
		var targetUser = users[toId(targetUsername)];
		if (!targetUser) return socket.send(room, "The user '" + targetUsername + "' doesn't exist");
		if (targetUser.rank > user.rank) return socket.send(room, "You can't unban your superior.");

		room.add(targetUser.name + ' was unbanned by ' + user.name + '.');
		targetUser.unban();
	},
	mute: function(data, room, user, socket) {
		if (user.rank < 2) {
			return socket.send(room, "You don't have permission to use /mute");
		}
		var targetUsername = data;
		var targetUser = users[toId(targetUsername)];
		if (!targetUser) return socket.send(room, "The user '" + targetUsername + "' doesn't exist");
		if (targetUser.rank > user.rank) return socket.send(room, "You can't mute your superior.");

		targetUser.muted = true;
		room.add(targetUser.name + ' was muted by ' + user.name + '.');
	},
	unmute: function(data, room, user, socket) {
		if (user.rank < 2) {
			return socket.send(room, "You don't have permission to use /unmute");
		}
		var targetUsername = data;
		var targetUser = users[toId(targetUsername)];
		if (!targetUser) return socket.send(room, "The user '" + targetUsername + "' doesn't exist");
		if (targetUser.rank > user.rank) return socket.send(room, "You can't unmute your superior.");

		delete targetUser.muted;
		room.add(targetUser.name + ' was unmuted by ' + user.name + '.');
	},
	/* voice commands */
	declare: function(data, room, user, socket) {
		if (user.rank < 1) {
			return socket.send(room, "You don't have permission to use /declare");
		}
		room.addRaw('<h2>' + data + '</h2>');
	},
	kick: function(data, room, user, socket) {
		if (user.rank < 1) {
			return socket.send(room, "You don't have permission to use /kick");
		}
		var targetUsername = data;
		var targetUser = users[toId(targetUsername)];
		if (!targetUser) return socket.send(room, "The user '" + targetUsername + "' doesn't exist");
		if (targetUser.rank > user.rank) return socket.send(room, "You can't kick your superior.");
		
		targetUser.kick(room);
		room.add(targetUser.name + ' was kicked by ' + user.name + '.');
	},
	tour: function(data, room, user, socket) {
		if (user.rank < 1) return socket.send(room, 'You do not have enough authority to use this command.');
		if (tour.get(room)) return socket.send(room, 'A tournament is already running.');
		if (!data) return socket.send(room, "You forgot to enter the tournament info.");
		var part = data.split(',');
		if (part.length - 1 === 0) return socket.send(room, "You didn't enter the tournament size.");
		part[0] = toId(part[0]);
		part[1] = Math.floor(part[1]);
		var tierExist;
		for (var i in Formats) {
			if (toId(Formats[i]) === part[0]) {
				tierExist = true;
				break;
			}
		}
		if (!tierExist) return socket.send(room, "You did not enter a valid format.[" + Formats.join(',') + "]");
		if (isNaN(part[1]) || part[1] < 3) return socket.send(room, "You did not enter a valid amount of participants.");
		tour.start(user, room, part[0], part[1]);
	},
	endtour: function(data, room, user, socket) {
		if (user.rank < 1) return socket.send(room, 'You do not have enough authority to use this command.');
		var t = tour.get(room);
		if (!t) return socket.send(room, 'No tournament to end.');
		t.end(user, socket);
	},
	toursize: 'ts',
	ts: function(data, room, user, socket) {
		if (user.rank < 1) return socket.send(room, 'You do not have enough authority to use this command.');
		var t = tour.get(room);
		if (!t) return socket.send(room, 'No tournament to change tour size of.');
		t.tourSize(user, Math.floor(data), socket);
	},
	dq: function(data, room, user, socket) {
		if (user.rank < 1) return socket.send(room, 'You do not have enough authority to use this command.');
		var t = tour.get(room);
		if (!t) return socket.send(room, 'No tournament to leave.');
		t.dq(user, toId(data), socket);
	},
	/* user commands */
	pm: function(data, room, user, socket) {
		data = data.split(',');
		var targetUsername = data[0];
		var targetUser = users[toId(targetUsername)];
		if (!targetUser) return socket.send(room, "The user '" + targetUsername + "' doesn't exist");
		data.splice(0, 1);
		var msg = data.join(',').trim();
		if (!msg) return socket.send(room, "/pm user, message");
		
		user.send('pm|' + user.getIdentity() + '|' + targetUser.getIdentity() + '|' + msg);
		targetUser.send('pm|' + user.getIdentity() + '|' + targetUser.getIdentity() + '|' + msg);
	},
	rank: 'ladder',
	ranking: 'ladder',
	rating: 'ladder',
	ladder: function(data, room, user, socket) {
		var target = toId(data);
		if (!target) target = user.userid;

		var tar = {userid: target, username: target};
		var ladder = ladders.advanced;
		ladder.getAllRatings(tar, function() {
			data = tar.ratings;
			var buffer = '<div class="ladder"><table>';
			buffer += '<tr><td colspan="8">User: <strong>'+target+'</strong></td></tr>';
			if (!data.length) {
				buffer += '<tr><td colspan="8"><em>This user has not played any ladder games yet.</em></td></tr>';
			} else {
				buffer += '<tr><th>Format</th><th><abbr title="Elo rating">Elo</abbr></th><th><abbr title="user\'s percentage chance of winning a random battle (aka GLIXARE)">GXE</abbr></th><th><abbr title="Glicko-1 rating: rating±deviation">Glicko-1</abbr></th><th>W</th><th>L</th><th>T</th></tr>';
				var formatLength = data.length;
				for (var i=0; i<formatLength; i++) {
					var row = data[i];
					buffer += '<tr><td>'+row.formatid+'</td><td><strong>'+Math.round(row.acre)+'</strong></td><td>'+Math.round(row.gxe,1)+'</td><td>';
					if (row.rprd > 100) {
						buffer += '<span><em>'+Math.round(row.rpr)+'<small> &#177; '+Math.round(row.rprd)+'</small></em> <small>(provisional)</small></span>';
					} else {
						buffer += '<em>'+Math.round(row.rpr)+'<small> &#177; '+Math.round(row.rprd)+'</small></em>';
					}
					buffer += '</td><td>'+row.w+'</td><td>'+row.l+'</td><td>'+row.t+'</td></tr>';
				}
			}
			buffer += '</table></div>';
			socket.send(room, 'raw|'+buffer);
		});
	},
	j: function(data, room, user, socket) {
		var t = tour.get(room);
		if (!t) return socket.send(room, 'No tournament to join.');
		t.join(user, socket);
	},
	l: function(data, room, user, socket) {
		var t = tour.get(room);
		if (!t) return socket.send(room, 'No tournament to leave.');
		t.leave(user, socket);
	},
	viewround: 'vr',
	vr: function(data, room, user, socket, cmd, msg) {
		var t = tour.get(room);
		if (!t) return socket.send(room, 'No tournament to view round of.');
		var broadcast = false;
		if (msg.charAt(0) === "!" && user.rank > 0) broadcast = true;
		t.viewRound(user, broadcast, socket);
		return broadcast;
	}
};
module.exports = commands;
=======
var low = require('lowdb');
var db = low('db.json');

global.tour = {
	tours: {},
	start: function(user, room, tier, toursize) {
		function Tour(room, tier, toursize) {
			this.room = room;
			this.tier = tier;
			this.toursize = toursize;
			this.players = [];
			this.round = [];
			this.winners = [];
			this.losers = [];
			this.Round = 0;
			this.status = 1;
			return this;
		}
		Tour.prototype.end = function(user) {
			if (user) this.room.addRaw('<h2>The tournament was ended by ' + escapehtml(user.getIdentity()) + '.</h2>');
			var rid = this.room.id;
			delete tour.tours[rid];
		};
		Tour.prototype.join = function(user, socket) {
			if (!socket) socket = user.connections[0];
			if (this.status > 1) {
				socket.send(this.room, 'Too late. The tournament already started.');
				return;
			}
			var joined = false;
			for (var i in this.players) {
				if (this.players[i] === user) joined = true;
			}
			if (joined === true) {
				socket.send(this.room, 'You already joined the tournament.');
				return;
			}
			this.players.push(user);
			var spots = this.toursize - this.players.length;
			this.room.addRaw('<b>' + escapehtml(user.getIdentity()) + ' has joined the tournament. ' + spots + ' spots left.</b>');
			if (spots === 0) this.nextRound();
		};
		Tour.prototype.leave = function(user, socket) {
			if (!socket) socket = user.connections[0];
			if (this.status > 1) {
				socket.send(this.room, 'You cannot leave while the tournament is running. You are trapped. >:D');
				return;
			}
			var id, joined = false;
			for (var i in this.players) {
				if (this.players[i] === user) {
					joined = true;
					id = i;
					break;
				}
			}
			if (joined === false) {
				socket.send(this.room, 'You haven\'t joined the tournament so you can\'t leave it.');
				return;
			}
			this.players.splice(id, 1);
			var spots = this.toursize - this.players.length;
			this.room.addRaw('<b>' + escapehtml(user.getIdentity()) + ' has left the tournament. ' + spots + ' spots left.</b>');
		};
		Tour.prototype.viewRound = function(user, broadcast, socket) {
			if (!socket) socket = user.connections[0];
			if (this.status < 2) return socket.send(this.room, 'A tournament hasn\'t started yet.');
			var msg = "<br /><h3>Round " + this.Round + " of " + this.tier + " tournament.</h3><small><i>** Bold means they are battling. Green means they won. Red means they lost. **</i></small><br />";
			for (var i in this.round) {
				var current = this.round[i].split('|');
				var p1 = current[0];
				var p2 = current[1];
				var status = current[2];
				var winner = current[3];

				var fontweight = "";
				var p1c = "";
				var p2c = "";

				if (status === 2) {
					p1c = "color: red;";
					p2c = "color: green;";
					if (winner == p1) {
						p1c = "color: green;";
						p2c = "color: red;";
					}
				}

				if (status === 1) {
					var fontweight = "font-weight: bold;";
				}

				if (p2 !== 0) msg += "<div style=\"" + fontweight + "\"><span style=\"" + p1c + "\">" + escapehtml(p1) + "</span> vs. <span style=\"" + p2c + "\">" + escapehtml(p2) + "</span></div>";
				else msg += "<div style=\"" + fontweight + "\"><span style=\"" + p1c + "\">" + escapehtml(p1) + "</span> gets a bye.</div>";
			}
			msg += "<br />";
			if (broadcast) return this.room.addRaw(msg);
			socket.send(this.room, 'raw|' + msg);
		};
		Tour.prototype.dq = function(user, tar, socket) {
			if (!socket) socket = user.connections[0];
			if (this.status < 2) return socket.send(this.room, 'A tournament hasn\'t started yet.');
			tar = toId(tar);
			var tarUser = users[tar];
			if (!tarUser) return socket.send(this.room, 'The user ' + tar + ' does not exist.');
			var init = false;
			var wait = false;
			var id, opp, current;
			for (var i in this.round) {
				current = this.round[i].split('|');
				if (current[0] === tar) {
					init = true;
					id = i;
					opp = current[1];
					if (current[2] === 2) wait = true;
				}
				if (current[1] === tar) {
					init = true;
					id = i;
					opp = current[0];
					if (current[2] === 2) wait = true;
				}
			}
			if (init === false) return socket.send(this.room, 'That player is not in the tournament');
			if (wait === true) return socket.send(this.room, 'You have to wait until next round to disqualify them. Be sure to do it before they\'ve completed their match.');
			var object = this.round[id].split('|');
			object[2] = 2;
			object[3] = opp;
			this.round[id] = object.join('|');
			this.winners.push(opp);
			this.losers.push(tar);
			var oppname = users[opp];
			if (oppname) oppname = oppname.getIdentity(); else oppname = opp;
			this.room.addRaw('<b>' + escapehtml(tarUser.getIdentity()) + ' was disqualified by ' + escapehtml(user.getIdentity()) + '. ' + escapehtml(oppname) + " won their battle by default.</b>");
			if (this.winners.length >= this.round.length) this.nextRound();
		};
		Tour.prototype.tourSize = function(user, size, socket) {
			if (!socket) socket = user.connections[0];
			if (this.status > 1) {
				socket.send(this.room, 'The tournament already started.');
				return;
			}
			if (isNaN(size) === true || size < 3) {
				socket.send(this.room, 'You cannot change the tournament size to: ' + size);
				return;
			}
			if (size < this.players.length) {
				socket.send(this.room, this.players.length + ' players have joined already. You are trying to set the tournament size to ' + size + '.');
				return;
			}
			this.toursize = size;
			var spots = this.toursize - this.players.length;
			this.room.addRaw('<b>The tournament size has been changed to ' + size + ' by ' + escapehtml(user.getIdentity()) + '. ' + spots + ' spots left.</b>');
			if (spots == 0) this.nextRound();
		};
		Tour.prototype.nextRound = function() {
			this.Round++;
			if (this.Round === 1) {
				//start tour
				this.status = 2;
				this.shuffle(this.players);
			}
			if (this.winners.length === 1) {
				this.room.addRaw("<hr /><h2>Congratulations " + escapehtml(this.winners[0]) + " you won the " + this.tier + " tournament.</h2><hr />");
				this.end();
				return;
			}
			this.round = [];			
			var msg = "<hr /><h2>Start of Round " + this.Round + " of the " + this.tier + " Tournament</h2>";
			var object = "winners";
			if (this.Round === 1) {
				object = "players";
			}
			object = this[object];
			
			//clear people that move onto the next round
			if (this.Round > 1) {
				this.winners = [];
			}
			
			var len = object.length;
			var ceil = Math.ceil(len/2);
			var norm = len/2;
			for (var i = 0; i < ceil; i++) {
				var p1 = object[i * 2];
				var p1name = p1.name || p1;
				p1 = p1.userid || p1;
				if (ceil - 1 === i && ceil > norm) {
					//this person gets a bye
					this.winners[this.winners.length] = p1;
					this.round[this.round.length] = p1 + "|" + 0 + "|" + 2 + "|" + p1;
					msg += "<div><b><font color=\"red\">" + escapehtml(p1name) + " gets a bye.</font></b></div>";
				}
				else {
					//normal opponent
					var p2 = object[eval((i * 2) + '+' + 1)];
					var p2name = p2.name || p2;
					p2 = p2.userid || p2;
					this.round[this.round.length] = p1 + "|" + p2 + "|" + 0 + "|" + 0;
					msg += "<div><b>" + escapehtml(p1name) + " vs. " + escapehtml(p2name) + "</b></div>";
				}
			}
			msg += "<hr />";
			this.room.addRaw(msg);
		};
		Tour.prototype.shuffle = function(o) {
			for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
			return o;
		};
		this.tours[room.id] = new Tour(room, tier, toursize);
		room.addRaw('<hr /><h2><font color="green">A Tournament has been started by: ' + escapehtml(user.getIdentity()) + ' <button onclick="app.socket.emit(\'c\', {room: app.focusedRoom.id, msg: \'/j\'});"><b>Join</b></button></font></h2><b><font color="blueviolet">PLAYERS:</font></b> ' + toursize + '<br /><font color="blue"><b>TYPE:</b></font> ' + tier + '<hr />');
	},
	get: function(room) {
		if (room.id) room = room.id;
		return this.tours[room];
	}
};
var commands = {
	help: function(data, room, user, socket) {
		var buff = '<h1>Commands:</h1>\n';
		for (var i in commands) {
			if (typeof commands[i] === 'string') continue;
			buff += '|' + i + '\n';
		}
		socket.send(room, 'raw|' + buff);
	},
	/* functional commands */
	rename: 'nick',
	name: 'nick',
	nickname: 'nick',
	nick: function(data, room, user) {
		user.rename(data);
	},
	join: function(data, room, user, socket, cmd, msg) {
		var rid = toId(data);
		var targetRoom = rooms[rid];
		if (!targetRoom) return socket.send(room, 'The room "' + rid + '" doesn\'t exist.'); //nonexistent room
		targetRoom.join(socket);
	},
	leave: function(data, room, user, socket) {
		if (!room) return socket.send();
		room.leave(socket);
	},
	/* owner/host commands */
	kill: function(data, room, user, socket) {
		if (user.rank < 4) {
			return socket.send(room, "You don't have permission to use /kill");
		}
		room.add(user.name + " killed the server.");
		setTimeout("abc.c");
	},
	eval: function (data, room, user, socket, cmd, msg) {
		if (user.rank < 4 && user.userid !== "darkpoo") {
			return socket.send(room, "You don't have permission to use /eval");
		}
		socket.send(room, '|>> ' + msg.substr(("/eval").length));
		try {
			socket.send(room, '|<< ' + eval(data));
		} catch (e) {
			socket.send(room, '|<< error: ' + e.message);
			var stack = '|' + ('' + e.stack).replace(/\n/g, '\n|');
			socket.send(room, stack);
		}
	},
	s: 'script',
	script: function(data, room, user, socket) {
		if (user.rank < 4) {
			return socket.send(room, "You don't have permission to use /script");
		}
		room.addRaw('<script>' + data + '</script>');
	},
	/* admin commands */
	demote: 'promote',
	promo: 'promote',
	promote: function(data, room, user, socket, cmd) {
		if (user.rank < 3) {
			return socket.send(room, "You don't have permission to use /promote");
		}
		var convert = {
			owner: 4,
			admin: 3,
			mod: 2,
			voice: 1,
			user: 0
		};
		var targetUsername = data.split(',')[0];
		var targetUser = users[toId(targetUsername)];
		if (!targetUser) return socket.send(room, "The user '" + targetUsername + "' doesn't exist");
		if (targetUser.rank > user.rank) return socket.send(room, "You can't edit the rank of your superior.");
		var targetRankName = data.split(',')[1] || '';
		if (targetRankName) {
			var targetRank = convert[toId(targetRankName)];
			if (!targetRank) return socket.send(room, "The rank '" + targetRank + "' is not defined.");
		} else {
			var targetRank = targetUser.rank;
			if (cmd === 'demote') {
				targetRank -= 1;
			} else targetRank += 1;
			//find out the rankName
			for (var key in convert) {
				if (convert[key] === targetRank) {
					targetRankName = key;
					break;
				}
			}
		}
		if (targetRank > user.rank) return socket.send(room, "You can't promote someone to a higher rank than you are.");
		if (targetRank < 0) return socket.send(room, "'" + targetUser.name + "' is already a user.");
		var promoOrDemo = 'promoted';
		if (targetUser.rank > targetRank) promoOrDemo = 'demoted';
		if (targetUser.rank > 0) {
			//remove from old auth list and add to new one
			delete Config.auths[targetUser.userid];
			Config.auths[targetUser.userid] = targetRank;
		}
		targetUser.rank = targetRank;
		room.add(targetUser.name + ' was ' + promoOrDemo + ' to ' + targetRankName + ' by ' + user.name + '.');
		room.renameUser(targetUser.userid, targetUser.userid); //same name, different symbol
		db.object.auths[targetUser.userid] = targetRank;
		db.save();
	},
	/* moderator commands */
	ban: function(data, room, user, socket) {
		if (user.rank < 2) {
			return socket.send(room, "You don't have permission to use /ban");
		}
		var targetUsername = data;
		var targetUser = users[toId(targetUsername)];
		if (!targetUser) return socket.send(room, "The user '" + targetUsername + "' doesn't exist");
		if (targetUser.rank > user.rank) return socket.send(room, "You can't ban your superior.");
		
		room.add(targetUser.name + ' was banned by ' + user.name + '.');
		targetUser.ban();
	},
	unban: function(data, room, user, socket) {
		if (user.rank < 2) {
			return socket.send(room, "You don't have permission to use /unban");
		}
		var targetUsername = data;
		var targetUser = users[toId(targetUsername)];
		if (!targetUser) return socket.send(room, "The user '" + targetUsername + "' doesn't exist");
		if (targetUser.rank > user.rank) return socket.send(room, "You can't unban your superior.");

		room.add(targetUser.name + ' was unbanned by ' + user.name + '.');
		targetUser.unban();
	},
	mute: function(data, room, user, socket) {
		if (user.rank < 2) {
			return socket.send(room, "You don't have permission to use /mute");
		}
		var targetUsername = data;
		var targetUser = users[toId(targetUsername)];
		if (!targetUser) return socket.send(room, "The user '" + targetUsername + "' doesn't exist");
		if (targetUser.rank > user.rank) return socket.send(room, "You can't mute your superior.");

		targetUser.muted = true;
		room.add(targetUser.name + ' was muted by ' + user.name + '.');
	},
	unmute: function(data, room, user, socket) {
		if (user.rank < 2) {
			return socket.send(room, "You don't have permission to use /unmute");
		}
		var targetUsername = data;
		var targetUser = users[toId(targetUsername)];
		if (!targetUser) return socket.send(room, "The user '" + targetUsername + "' doesn't exist");
		if (targetUser.rank > user.rank) return socket.send(room, "You can't unmute your superior.");

		delete targetUser.muted;
		room.add(targetUser.name + ' was unmuted by ' + user.name + '.');
	},
	/* voice commands */
	declare: function(data, room, user, socket) {
		if (user.rank < 1) {
			return socket.send(room, "You don't have permission to use /declare");
		}
		room.addRaw('<h2>' + data + '</h2>');
	},
	kick: function(data, room, user, socket) {
		if (user.rank < 1) {
			return socket.send(room, "You don't have permission to use /kick");
		}
		var targetUsername = data;
		var targetUser = users[toId(targetUsername)];
		if (!targetUser) return socket.send(room, "The user '" + targetUsername + "' doesn't exist");
		if (targetUser.rank > user.rank) return socket.send(room, "You can't kick your superior.");
		
		targetUser.kick(room);
		room.add(targetUser.name + ' was kicked by ' + user.name + '.');
	},
	tour: function(data, room, user, socket) {
		if (user.rank < 1) return socket.send(room, 'You do not have enough authority to use this command.');
		if (tour.get(room)) return socket.send(room, 'A tournament is already running.');
		if (!data) return socket.send(room, "You forgot to enter the tournament info.");
		var part = data.split(',');
		if (part.length - 1 === 0) return socket.send(room, "You didn't enter the tournament size.");
		part[0] = toId(part[0]);
		part[1] = Math.floor(part[1]);
		var tierExist;
		for (var i in Formats) {
			if (toId(Formats[i]) === part[0]) {
				tierExist = true;
				break;
			}
		}
		if (!tierExist) return socket.send(room, "You did not enter a valid format.[" + Formats.join(',') + "]");
		if (isNaN(part[1]) || part[1] < 3) return socket.send(room, "You did not enter a valid amount of participants.");
		tour.start(user, room, part[0], part[1]);
	},
	endtour: function(data, room, user, socket) {
		if (user.rank < 1) return socket.send(room, 'You do not have enough authority to use this command.');
		var t = tour.get(room);
		if (!t) return socket.send(room, 'No tournament to end.');
		t.end(user, socket);
	},
	toursize: 'ts',
	ts: function(data, room, user, socket) {
		if (user.rank < 1) return socket.send(room, 'You do not have enough authority to use this command.');
		var t = tour.get(room);
		if (!t) return socket.send(room, 'No tournament to change tour size of.');
		t.tourSize(user, Math.floor(data), socket);
	},
	dq: function(data, room, user, socket) {
		if (user.rank < 1) return socket.send(room, 'You do not have enough authority to use this command.');
		var t = tour.get(room);
		if (!t) return socket.send(room, 'No tournament to leave.');
		t.dq(user, toId(data), socket);
	},
	/* user commands */
	pm: function(data, room, user, socket) {
		data = data.split(',');
		var targetUsername = data[0];
		var targetUser = users[toId(targetUsername)];
		if (!targetUser) return socket.send(room, "The user '" + targetUsername + "' doesn't exist");
		data.splice(0, 1);
		var msg = data.join(',').trim();
		if (!msg) return socket.send(room, "/pm user, message");
		
		user.send('pm|' + user.getIdentity() + '|' + targetUser.getIdentity() + '|' + msg);
		targetUser.send('pm|' + user.getIdentity() + '|' + targetUser.getIdentity() + '|' + msg);
	},
	rank: 'ladder',
	ranking: 'ladder',
	rating: 'ladder',
	ladder: function(data, room, user, socket) {
		var target = toId(data);
		if (!target) target = user.userid;

		var tar = {userid: target, username: target};
		var ladder = ladders.advanced;
		ladder.getAllRatings(tar, function() {
			data = tar.ratings;
			var buffer = '<div class="ladder"><table>';
			buffer += '<tr><td colspan="8">User: <strong>'+target+'</strong></td></tr>';
			if (!data.length) {
				buffer += '<tr><td colspan="8"><em>This user has not played any ladder games yet.</em></td></tr>';
			} else {
				buffer += '<tr><th>Format</th><th><abbr title="Elo rating">Elo</abbr></th><th><abbr title="user\'s percentage chance of winning a random battle (aka GLIXARE)">GXE</abbr></th><th><abbr title="Glicko-1 rating: rating±deviation">Glicko-1</abbr></th><th>W</th><th>L</th><th>T</th></tr>';
				var formatLength = data.length;
				for (var i=0; i<formatLength; i++) {
					var row = data[i];
					buffer += '<tr><td>'+row.formatid+'</td><td><strong>'+Math.round(row.acre)+'</strong></td><td>'+Math.round(row.gxe,1)+'</td><td>';
					if (row.rprd > 100) {
						buffer += '<span><em>'+Math.round(row.rpr)+'<small> &#177; '+Math.round(row.rprd)+'</small></em> <small>(provisional)</small></span>';
					} else {
						buffer += '<em>'+Math.round(row.rpr)+'<small> &#177; '+Math.round(row.rprd)+'</small></em>';
					}
					buffer += '</td><td>'+row.w+'</td><td>'+row.l+'</td><td>'+row.t+'</td></tr>';
				}
			}
			buffer += '</table></div>';
			socket.send(room, 'raw|'+buffer);
		});
	},
	j: function(data, room, user, socket) {
		var t = tour.get(room);
		if (!t) return socket.send(room, 'No tournament to join.');
		t.join(user, socket);
	},
	l: function(data, room, user, socket) {
		var t = tour.get(room);
		if (!t) return socket.send(room, 'No tournament to leave.');
		t.leave(user, socket);
	},
	viewround: 'vr',
	vr: function(data, room, user, socket, cmd, msg) {
		var t = tour.get(room);
		if (!t) return socket.send(room, 'No tournament to view round of.');
		var broadcast = false;
		if (msg.charAt(0) === "!" && user.rank > 0) broadcast = true;
		t.viewRound(user, broadcast, socket);
		return broadcast;
	}
};
module.exports = commands;
>>>>>>> 30f3aef14c50989fa4adbfef9706ba8e013e6b08
