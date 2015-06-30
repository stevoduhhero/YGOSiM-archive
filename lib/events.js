var Game = require('./game');

var cacheUser;

var events = {
	/* game */
	afterDuelStarted: function(game, p1, p2) {
		var joined1, joined2;
		for (var roomkey in tour.tours) {
			var t = tour.get(roomkey);
			joined1 = false;
			joined2 = false;
			for (var i in t.players) {
				if (t.players[i] === p1) {
					joined1 = true;
				}
				if (t.players[i] === p2) {
					joined2 = true;
				}
			}
			if (joined1 && joined2) break;
		}
		var opps = false;
		if (joined1 && joined2) {
			console.log("SAME TOUR OPPONENTS");
			for (var i in t.round) {
				var current = t.round[i].split('|');
				if (((current[0] === p1.userid && current[1] === p2.userid) || (current[0] === p2.userid && current[1] === p1.userid)) && current[2] === "0") {
					var opps = true;
					var part = i;
				}
			}
		}
		if (opps == true) {
			//both players are in the tournament and are opponents
			var obj = t.round[part].split('|');
			obj[2] = 1;
			t.round[part] = obj.join('|');
			t.room.addRaw('<a href="/duel-' + game.id + '" target="_BLANK"><b>Tournament battle between ' + escapehtml(p1.getIdentity()) + ' and ' + escapehtml(p2.getIdentity()) + ' has started.</b></a>');
		}
	},
	afterDuelEnded: function(game, winner, loser) {
		var joined1, joined2;
		for (var roomkey in tour.tours) {
			var t = tour.get(roomkey);
			joined1 = false;
			joined2 = false;
			for (var i in t.players) {
				if (t.players[i] === winner) {
					joined1 = true;
				}
				if (t.players[i] === loser) {
					joined2 = true;
				}
			}
			if (joined1 && joined2) break;
		}
		var opps = false;
		if (joined1 && joined2) {
			for (var i in t.round) {
				var current = t.round[i].split('|');
				if (((current[0] === winner.userid && current[1] === loser.userid) || (current[0] === loser.userid && current[1] === winner.userid)) && current[2] === "1") {
					var opps = true;
					var part = i;
				}
			}
		}
		if (opps === true) {
			//both players are in the tournament and are opponents
			var obj = t.round[part].split('|');
			obj[2] = 2;
			obj[3] = winner.userid;
			t.round[part] = obj.join('|');
			t.winners[t.winners.length] = winner.userid;
			t.losers[t.losers.length] = loser.userid;
			t.room.addRaw(escapehtml(loser.getIdentity()) + ' lost their tournament battle against ' + escapehtml(winner.getIdentity()) + '.');
			if (t.winners.length >= t.round.length) {
				t.nextRound();
			}
		}
	},
	'cancelchallenge': 'challenge',
	'accept': 'challenge',
	'reject': 'challenge',
	'challenge': function(user, data, socket, e) {
		if (!data.opponent) return;
		var opp = users[toId(data.opponent)];
		if (!opp || (opp && !opp.connected)) return;
		if (e === 'reject' || e === 'cancelchallenge') {
			user.cancelChallenge(opp);
		} else if (e === 'accept') {
			//when u manage to start the duel it already removes the challenges
			var chall = user.challenges.from[opp.userid];
			if (!chall) return;
			if (toId(chall.tier) === "random") data.deckString = Game.prototype.randomDeck();
			if (!data.deck && !data.deckString) return;
			function startDuel(user, data, socket, chall) {
				data.deck = Game.prototype.verifyDeck(chall.tier, data.deckString);
				//check if error in verification
				if (typeof data.deck === "string") {
					//error = data.deck
					socket.send('err|' + data.deck);
					return;
				}
				var opponent = users[chall.sender];
				var opponentDeck = chall.deck;
				var game = new Game(opponent, user, chall.tier, false, opponentDeck, data.deck);
			}
			if (data.deck && !data.deckString) {
				//provided deck name and no deckString
				//get deckString by name and complete this function
				user.findDeck(data.deck, function(deck) {
					if (!deck.deck) return;
					data.deckString = deck.deck;
					startDuel(user, data, socket, chall);
				});
			} else startDuel(user, data, socket, chall);
		} else if (e === 'challenge') {
			if (user.challenges.from[opp.userid]) return;
			if (!data.tier) return;
			if (toId(data.tier) === "random") data.deckString = Game.prototype.randomDeck();
			function addChallenge(user, opp, data, socket) {
				data.deck = Game.prototype.verifyDeck(data.tier, data.deckString);
				//check if error in verification
				if (typeof data.deck === "string") {
					//error = data.deck
					socket.send('err|' + data.deck);
					return;
				}
				var obj = {
					sender: user.userid,
					receiver: opp.userid,
					tier: data.tier,
					deck: data.deck
				};
				opp.challenges.from[user.userid] = obj;
				user.challenges.to[opp.userid] = obj;
				var dataString = 'chall|' + user.userid + ',' + opp.userid + ',' + data.tier;
				opp.send(dataString);
				user.send(dataString);
			}
			if (data.deck && !data.deckString) {
				//provided deck name and no deckString
				//get deckString by name and complete this function
				user.findDeck(data.deck, function(deck) {
					if (!deck.deck) return;
					data.deckString = deck.deck;
					addChallenge(user, opp, data, socket);
				});
			} else addChallenge(user, opp, data, socket);
		}
	},
	'search': function(user, data, socket) {
		if (!data) data = {};
		function addToSearch(user, data, socket) {
			// Cancel Find if already finding
			if (user.finding) {
				delete user.finding;
				cacheUser = null;
				return user.send('search|0');
			}
			
			if (!data.deckString) return;
			data.deck = Game.prototype.verifyDeck(data.tier, data.deckString);
			
			//check if error in verification
			if (typeof data.deck === "string") {
				//error = data.deck
				socket.send('err|' + data.deck);
				return;
			}

			// User is searching. Cache the user.
			if (!cacheUser) {
				cacheUser = {
					userid: user.userid,
					deck: data.deck,
					tier: data.tier
				};
				user.finding = true;
				return user.send('search|1');
			}
			// Found an opponent for the user.
			var opponent = users[cacheUser.userid];
			var opponentDeck = cacheUser.deck;
			var game = new Game(opponent, user, data.tier, true, opponentDeck, data.deck);
			cacheUser = null;
			return opponent.send('search|0');
		}
		if (!data.tier || user.game) return;
		if (!user.named) return socket.send('nametaken||Choose a name to find a duel.');
		if (toId(data.tier) === "random") data.deckString = Game.prototype.randomDeck();
		if (data.deck && !data.deckString) {
			//provided deck name and no deckString
			//get deckString by name and complete this function
			user.findDeck(data.deck, function(deck) {
				if (!deck.deck) return;
				data.deckString = deck.deck;
				addToSearch(user, data, socket);
			});
		} else addToSearch(user, data, socket);
	},
	'game': function(user, data) {
		if (!data || !data.event2) return;
		data.event = data.event2;
		if (user.game) user.game.receive(user, data);
	},
	'duels': function(user, data, socket) {
		var counter = 0,
			max = 100,
			list = "";
		for (var i in games) {
			var duel = games[i];
			list += duel.id + "," + duel.tier + "," + duel.p1.user.name + ',' + duel.p2.user.name + '|';
			counter++;
			if (counter == max) break;
		}
		list = list.slice(0, -1);
		socket.send('duels|' + list);
	},
	'watch': function(user, data) {
		if (user.game || !data.id) return;
		var g = games[data.id];
		if (!g) return;
		g.spectate(user);
	},
	'replay': function(user, data, socket) {
		models.ReplayModel.findOne({
			id: data.id
		}, function(err, replay) {
			if (err || !replay) return;
			socket.send('replay|' + replay.logs);
			socket.disconnect();
		});
	},
	'ladder': function(user, data, socket) {
		var tier = data.tier;
		if (!tier) tier = 'advanced';
		var ladder = ladders[toId(tier)];
		if (!ladder) return;
		ladder.getTop(function(toplist) {
			var count = toplist.length;
			var buffer = '<table><tr><th></th><th>Name</th><th><abbr title="Elo rating">Elo</abbr></th><th><abbr title="user\'s percentage chance of winning a random battle (aka GLIXARE)">GXE</abbr></th><th><abbr title="Glicko-1 rating system: rating&#177;deviation (provisional if deviation>100)">Glicko-1</abbr></th></tr>';
			if (!count) buffer += '<tr><td colspan="8"><em>No one has played any ranked games yet.</em></td></tr>';
			var i, row;
			for (i = 0; i < count; i++) {
				row = toplist[i];
				var N=row['w']+row['l']+row['t'];
				buffer += '<tr>';
				buffer += '<td>' + (i + 1) + '</td>';
				buffer += '<td>' + escapehtml(row['username']) + '</td>';
				buffer += '<td><strong>' + Math.round(row['acre']) + '</strong></td>';
				buffer += '<td>' + Math.round(row['gxe'],1) + '</td>';
				buffer += '<td><em>' + Math.round(row['rpr']) + '<small> &#177; ' + Math.round(row['rprd']) + '</small></em></td>';
				buffer += '</tr>';
			}
			buffer += '</table>';
			socket.send('ladder|' + buffer);
		});
	},
	'save deck': function(user, data, socket) {
		if (!data.name || !data.deckString) return;
		if (!user.registered) {
			user.saveDeckOnRegister = {
				name: data.name,
				deckString: data.deckString
			};
		}
		if (!user.registered) return socket.send(((user.named) ? 'registername|' + user.name + '|' : 'registername||') + 'Must be registered to edit decks.');
		user.saveDeck({
			name: data.name,
			deckString: data.deckString
		});
	},
	'delete deck': function(user, data, socket) {
		if (!user.registered) return socket.send(((user.named) ? 'registername|' + user.name + '|' : 'registername||') + 'Must be registered to edit decks.');
		if (!data.name) return;
		user.deleteDeck(data.name);
	},
	'open deck': function(user, data, socket) {
		if (!user.registered) return socket.send(((user.named) ? 'registername|' + user.name + '|' : 'registername||') + 'Must be registered to edit decks.');
		if (!data.name) return;
		user.openDeck({
			name: data.name,
			id: data.id,
			socket: socket
		});
	},
	
	/* ate */
	'nametaken': function(user, data) {
		user.rename(data.username);
	},
	'nameregged': function(user, data, socket) {
		user.login(data.username, data.password, socket);
	},
	'registername': function(user, data) {
		user.register(data.username, data.password);
	},
	'tokenrename': function(user, data, socket) {
		user.loginByToken(data.token, socket);
	},
	'c': function(user, data, socket) {
		var room = rooms[data.room];
		var msg = data.msg || '';
		if (!msg.trim().length || msg.length > 500) return;
		var sendMessage = parse(msg, room, user, socket);
		if (sendMessage === false || !room) return;
		if (user.muted) return socket.send(room, 'You are muted.');
		if (!user.named) return;//guest cant talk
		room.addLog(user.getIdentity() + '|' + data.msg); //add log
	},
};

module.exports = events;
