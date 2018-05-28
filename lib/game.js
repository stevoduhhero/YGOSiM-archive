var fs = require('fs');
var path = require('path');
var low = require('lowdb');
var db = low('db.json');

/**
 * Setup Game globals.
 */
global.games = {};
global.gameCount = 0;
global.lastSave = 0;

gameCount = db.object.gameCount || 0;
<<<<<<< HEAD
gameCountSaveDifference = 1; //how many games must elapse before updating .txt w/ gameCount
=======
>>>>>>> 30f3aef14c50989fa4adbfef9706ba8e013e6b08
lastSave = gameCount;

//add starter decks to variable
fs.readdir("./starter decks", function(err, files) {
	for (var i in files) {
		var deckString = fs.readFileSync("./starter decks/" + files[i]) + '';
		Game.prototype.starterDecks.push(deckString);
	}
});

/**
 * A Yu-Gi-Oh! Game.
 *
 * @param {Socket Object} p1
 * @param {Socket Object} p2
 * @param {String} tier
 * @param {Boolean} rated
 * @param {Object} p1Deck
 * @param {Object} p2Deck
 */

function Game(p1, p2, tier, rated, p1Deck, p2Deck) {
	//static variables
	this.id = ++gameCount;
	this.p1 = new Side(this, "p1", p1, p1Deck);
	this.p2 = new Side(this, "p2", p2, p2Deck);
	this.tier = tier;
	this.rated = rated;
	this.spectators = {};
	this.replay = {
		send: function(data) {
			this.logs.push(data);
		},
		logs: []
	};
	this.round = 1;
	this.status = "";
	
	this.turn = 0;
	this.phase = "dp";
	this.turnPlayer = this.p1;

	// Create a Yu-Gi-Oh! Game.
	games[this.id] = this;
	var game = games[this.id];
	p1.game = game;
	p2.game = game;
	p1.destroyChallenges();
	p2.destroyChallenges();
	delete p1.finding;
	delete p2.finding;
	
	game.notifyJoins = false;
	game.reconnect(this.replay);
	game.reconnect(this.p1.user);
	game.reconnect(this.p2.user);
	delete game.notifyJoins;
	this.notifyJoin(this.p1.user);
	this.notifyJoin(this.p2.user);
	game.startRockPaperScissors(this.p1);
	game.startRockPaperScissors(this.p2);
<<<<<<< HEAD
	
	//update gameCount.txt every X games
	var difference = gameCount - lastSave;
	if (difference === gameCountSaveDifference) {
		lastSave = gameCount;
		db.object.gameCount = gameCount;
		db.save();
	}
		
=======
	(function() {
		//update gameCount.txt every 10 games
		var difference = gameCount - lastSave;
		if (difference === 10) {
			lastSave = gameCount;
			db.object.gameCount = gameCount;
			db.save();
		}
	})();
>>>>>>> 30f3aef14c50989fa4adbfef9706ba8e013e6b08
	events.afterDuelStarted(game, p1, p2);
}

/**
 * Gives game state on connection
 */

Game.prototype.reconnect = function(user, socket, reset) {
	var spectator = true, x;
	if (user === this.p1.user) {
		spectator = this.p1;
	} else if (user === this.p2.user) {
		spectator = this.p2;
	}
	if (!socket) socket = user;
	var viewingAs = 'p1';
	if (spectator !== true) viewingAs = spectator.player;
	//player data and deck counts
	var dataString = this.p1.user.name + ',' + this.p2.user.name + '|' +
		this.p1.points + ',' + this.p2.points + '|' +
		this.p1.deck.length + ',' + this.p2.deck.length + '|' +
		this.p1.extra.length + ',' + this.p2.extra.length + '|';
	//game state
	var players = ["p1", "p2"];
	var lists = ["hand", "field", "extra", "grave", "banished", "side"];
	var listCount = lists.length;
	for (var listKey = 0; listKey < listCount; listKey++) {
		var list = lists[listKey];
		for (var i = 0; i < 2; i++) {
			var player = this[players[i]];
			if (list === "hand") {
				//you only see your hand, the opponents hand will be "-1"s
				var handCount = player.hand.length;
				for (x = 0; x < handCount; x++) {
					if (spectator === true || spectator !== player) dataString += '-1,'; //-1 means the id is "anonymous/unknown"
					if (spectator === player) dataString += player.hand[x] + ',';
				}
				if (handCount) dataString = dataString.slice(0, -1);
				dataString += "*";
				if (player.player === "p2") dataString = dataString.slice(0, -1) + '|';
			}
			if (list === "field") {
				//everyone can see anything that isn't facedown
				for (x = 0; x < 13; x++) { //13 zones including field and pendulums
					var zone = player.field[x];
					if (typeof zone !== "object") {
						//if not an [] no cards in the zone
						dataString += ",";
						continue;
					}
					var zoneCardCount = zone.length;
					for (var z = 0; z < zoneCardCount; z++) {
						//there can be multiple cards in a zone (overlay, attached cards), the first one is the main one obviously
						//@ is card separator. in card dataStrings the position will be the last character in the string
						//cardid + position + '@' + cardid + position + '@'
						//so "10@20" means "cardid"=1 and "position"=0 and there's another card with a "cardid"=2 and a "position"=0
						var card = zone[z];
						var facedown = false;
						var displayId = card.id;
						if ((card.pos === 2 || card.pos === 3)) facedown = true;
						if (spectator !== player && facedown) displayId = -1;
						var counter = '';
						if (card.counter) counter = '#' + card.counter;
						dataString += displayId + '' + counter + card.pos + "@";
					}
					if (zoneCardCount) dataString = dataString.slice(0, -1);
					dataString += ",";
				}
				dataString = dataString.slice(0, -1) + '*';
				if (player.player === "p2") dataString = dataString.slice(0, -1) + '|';
			}
			if (list === "extra") {
				//you only see your own extra/side deck
				if (spectator === player) dataString += player[list].join(',') + '|';
				if (spectator === true && player.player === viewingAs) dataString += "|";
			}
			if (list === "banished" || list === "grave") {
				//there's no obscuring this data and any player can see it
					//unless cards were banished facedown (ugh!!) (id < 0)
				var cards = player[list];
				var cardCount = cards.length;
				for (var x = 0; x < cardCount; x++) {
					var card = cards[x];
					if (card < 0 && (spectator === true || spectator !== player)) {
						dataString += -1 + ",";
					} else dataString += card + ",";
				}
				if (cardCount) dataString = dataString.slice(0, -1);
				dataString += "*";
				if (player.player === "p2") dataString = dataString.slice(0, -1) + '|';
			}
		}
	}
	dataString = dataString.slice(0, -1);
	
	var gm = this;
	(function() {
		//send dataString
		var prefix = 'g|';
		if (user === gm.replay) prefix = ''; //remove g| from replays to make it smaller
		var isSpectator = ((spectator === true) ? "-" : "");
		var isSideDecking = '';
		if (gm.status === "side decking") {
			isSideDecking = (gm.p1.ready ? 1 : 0) + "" + (gm.p2.ready ? 1 : 0);
			if (spectator !== true && !spectator.ready) {
				isSideDecking += spectator.virginDecksStringify();
			}
		}
		var type = "start";
		if (reset) type = "reset";
		dataString = prefix + type + '|' + gm.id + "," + isSpectator + viewingAs + '|' + dataString + '|' + gm.turnPlayer.player + '|' + gm.phase + '|' + gm.turn + '|' + gm.round + '|' + isSideDecking;
		socket.send(dataString);
	})();
	if (reset) return; //the stuff below has nothing to do with resetting
	if ((this.status === "rps" || this.status === "choose turn order") && spectator !== true) this.startRockPaperScissors(spectator);
	if (user !== this.replay && this.notifyJoins !== false) this.notifyJoin(user);
};
Game.prototype.init = function() {
	this.turn = 0;
	this.phase = "dp";
	this.nextTurn();
	this.status = "started";
	this.turnPlayer.shuffle();
	this.turnPlayer.draw(5);
	this.turnPlayer.opp().shuffle();
	this.turnPlayer.opp().draw(5);
};
Game.prototype.startRockPaperScissors = function(player) {
	if (this.status === "" || this.status === "side decking") this.status = 'rps';
	if (this.status !== "rps" && this.status !== "choose turn order") return;
	var data = 's';
	if (player.rps !== '') data = player.rps + '';
	player.send('rps|' + data);
};
Game.prototype.rps = function(user, choice, chooseTurnOrder) {
	choice = Number(choice);
	if (chooseTurnOrder) return this.chooseTurnOrder(user, choice);
	var player = this.isPlayer(user);
	if (!player) return;
	player.rps = choice;
	
	var choice = [0, this.p1.rps, this.p2.rps];
	if (choice[1] !== "" && choice[2] !== "") {
		//play game
		//0 = loss, 1 = tie, 2 = win
		var rps = {
			0: {0:1, 1:0, 2:2},//rock
			1: {0:2, 1:1, 2:0},//paper
			2: {0:0, 1:2, 2:1}//scissors
		};
		var result = rps[choice[1]][choice[2]];
		if (result === 1) {
			//tie
			this.p1.rps = "";
			this.p2.rps = "";
			this.p1.send('rps|t');
			this.p2.send('rps|t');
			return;
		}
		if (result === 2) {
			//p1 > p2
			this.p1.rps = 'w';
			this.p2.rps = 'l';
		} else if (result === 0) {
			//p2 > p1
			this.p1.rps = 'l';
			this.p2.rps = 'w';
		}
		this.status = "choose turn order";
		this.p1.send('rps|' + this.p1.rps);
		this.p2.send('rps|' + this.p2.rps);
	}
};
Game.prototype.spectate = function(user) {
	user.game = this;
	this.spectators[user.userid] = user;
	this.reconnect(user);
};
Game.prototype.chooseTurnOrder = function(user, whoGo) {
	var player = this.isPlayer(user);
	if (!player) return;
	if (whoGo === 1) this.turnPlayer = player;
	if (whoGo === 2) this.turnPlayer = player.opp();	
	this.init();
};
Game.prototype.contextMenu = function(user, info) {
	var player = this.isPlayer(user);
	if (!player) return;
	var self = this;
	var lists = {
		deck: {
			"View": function() {
				player.viewList(player, info.list);
			},
			"Show": function() {
				player.opp().viewList(player, info.list);
			},
			"Shuffle": function() {
				player.shuffle();
			},
			"Mill": function() {
				player.mill();
			},
			"RFG": function() {
				player.banishTop();
			},
			"RFG Set": function() {
				player.banishTop(true);
			},
			"Draw": function() {
				player.draw();
			},
			"Close List": function() {
				player.clearStatus();
			}
		},
		field: {
			"Rotate": function() {
				var transform = {
					0: 1,
					1: 0,
					2: 3,
					3: 2
				};
				var card = player.field[info.zone];
				if (!card || !card[0]) return;
				card = card[0];
				card.pos = transform[card.pos];
				self.send('rotate|' + player.player + '|' + info.zone);
			},
			"Flip": function() {
				var transform = {
					0: 2,
					2: 0,
					1: 3,
					3: 1
				};
				var card = player.field[info.zone];
				if (!card || !card[0]) return;
				card = card[0];
				card.pos = transform[card.pos];
				var cardId = '';
				if (card.pos === 0 || card.pos === 1) cardId = '|' + card.id;
				self.send('flip|' + player.player + '|' + info.zone + cardId);			
			},
			"Attack": function() {
				var card = player.field[info.zone];
				if (isNaN(info.target) && info.target !== 'direct') return;
				if (!card || !card.length) return;
				if (info.target === 'direct') info.target = '';
				self.send('attack|' + player.player + '|' + info.zone + '|' + info.target);
			},
		},
		hand: {
			"Reveal": function() {
				var cardId = player.hand[info.slot];
				if (!cardId) return;
				self.send('reveal|' + player.player + '|' + info.slot + '|' + cardId);
			},
			"Show Hand": function() {
				player.opp().viewList(player, info.list);
			}
		},
		extra: {
			"View": function() {
				player.viewList(player, info.list);
			},
			"Show": function() {
				player.opp().viewList(player, info.list);
			}
		},
		grave: {
			"View": function() {
				if (info.who !== "you" && info.who !== "opp") return;
				var targetPlayer = player[info.who]();
				player.viewList(targetPlayer, info.list);
			}
		},
		banished: {
			"View": function() {
				if (info.who !== "you" && info.who !== "opp") return;
				var targetPlayer = player[info.who]();
				player.viewList(targetPlayer, info.list);
			}
		}
	};
	if (lists[info.list] && lists[info.list][info.option]) {
		if (info.list === "field" && (info.zone === undefined || isNaN(info.zone))) return;
		if (info.list === "hand" && (info.slot === undefined || isNaN(info.slot))) return;
		lists[info.list][info.option]();
	}
};
Game.prototype.move = function(user, source, target) {
	var player = this.isPlayer(user);
	if (!player) return;
	var sourcePlayer = player[source.who]();
	var targetPlayer = player[target.who]();
	var moveZone = false;
	if (source.list === target.list) {
		if (source.list === "field") {
			if (source.zone === target.zone && target.who === "you") return;
			moveZone = true;
		} else return;
	}
	var revealId = false;
	var revealSelf = false;
	var cardCache = sourcePlayer.cardId(source);
	//check if source card exists, and if included, the target card as well
	if (!cardCache) return;
	if (target.slot !== undefined && target.zone !== undefined && !targetPlayer.cardId(target)) return;
	
	//start moving cards
	if (moveZone) {
		if (target.who === source.who) {
			//card moving zones
			cardCache = sourcePlayer.field[source.zone][source.slot];
			sourcePlayer.field[source.zone].splice(source.slot, 1);
			targetPlayer.field[target.zone].push(cardCache);
		} else {
			//changing card control - in this case we move the entire zone instead of just a single card in case we're changing control of cards with attached cards
			var zoneCache = sourcePlayer.field[source.zone];
			if (targetPlayer.field[target.zone].length) return; //there's already something in the zone
			sourcePlayer.field[source.zone] = [];
			var cardCount = zoneCache.length;
			for (var i = 0; i < cardCount; i++) targetPlayer.field[target.zone].push(zoneCache[i]);
			revealId = zoneCache[0].id; //only the first card can be facedown
		}
	} else {
		//moving lists
		if (target.who !== source.who) {
			//changing card control
			if (target.list === "field") {
				cardCache = sourcePlayer[source.list][source.slot];
				if (targetPlayer.field[target.zone].length) return; //there's already something in the zone
				sourcePlayer[source.list].splice(source.slot, 1);
				targetPlayer.field[target.zone].push({
					id: cardCache,
					pos: 0
				});
				revealId = cardCache;
			} else {
				var cardCache = sourcePlayer[source.list][source.slot];
				var pushFunk = "push";
				if (target.list === "deck" && (!target.pos || target.pos === 0)) pushFunk = "unshift";
				sourcePlayer[source.list].splice(source.slot, 1);
				targetPlayer[target.list][pushFunk](cardCache);
				revealId = cardCache;
			}
		} else {
			//these are cases where the source === target players
			cardCache = sourcePlayer[source.list][source.slot];
			if (source.list === "field") {
				cardCache = sourcePlayer[source.list][source.zone][source.slot].id;
				sourcePlayer[source.list][source.zone].splice(source.slot, 1);
			} else sourcePlayer[source.list].splice(source.slot, 1);
			if (target.list === "deck" && (!target.pos || target.pos === 0)) {
				targetPlayer[target.list].unshift(cardCache); //at the top of the deck
			} else {
				var pushObj = cardCache;
				if (target.list === "field") {
					pushObj = {
						id: cardCache,
						pos: target.pos
					};
					targetPlayer[target.list][target.zone].push(pushObj);
				} else targetPlayer[target.list].push(pushObj);
			}
			revealId = cardCache;
			if (target.pos === 2 || target.pos === 3) {
				revealSelf = cardCache;
				revealId = false;
			}
		}
	}
	if (revealId !== false && source.list === "hand" && target.list === "deck") {
		revealSelf = revealId;
		revealId = false;
	}
	if (revealId !== false && source.list === "field" && target.list !== "field") {
		//grave and banished are the only two public lists other than field
		if (target.list !== "grave" && target.list !== "banished") revealId = false;
	}

	function strConstruct(info) {
		function str(text) {
			if (text === undefined) return "";
			return text;
		}
		return info.who + ',' + info.list + ',' + str(info.slot) + ',' + str(info.zone) + ',' + str(info.pos);
	}
	var dataString = 'move|' + player.player + "|" + strConstruct(source) + '|' + strConstruct(target);
	if (revealId === false) {
		//don't send reveal'd id to spectators
		sourcePlayer.send(dataString + ((revealSelf !== false) ? '|' + revealSelf : '')); //the owner of the card must at least know what it is
		sourcePlayer.sendExclude(dataString);
		return;
	}
	this.send(dataString + ((revealId !== false) ? '|' + revealId : ''));
};
Game.prototype.changePhase = function(user, phase) {
	if (phase === this.phase) return;
	var player = this.isPlayer(user);
	if (!player) return;
	if (phase === "nextTurn") return this.nextTurn();
	this.phase = phase;
	this.send('phase|' + phase);
};
Game.prototype.changePoints = function(user, amount) {
	var player = this.isPlayer(user);
	if (!player) return;
	if (isNaN(amount)) return;
	if (amount === 0) return;
	player.points += amount;
	this.send('changePoints|' + player.player + '|' + amount);
};
Game.prototype.nextTurn = function() {
	this.phase = "dp";
	this.turn++;
	var data = '';
	if (this.turn === 1) {
		//let them know who is the initial turn player
		data = '|' + this.turnPlayer.player;
	} else this.turnPlayer = this.turnPlayer.opp();
	this.send('nextTurn' + data);
};
Game.prototype.tie = function() {
	this.winner = false;
	this.loser = false;
	this.send('win|tie');
	this.nextRound();
};
Game.prototype.nextRound = function() {
	var matchWinner;
	if (this.p1.wins === 2) {
		matchWinner = true;
		this.winner = this.p1.player;
		this.loser = this.p2.player;
	} else if (this.p2.wins === 2) {
		matchWinner = true;
		this.winner = this.p2.player;
		this.loser = this.p1.player;
	}
	if (matchWinner) {
		this.ladderResolve();
		events.afterDuelEnded(this, this[this.winner].user, this[this.loser].user);
	} else {
		this.round++;
		this.status = "side decking";
		this.p1.send('nextRound|' + "00" + this.p1.virginDecksStringify());
		this.p2.send('nextRound|' + "00" + this.p2.virginDecksStringify());
		this.send('nextRound|1', true);
	}
};
Game.prototype.chat = function(user, msg) {
	this.send('chat|' + user.getIdentity() + '|' + msg);
};
Game.prototype.notifyLeave = function(user) {
	this.send('l|' + user.name);
};
Game.prototype.notifyJoin = function(user) {
	this.send('j|' + user.name);
};
Game.prototype.leave = function(user) {
	var player = this.isPlayer(user);
	if (player) {
		player.user = {
			left: true,
			name: player.user.name,
			userid: player.user.userid,
			send: function() {},
			originalUser: player.user
		};
	} else {
		delete this.spectators[user.userid];
	}
	delete user.game;
	this.notifyLeave(user);
	if (Object.keys(this.spectators).length === 0) {
		//no spectators
		if (!this.p1.user.connected && !this.p2.user.connected) {
			//everyone left
			this.destroy();
		}
	}
};
Game.prototype.saveReplay = function() {
	if (this.replay.saved) return;
	var self = this;
	this.replay.saved = true;
	var replay = new models.ReplayModel({
		id: self.id,
		p1: self.p1.user.name,
		p2: self.p2.user.name,
		logs: self.replay.logs.join('\n')
	});
	replay.save(function(err) {
		if (err) throw err;
		var p1u = self.p1.user;
		var p2u = self.p2.user;
		if (self.p1.user.left) p1u = self.p1.user.originalUser;
		if (self.p2.user.left) p2u = self.p2.user.originalUser;
		p1u.send('newreplay|' + self.id + '|' + self.p2.user.name);
		p2u.send('newreplay|' + self.id + '|' + self.p1.user.name);
	});
};
Game.prototype.ladderResolve = function() {
	if (!this.rated) return;
	//i changed it so that if it took a lot of losses to win your score is lower (bcos best out of 3)
	//zarels was if (winner === p1) p1score = 1; else p1score = 0;
	var self = this;
	var score = 0.5;
	var winCount = this[this.winner].wins;
	var lossCount = this[this.winner].losses;
	var lossScore = score * (winCount - lossCount) / winCount;
	var winnerScore = score + score - lossScore;
	var loserScore = 1 - winnerScore;
	if (this.winner === "p1") {
		var p1score = winnerScore;
	} else p1score = loserScore;
	var ladder = ladders[toId(this.tier)];
	var p1 = {userid: this.p1.user.userid, username: this.p1.user.name};
	var p2 = {userid: this.p2.user.userid, username: this.p2.user.name};
	self.send('raw|LADDER UPDATING...');
	ladder.updateRating(p1, p2, p1score, function() {
		var oldacre = Math.round(p1.rating.oldacre);
		var acre = Math.round(p1.rating.acre);
		var reasons = '' + (acre - oldacre) + ' for ' + (p1score > 0.99 ? 'winning' : (p1score < 0.01 ? 'losing' : 'tying'));
		if (reasons.charAt(0) !== '-') reasons = '+' + reasons;
		self.send('raw|' + escapehtml(p1.username) + '\'s rating: ' + oldacre + ' &rarr; <strong>' + acre + '</strong><br />(' + reasons + ')');

		oldacre = Math.round(p2.rating.oldacre);
		acre = Math.round(p2.rating.acre);
		reasons = '' + (acre - oldacre) + ' for ' + (p1score > 0.99 ? 'losing' : (p1score < 0.01 ? 'winning' : 'tying'));
		if (reasons.charAt(0) !== '-') reasons = '+' + reasons;
		self.send('raw|' + escapehtml(p2.username) + '\'s rating: ' + oldacre + ' &rarr; <strong>' + acre + '</strong><br />(' + reasons + ')');
	});
};
Game.prototype.destroy = function() {
	this.saveReplay();
	delete games[this.id];
};
Game.prototype.receive = function(user, data) {
	switch(data.event) {
		case 'chat':
			this.chat(user, data.msg);
			break;
		
		case 'move':
			this.move(user, data.source, data.target);
			break;
		
		case 'rps':
			this.rps(user, data.rps, data.chooseTurnOrder);
			break;
		
		case 'phase':
			this.changePhase(user, data.phase);
			break;

		case 'contextMenu':
			this.contextMenu(user, data);
			break;
		
		case 'resultButton':
			var type = data.type;
			var player = this.isPlayer(user);
			if (type === "Admit Defeat") {
				if (!player || player.winner !== undefined) return;
				player.admitDefeat();
			} else if (type === "Offer Draw" || type === "Accept Draw") {
				if (!player || player.offeredTie) return;
				if (player.opp().offeredTie === true) {
					delete player.offeredTie;
					delete player.opp().offeredTie;
					return this.tie();
				}
				player.offeredTie = true;
				this.send('offerDraw|' + player.player);
			} else if (type === "Revoke Draw") {
				if (!player || !player.offeredTie) return;
				delete player.offeredTie;
				this.send('revokeDraw|' + player.player);
			} else if (type === "Leave") {
				this.leave(user);
			}
			break;
		
		case 'changePoints':
			this.changePoints(user, data.amount);
			break;
		
		case 'rollDice':
		case 'coinFlip':
			var player = this.isPlayer(user);
			if (!player) return;
			if (data.event === "rollDice") {
				var ran = Math.floor(Math.random() * 6) + 1;
			} else var ran = Math.floor(Math.random() * 2);
			this.send(data.event + '|' + player.player + '|' + ran);
			break;
		
		case 'targetCard':
			var player = this.isPlayer(user);
			if (!player || !player[data.list] || !player[data.list][data.slot]) return;
			var targetedSide = player.opp().player;
			this.send('targetCard|' + targetedSide + '|' + data.list + '|' + data.slot);
			break;
		
		case 'token':
			var player = this.isPlayer(user);
			if (!player) return;
			var openZone = false;
			var zoneOrder = [2, 3, 1, 4, 0];
			for (var z = 0; z < 5; z++) {
				var zone = zoneOrder[z];
				if (!player.field[zone].length) {
					openZone = zone;
					break;
				}
			}
			if (openZone === false) return;
			var sheepColor = {
				0: 73915054, //orange
				1: 73915052, //yellow
				2: 73915053, //blue
				3: 73915055, //red
				4: 73915053 //blue
			};
			var cardId = sheepColor[openZone];
			player.field[openZone].push({
				id: cardId,
				pos: 1
			});
			this.send('token|' + player.player + '|' + openZone + '|' + cardId);
			break;
		
		case 'doneSiding':
			var player = this.isPlayer(user);
			if (!player || !data.newDeck) return;
			var deck = {deck: [], extra: [], side: []};
			var virginDeckCount = 0;
			var newDeckCount = 0;
			var count = 0;
			for (var targetList in deck) {
				var targetDeck = deck[targetList];
				virginDeckCount += player.virginDecks[targetList].length;
				var newDeck = data.newDeck[targetList];
				for (var i in newDeck) {
					var txt = newDeck[i];
					var cardKey = txt.replace(/[^0-9.]/g, "");
					var idLen = txt.length - cardKey.length;
					var sourceDeck = txt.substr(0, idLen);
					//check if card exists in virgin deck
					var cardId = player.virginDecks[sourceDeck];
					if (cardId) {
						cardId = cardId[cardKey];
						targetDeck.push(cardId);
						newDeckCount++;
					}
				}
			}
			if (deck.deck.length > 60) return;
			if (deck.deck.length < 40) return;
			if (deck.extra.length > 15) return;
			if (deck.side.length > 15) return;
			if (virginDeckCount !== newDeckCount) return;
			
			player.ready = deck;
			if (player.opp().ready) {
				//start next round
				if (this.winner === false) {
					this.p1.rps = "";
					this.p2.rps = "";
					this.startRockPaperScissors(this.p1);
					this.startRockPaperScissors(this.p2);
				} else {
					this.status = "rps";
					var winner = this[this.winner];
					var loser = this[this.loser];
					loser.rps = "w";
					winner.rps = "l";
					loser.send('rps|w');
					winner.send('rps|l');
				}
				this.p1.doneSiding(this.p1.ready);
				this.p2.doneSiding(this.p2.ready);
				this.reconnect(this.p1.user, undefined, true);
				this.reconnect(this.p2.user, undefined, true);
				this.reconnect(this.replay, undefined, true);
				for (var i in this.spectators) {
					this.reconnect(this.spectators[i], undefined, true);
				}
				delete player.ready;
				delete player.opp().ready;
				delete this.winner;
				delete this.loser;
			}
			break;
		
		case 'counter':
			var player = this.isPlayer(user);
			data.zone = Number(data.zone);
			if (!player || !data.type || !(data.zone >= 0 && data.zone < 11)) return;
			var firstSlot = player.field[data.zone][0];
			if (!firstSlot || (firstSlot.pos === 2 || firstSlot.pos === 3)) return;
			if (!firstSlot.counter) firstSlot.counter = 0;
			if (data.type === "+") {
				firstSlot.counter++;
			} else if (data.type === "-") {
				if (firstSlot.counter === 0) return;
				firstSlot.counter--;
				if (firstSlot.counter === 0) delete firstSlot.counter;
			} else return;
			this.send('counter|' + player.player + '|' + data.type + data.zone);
			break;
	}
};
Game.prototype.send = function(data, dontSendTo) {
	this.replay.send(data); //before adding 'g|' so log is smaller
	data = 'g|' + data;
	if (dontSendTo !== true) {
		//if dontSendTo === true ONLY send to spectators
		if (this.p1 !== dontSendTo) this.p1.user.send(data);
		if (this.p2 !== dontSendTo) this.p2.user.send(data);
	}
	var spectators = Object.keys(this.spectators);
	var len = spectators.length;
	while (len--) {
		this.spectators[spectators[len]].send(data);
	}
};
Game.prototype.isPlayer = function(user) {
	if (user === this.p1.user) {
		return this.p1;
	} else if (user === this.p2.user) {
		return this.p2;
	}
	return false;
};
Game.prototype.importDeck = function(deckString) {
	/*
		okay so it's like this
		0 "+" = 1 copy
		1 "+" = 2 copies
		2 "+" = 3 copies

		"|" separates the cards
		for example maindeck: +card0|card1|++card2|card3@
							 ^ this would be 2 copies of card0, 1 copy of card1, 3 of card2, 1 of card3, then the main deck is closed by @ (7cards)
	*/
	var decks = deckString.split('@');
	var deck = {
		main: new Array(),
		extra: new Array(),
		side: new Array()
	};
	var deckKeys = ["main", "extra", "side"];
	for (var deckKey in decks) {
		var cards = decks[deckKey].split('|');
		for (var x in cards) {
			var copies = cards[x].split('+').length,
				cardId = cards[x].replace(/|/g, "").replace(/\+/g, "");
			for (var addCount = 0; addCount < copies; addCount++) if (cardId > 0) deck[deckKeys[deckKey]].push(cardId);
		}
	}
	return deck;
};
Game.prototype.getLimit = require('./cardLimit.js');
Game.prototype.verifyDeck = function(tier, deckString) {
	tier = toId(tier);
	var deck = this.importDeck(deckString),
		err = "";
	//eventually check if they are real cards if (typeof card == string) return; //all card id's are numbers
	if (deck.main.length < 40) err += "Main deck must be at least 40 cards.*";
	if (deck.main.length > 60) err += "Main deck must be less than or equal to 60 cards.*";
	if (deck.extra.length > 15) err += "Extra deck must be 15 or less cards.*";
	if (deck.side.length > 15) err += "Side deck must be 15 or less cards.*";
	var cards = {};
	for (var list in deck) {
		var currentDeck = deck[list];
		for (var cardKey in currentDeck) {
			var cardId = currentDeck[cardKey];
			//get card limit
			var cardLimit = 3;
			var cardName = cardId;
			if (tier !== "unlimited" && tier !== "random") {
				cardLimit = this.getLimit(cardId);
				cardName = cardLimit.name;
				if (tier === "advanced") {
					cardLimit = cardLimit.limit[0];
				} else if (tier === "traditional") {
					cardLimit = cardLimit.limit[1];
				}
			}
			//add card counter
			if (!cards[cardName]) cards[cardName] = 0;
			//check if passed limit
			if (++cards[cardName] - cardLimit === 1) {
				err += "You can only have " + cardLimit + " copies of the card \"" + cardName + "\".*";
			}
		}
	}
	err = err.slice(0, -1);
	if (err) return err;
	return deck;
};
Game.prototype.starterDecks = [];
Game.prototype.randomDeck = function() {
	var ran = Math.floor(Math.random() * this.starterDecks.length);
	return this.starterDecks[ran];
};
Game.prototype.shuffle = function(ray) {
	for(var j, x, i = ray.length; i; j = parseInt(Math.random() * i), x = ray[--i], ray[i] = ray[j], ray[j] = x);
	return ray;
};

function Side(game, player, userObject, deck) {
	this.game = game;
	this.player = player;
	this.user = userObject;
	this.wins = 0;
	this.losses = 0;
	this.defaults();
	this.setDeck(deck);
	return this;
}
Side.prototype.defaults = function() {
	this.rps = "";
	this.points = 8000;
	this.hand = [];
	this.field = [ [], [], [], [], [], [], [], [], [], [], [], [], [] ];
	this.grave = [];
	this.banished = [];
};
Side.prototype.setDeck = function(deck) {
	var mainDeck = deck.main;
	if (!mainDeck) mainDeck = deck.deck;
	this.virginDecks = {deck: mainDeck, extra: deck.extra, side: deck.side};
	//create copies of the decks that we will manipulate
	for (var deckId in this.virginDecks) {
		var deck = this.virginDecks[deckId];
		this[deckId] = [];
		for (var i in deck) {
			this[deckId].push(deck[i]);
		}
	}
};
Side.prototype.doneSiding = function(deck) {
	this.defaults();
	this.setDeck(deck);
};
Side.prototype.send = function(data) {
	this.user.send('g|' + data);
};
Side.prototype.sendExclude = function(data) {
	this.game.send(data, this);
};
Side.prototype.opp = function() {
	var opp = "p1";
	if (this.player === "p1") opp = "p2";
	return this.game[opp];
};
Side.prototype.you = function() {
	return this;
};
Side.prototype.cardId = function(info) {
	var cardid;
	var list = this[info.list];
	if (list && list[info.slot]) cardId = list[info.slot];
	if (info.list === "field") {
		var zone = list[info.zone];
		if (zone && zone[info.slot]) cardId = zone[info.slot].id;
	}
	return cardId;
};
Side.prototype.draw = function(amount) {
	if (!amount) amount = 1;
	var player = this;
	if (player.deck.length === 0) return;
	for (var i = 0; i < amount; i++) {
		var cardCache = player.deck[0];
		player.deck.splice(0, 1);
		player.hand.push(cardCache);
		player.send('draw|' + player.player + '|' + cardCache);
		player.sendExclude('draw|' + player.player + '|' + -1);
	}
};
Side.prototype.mill = function(list, faceDown) {
	var player = this;
	if (!list) list = "grave";
	if (player.deck.length === 0) return;
	var cardCache = player.deck[0];
	player.deck.splice(0, 1);
	if (faceDown) cardCache = -1 * cardCache;
	player[list].push(cardCache);
	if (faceDown) {
		player.send('mill|' + player.player + '|' + list + '|' + cardCache);
		player.sendExclude('mill|' + player.player + '|' + list + '|' + -1);
	} else {
		player.game.send('mill|' + player.player + '|' + list + '|' + cardCache);
	}
};
Side.prototype.banishTop = function(faceDown) {
	this.mill("banished", faceDown);
};
Side.prototype.viewList = function(targetPlayer, list) {
	var player = this;
	var cards = '';
	if ((targetPlayer !== player && list === "extra") || list === "deck" || list === "hand") {
		//send extra list only if viewed by opponent
		cards = '|' + targetPlayer[list].join(',');
	}
	player.send('view|' + player.player + '|' + targetPlayer.player + '|' + list + cards);
	player.sendExclude('view|' + player.player + '|' + targetPlayer.player + '|' + list);
};
Side.prototype.setStatus = function(status) {
	this.game.send('status|' + this.player + '|' + status);
};
Side.prototype.clearStatus = function() {
	this.setStatus("");
};
Side.prototype.admitDefeat = function() {
	var game = this.game;
	var loser = this;
	var winner = this.opp();
	game.loser = loser.player;
	game.winner = winner.player;
	winner.wins++;
	loser.losses++;
	game.send('win|' + game.winner + '|' + game.loser + '|' + winner.wins + "-" + loser.wins);
	game.nextRound();
};
Side.prototype.shuffle = function() {
	this.deck = this.game.shuffle(this.deck);
	this.game.send('shuffle|' + this.player);
};
Side.prototype.virginDecksStringify = function() {
	var decks = ["deck", "extra", "side"];
	var str = '';
	for (var i in decks) {
		str += this.virginDecks[decks[i]].join(',') + "*";
	}
	str = str.slice(0, -1);
	return str;
};

module.exports = Game;
