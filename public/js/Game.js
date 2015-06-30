function Game(data) {
	var game = this;
	var duelInfo = data[1].split(',');
	var duelId = Number(duelInfo[0]);
	var you = duelInfo[1];
	if (you.charAt(0) === "-") {
		//spectating
		you = you.substr(1);
		game.spectating = true;
	}

	function Side(game, player) {
		this.player = player;
		this.game = game;
		this.hand = [];
		return this;
	}
	Side.prototype.you = function() {
		return this;
	};
	Side.prototype.opp = function() {
		var opp = "p1";
		if (this.player === "p1") opp = "p2";
		return this.game[opp];
	};
	Side.prototype.who = function() {
		if (this === this.game.you) return "you";
		return "opp";
	};
	Side.prototype.draw = function(card, callback) {
		//move card element from deck to hand and add it to hand element
		var self = this;
		var img = cardImg(card);
		var moveTo = $("#" + self.who() + "hand img").last(); //move to last img in hand
		if (moveTo.length === 0) moveTo = $("#" + self.who() + "hand"); //no cards in hand so move to center of hand
		self.deck.splice(0, 1);
		self.game.updateListCounts();
		img.copy($("#" + self.who() + "deck"), true).toBody().moveTo(moveTo, 250, function() {
			self.hand.push(card);
			self.game.update({list: "hand", who: self.who()});
			$(img).remove();
			callback();
		});
	};
	Side.prototype.mill = function(card, callback, list) {
		//move card element from deck to list
		if (!list) list = "grave";
		var self = this;
		var img = cardImg(card);
		var moveTo = $("#" + self.who() + list);
		self.deck.splice(0, 1);
		self.game.updateListCounts();
		img.copy($("#" + self.who() + "deck"), true).toBody().moveTo(moveTo, 250, function() {
			self[list].push(card);
			self.game.updateListCounts();
			$(img).remove();
			callback();
		});
	};
	Side.prototype.banishTop = function(card, callback) {
		this.mill(card, callback, "banished");
	};
	Side.prototype.cardImg = function(info) {
		var card = this[info.list][info.slot];
		var revealedId = card;
		var defense = false;
		if (info.list === "field") {
			card = this.field[info.zone][info.slot];
			revealedId = card.id;
			if (card.pos === 2 || card.pos === 3) revealedId = -1;
			if (card.pos === 1 || card.pos === 3) defense = true;
		}
		var cardEl = $(cardImg(revealedId, !info.anim));
		if (this.who() === "opp") cardEl.addClass("v");
		if (defense) cardEl.addClass("defense");
		return cardEl[0];
	};
	Side.prototype.viewList = function(targetPlayer, list, cards) {
		var whoseDeck = "opposing";
		if (this.who() === targetPlayer.who()) whoseDeck = "their";
		var status = "Viewing " + whoseDeck + " " + list;
		if (cards) {
			//just pop up a list of cards
			//list viewer title = status
			$("#" + this.who() + "status").empty();
			$(".viewList").remove();
			var cardList = '<div id="View' + targetPlayer.who() + ((list === "grave" && targetPlayer.who() === "opp") ? list : '') + '" class="viewList">' +
								'<div class="rel">' +
									'<div class="viewListTitle">' + status.replace('their', 'your') + '</div>' +
									'<div class="closeList">x</div>' +
									'<div class="cardList">' +
									'</div>' +
								'</div>' +
							'</div>';
			$(".mainTable").prepend(cardList);
			var cardCount = cards.length;
			for (var i = 0; i < cardCount; i++) $(".cardList").append(cardImg(cards[i], true));
		} else {
			//put the viewing status on the field
			$("#" + this.who() + "status").html(status);
		}
		if (cards) {
			if (list === "deck") targetPlayer[list] = cards;
			this.game.cardList = {
				targetPlayer: targetPlayer,
				list: list
			};
		}
	};
	Side.prototype.changePoints = function(amount, callback) {
		var self = this;
		var goal = self.points + amount;
		var $parent = $('#' + self.who() + 'points');
		var $baby = $parent.find('span');
		if (amount > 0) $parent.addClass('gaining'); else $parent.addClass('losing');
		$({points: self.points}).animate({points: goal}, {
			duration: 1000,
			easing: 'swing',
			step: function() {
				$baby.html(Math.round(this.points));
			},
			complete: function() {
				$parent.removeClass('gaining').removeClass('losing');
				self.points = goal;
				self.game.updatePlayersInfo();
				callback();
			}
		});
		this.game.addLog(this.name + ' has ' + ((amount > 0) ? 'gained' : 'lost') + ' ' + Math.abs(amount) + ' life points.');
	};
	app.mode("game");
	game.id = duelId;
	game.p1 = new Side(game, "p1");
	game.p2 = new Side(game, "p2");
	game.you = game[you];
	game.opp = game.you.opp();
	game.queue = [];
	game.isQueueProcessing = false;
	game.unparsedData = data;
	if (!app.replaying) newurl("/duel-" + game.id);
	return game;
}
Game.prototype.resize = function() {
	var gameChatHeight = $("body").height() - $(".gameChat").offset().top;
	var minGameChatHeight = 105;
	if (gameChatHeight < minGameChatHeight) gameChatHeight = minGameChatHeight;
	$(".gameLogs").height(gameChatHeight - 34 - 10);
	$(".gameChat").height(gameChatHeight);
};
Game.prototype.parseStartData = function(data, reset) {
	var you = data[1];
	//parse the single variables
	this.turnPlayer = this[data[11]];
	this.phase = data[12];
	this.turn = Number(data[13]);
	this.round = Number(data[14]);
	this.isSideDecking = data[15];
	
	//parse the lists
	data = {
		name: data[2].split(','),
		points: data[3].split(','),
		mainCount: data[4].split(','),
		extraCount: data[5].split(','),
		hand: data[6].split('*'),
		field: data[7].split('*'),
		extra: data[8].split(','),
		grave: data[9].split('*'),
		banished: data[10].split('*')
	};
	var playerCount = data.name.length;
	for (var key in data) {
		var val = data[key];
		for (var p = 0; p < playerCount; p++) {
			var obj;
			if (key === "name") {
				obj = val[p];
			} else if (key === "points" || key === "mainCount" || key === "extraCount") {
				obj = Number(val[p]);
			} else if (key === "hand") {
				obj = val[p].split(',');
				obj = allToNum(obj);
			}
			if (key === "field") {
				obj = val[p].split(','); //gives you the zones, but the zones may have multiple cards
				for (var z in obj) {
					var zoneTxt = obj[z].split('@');
					var zone = [];
					for (var c in zoneTxt) {
						if (zoneTxt[c] === "") {
							zoneTxt.splice(c, 1); //delete blank entries
							continue;
						}
						var pos = zoneTxt[c].slice(-1);
						var cardId = zoneTxt[c].slice(0, -1);
						var counter = 0;
						var splint = cardId.split('#');
						if (splint.length - 1 > 0) {
							cardId = splint[0];
							counter = splint[1];
						}
						var card = {
							id: Number(cardId),
							pos: Number(pos)
						};
						if (counter) card.counter = Number(counter);
						zone.push(card);
					}
					obj[z] = zone;
				}
			} else if (key === "extra" || key === "side") {
				obj = val;
				obj = allToNum(obj);
			} else if (key === "grave" || key === "banished") {
				obj = (val[p] || '');
				if (obj) {
					obj = obj.split(',');
				} else obj = [];
				obj = allToNum(obj);
			}
			this["p" + (p + 1)][key] = obj;
		}
	}
		
	function blankRay(num) {
		var ray = [];
		for (var i = 0; i < num; i++) ray.push(-1);
		return ray;
	}
	this.p1.deck = blankRay(this.p1.mainCount);
	this.p2.deck = blankRay(this.p2.mainCount);
	this.opp.extra = blankRay(this.opp.extraCount); //don't blankRay extra for "you" because everyone knows their own extra deck
	if (this.spectating === true) this.you.extra = blankRay(this.you.extraCount); //blankRay it only if it's a spectator
	this.updateGame(reset);
	
	if (this.isSideDecking) this.startSiding();
};
Game.prototype.parseResetData = function(data) {
	this.parseStartData(data, true);
};
Game.prototype.updateGame = function(reset) {
	//turn all the $().remove, $().empty into update()'s so that we also maintain the current game state
	$(".viewList").remove();
	$(".status").empty();
	if (!reset) $(".gameLogs").empty();
	$("#draw").html("Offer Draw");
	$("#draw, #admit").prop("disabled", false);
	this.updatePlayersInfo();
	this.updateListCounts();
	this.updatePhases();
	this.update({list: "hand", who: "you"});
	this.update({list: "hand", who: "opp"});
	this.updateFields();
};
Game.prototype.updateFields = function() {
	for (var i = 1; i < 3; i++) {
		var player = this["p" + i];
		for (var z = 0; z < 13; z++) {
			this.update({list: "field", zone: z, who: player.who()});
		}
	}
};
Game.prototype.updatePlayersInfo = function() {
	for (var p = 1; p < 3; p++) {
		var player = this["p" + p];
		$("#" + player.who() + "points").html($("<div/>").text(player.name).html() + "<span>" + player.points + "</span>");
	}
};
Game.prototype.updatePhases = function() {
	$(".selectablePhase").removeClass("selectablePhase");
	$(".selectedPhase").removeClass("selectedPhase");
	if (this.turnPlayer === this.you && this.turn !== 0) {
		//enable the nextTurn phase
		$(".phase").addClass("selectablePhase");
	}
	if (this.phase) $("#" + this.phase).addClass("selectedPhase").removeClass("selectablePhase");
};
Game.prototype.updateListCounts = function() {
	var lists = ["deck", "extra", "grave", "banished"];
	var listsLen = lists.length;
	for (var p = 1; p < 3; p++) {
		var player = this["p" + p];
		for (var i = 0; i < listsLen; i++) {
			var list = lists[i];
			var el = $("#" + player.who() + list);
			el.empty();
			var listCount = player[list].length;
			if (listCount !== 0) {
				//add image
				var cardId = -2;
				if (list === "grave" || list === "banished") cardId = player[list][listCount - 1];
				var card = $(cardImg(cardId, true));
				if (player.who() === "opp") card.addClass("v");
				card.appendTo(el);
			}
			el.append('<span class="deckCount"><span>' + listCount + '</span></span>');
		}
	}
	this.updateListViewer();
};
Game.prototype.updateListViewer = function() {
	if (!this.cardList) return;
	var targetPlayer = this.cardList.targetPlayer;
	var list = this.cardList.list;
	targetPlayer.viewList(targetPlayer, list, targetPlayer[list]);
};
Game.prototype.update = function(info) {
	var player = this[info.who];
	var el;
	var len;
	if (info.list === "field") {
		el = $("#" + player.who() + info.zone);
		//cache first card width before we empty the zone
		var firstCardWidth = el.find('img').width();
		
		//empty zone
		el.empty();
		
		//determine the spacing of the cards attached if any are
		var cardsAttached;
		len = player.field[info.zone].length;
		if (len > 1) {
			cardsAttached = true;
			var cardSpacing = (el.width() - firstCardWidth) / (len - 1);
		}
		
		//render cards
		for (var i = 0; i < len; i++) {
			info.slot = i;
			var cardEl = $(player.cardImg(info));
			if (cardsAttached) {
				var lefty = (cardSpacing * i);
				cardEl.css({
					position: "absolute",
					left: ((i === 0) ? 0 : lefty) + "px",
					"z-index": len - i
				});
			}
			el.append(cardEl);
		}
		
		//add the counter
		var firstSlot = player.field[info.zone][0];
		if (firstSlot && firstSlot.counter) {
			el.prepend('<div class="counter">' + firstSlot.counter + '</div>');
		}
		
		//re-render the zone if needed
		if (firstCardWidth === null && len > 0) return this.update(info);
		
		//attack / defense
		if (len) {
			var card = player.field[info.zone][0];
			var stats = cardInfo(card.id);
			if ((card.pos === 0 || card.pos === 1) && stats.atk && el.hasClass("fieldZone")) el.append('<span>' + stats.atk + ' / ' + stats.def + '</span>');
		}
	} else if (info.list === "hand") {
		var revealedCards = false;
		el = $("#" + player.who() + "hand").empty();
		len = player.hand.length;
		for (var i = 0; i < len; i++) {
			var card = player.hand[i];
			var cardEl = $(cardImg(card, true));
			if (card !== -1) revealedCards = true;
			cardEl.appendTo(el);
		}
		//if cards in hand !== -1 they are being revealed temporarily, in 1000ms revert the ids
		var self = this;
		if (!revealedCards || info.who === "you") return;
		for (var i = 0; i < len; i++) player.hand[i] = -1;
		setTimeout(function() {
			self.update(info);
		}, 1000);
	} else {
		this.updateListCounts();
	}
};
Game.prototype.rpsReceive = function(rps) {
	if (!isNaN(rps) && rps !== "") rps = Number(rps);
	if (rps === "l" || rps === "w") {
		$(".sidingContainer").remove();
		if (rps == "w") {
			function addWhoGo() {
				var insides = '';
				insides += '<div id="whoGo" class="abs">';
				insides += '<button onclick="app.game.whoGo(1);">First</button>';
				insides += '<button onclick="app.game.whoGo(2);">Second</button>';
				insides += '</div>';
				$("body").append(insides);
			}
			if ($("#rps").length) {
				var fadey;
				if (app.game.rps === 0) {
					fadey = 2;
					$("#rps1").remove();
				}
				if (app.game.rps === 1) {
					fadey = 0;
					$("#rps2").remove();
				}
				if (app.game.rps === 2) {
					fadey = 1;
					$("#rps0").remove();
				}
				fadey = $("#rps" + fadey).css('color', 'blue').hide();
				$('#rps').append('<br /><b><font color="green">You win...</font></b>');
				fadey.fadeIn(1000, function() {
					$("#rps").fadeOut(250, function() {
						$("#rps").remove();
						addWhoGo();
					});
				});
			} else {
				addWhoGo();
			}
		}
		if (rps === "l") {
			var fadey;
			if (app.game.rps === 0) {
				fadey = 1;
				$("#rps2").remove();
			}
			if (app.game.rps === 1) {
				fadey = 2;
				$("#rps0").remove();
			}
			if (app.game.rps === 2) {
				fadey = 0;
				$("#rps1").remove();
			}
			fadey = $("#rps" + fadey).css('color', 'blue').hide();
			$('#rps').append('<br /><b><font color="red">You lose...</font></b>');
			fadey.fadeIn(1000, function() {
				$("#rps").fadeOut(250, function() {
					$("#rps").remove();
				});
			});
		}
	} else if (rps === "t") {
		var deletions = {0: 1, 1: 1, 2: 2};
		delete deletions[app.game.rps];
		for (var i in deletions) $("#rps" + i).remove();
		$("#rps" + app.game.rps).clone().css('color', 'blue').hide().attr("id", "fadey").appendTo('#rps').append('<br /><b><font color="grey">Tie...</font></b>');
		$("#fadey").fadeIn(1000, function() {
			app.game.rpsReceive("s");
		});
	} else if (rps === "s" || typeof rps === "number") {
		$("#rps").remove();
		var insides = '';
		insides += '<div id="rps" class="abs rps unselectable">';
		insides += '<span class="rpstitle">Roshambo</span>';
		insides += '<img src="./img/rock.png" id="rps0" onclick="app.game.rpsChoose(0);" />';
		insides += '<img src="./img/paper.png" id="rps1" onclick="app.game.rpsChoose(1);" />';
		insides += '<img src="./img/scissors.png" id="rps2" onclick="app.game.rpsChoose(2);" />';
		insides += '</div>';
		$("body").append(insides);
		$("#rps" + rps).css({
			opacity: 1
		});
		app.game.rps = undefined;
		if (rps != "s") app.game.rps = rps;
	}	
};
Game.prototype.rpsChoose = function(item) {
	var item = item + '';
	if (app.game.rps !== undefined) return;
	$("#rps" + item).css({
		opacity: 1
	});
	app.game.rps = Number(item);
	this.send('rps', {
		rps: app.game.rps
	});
};
Game.prototype.whoGo = function(whoGo) {
	$("#whoGo").remove();
	this.send('rps', {
		rps: whoGo,
		chooseTurnOrder: true
	});
};
Game.prototype.startSiding = function() {
	this.turn = 0;
	this.phase = "dp";
	var readyness = this.isSideDecking.substr(0, 2);
	this.isSideDecking = this.isSideDecking.substr(2);
	for (var key in readyness) {
		var playerId = Number(key) + 1;
		var player = this["p" + playerId];
		var status;
		if (readyness[key] === "0") {
			status = "Side Decking";
			player.ready = false;
		} else {
			status = "Ready!";
			player.ready = true;
		}
		$("#" + player.who() + "status").html(status);
	}
	if (this.spectating || this.you.ready) {
		return;
	}
	var virginDecks = this.isSideDecking;
	(function() {
		//parse virginDecks
		virginDecks = virginDecks.split('*');
		for (var i in virginDecks) {
			virginDecks[i] = virginDecks[i].split(',');
			var ray = virginDecks[i];
			for (var x in ray) {
				ray[x] = Number(ray[x]);
				if (!ray[x]) ray.splice(x, 1); //remove the blank
			}
		}
		virginDecks = {deck: virginDecks[0], extra: virginDecks[1], side: virginDecks[2]};
	})();
	this.virginDecks = virginDecks;
	var container = $('<div class="sidingContainer"></div>').appendTo('#game');
	var decks = ["deck", "extra", "side"];
	for (var i in decks) {
		var deckId = decks[i];
		var deck = virginDecks[deckId];
		container.append("<h2>" + deckId + "(" + deck.length + ")</h2>");
		var deckContainer = $('<div id="' + deckId + '" class="deckContainer"></div>').appendTo(container);
		for (var x in deck) {
			var id = deck[x];
			var img = $('<div></div>');
			$(cardImg(id, true)).attr("id", deckId + x).appendTo(img);
			deckContainer.append(img);
		}
	}
	var doneSiding = $('<button id="doneSiding" class="btn">Done Siding</button>').appendTo("#game");
	doneSiding.on("click", function() {
		var cards = $(".sidingContainer").find('img');
		var deck = {deck: [], extra: [], side: []};
		for (var i in cards) {
			if (isNaN(i)) continue;
			var el = $(cards[i]);
			var identifier = el.attr('id');
			var newList = el.closest('.deckContainer').attr('id');
			deck[newList].push(identifier);
		}
		app.game.send('doneSiding', {newDeck: deck});
		$("#youstatus").html("Ready!");
		$(".deckContainer").remove();
		$(this).remove();
	});
};
Game.prototype.addLog = function(msg) {
	$(".gameLogs").append('<div>' + msg + '</div>').scrollTop($(".gameLogs").prop("scrollHeight"));
};
Game.prototype.chat = function(username, msg) {
	var msg = ate.rooms.global.chatParse(username, msg, true);
	this.addLog(msg);
};
Game.prototype.raw = function(msg) {
	this.addLog(msg);
};
Game.prototype.processQueue = function() {
	if (this.isQueueProcessing) return;
	this.isQueueProcessing = true;
	this.nextQueue();
};
Game.prototype.nextQueue = function() {
	var self = this;
	if (app.replaying) {
		//if replaying, replay slower than actual game play animations
		var t = new Date() / 1;
		if (self.lastQueue) {
			if (t - this.lastQueue < 500) {
				return setTimeout("app.game.nextQueue()", 500 - (t - this.lastQueue));
			}
		}
		self.lastQueue = t;
	}
	if (!self.queue.length) {
		self.isQueueProcessing = false;
		return;
	}
	var currentQueue = self.queue[0];
	self.queue.splice(0, 1);
	var event = currentQueue[0];
	var data = currentQueue[1];
	switch (event) {
		default: alert("Oops!", "No case for event: '" + event + "'", "error");
		break;
		
		case 'reset':
			self.parseResetData(data);
			self.nextQueue();
			break;
		
		case 'counter':
			var player = self[data[1]];
			var type = data[2].charAt(0);
			var zone = Number(data[2].substr(1));
			var firstSlot = player.field[zone][0];
			if (!firstSlot.counter) firstSlot.counter = 0;
			if (type === "+") {
				firstSlot.counter++;
			} else {
				firstSlot.counter--;
				if (firstSlot.counter === 0) delete firstSlot.counter;
			}
			this.update({list: "field", zone: zone, who: player.who()});
			self.nextQueue();
			break;
		
		case 'token':
			var player = self[data[1]];
			var zone = Number(data[2]);
			var cardId = Number(data[3]);
			player.field[zone].push({
				id: cardId,
				pos: 1
			});
			self.update({list: "field", who: player.who(), zone: zone});
			self.nextQueue();
			break;
		
		case 'attack':
			var player = self[data[1]];
			var sourceZone = Number(data[2]);
			var targetZone = Number(data[3]);
			if (!data[3]) targetZone = 7; //it's the farthest zone in the middle (attack directly)
			var sword = cardImg(-3);
			if (player.who() === "opp") $(sword).addClass("v");
			var callback = function() {self.nextQueue();};
			sword.copy($("#" + player.who() + sourceZone).find('img')).toBody().moveTo($("#" + player.opp().who() + targetZone), 1000, function() {
				if (data[3]) {
					$(".targetedCard").removeClass("targetedCard");
					$("#" + player.opp().who() + data[3]).find('img').addClass('targetedCard');
				}
				$(sword).fadeOut(250, function() {
					$(sword).remove();
				});
				callback();
			});
			break;
		
		case 'targetCard':
			var targetedPlayer = self[data[1]];
			var list = data[2];
			var slot = data[3];
			var el = $($("#" + targetedPlayer.who() + list + " img")[slot]);
			$(".targetedCard").removeClass("targetedCard");
			el.addClass('targetedCard');
			self.nextQueue();
			break;
		
		case 'reveal':
			var player = self[data[1]];
			var slot = Number(data[2]);
			var cardId = Number(data[3]);
			if (player.who() === "opp") {
				player.hand[slot] = cardId;
				self.update({list: "hand", who: player.who()});
			}
			$(".cardDescription").html(self.cardInfo(cardId));
			self.addLog(player.name + ' revealed a <b id="' + cardId + '" class="cardName">' + cardInfo(cardId).name + '</b> in their hand.');
			self.nextQueue();
			break;
		
		case 'shuffle':
		case 'rollDice':
		case 'coinFlip':
			//add a log and show an animation (none of these animations are done lol)
			var player = self[data[1]];
			var msg = "";
			if (event === "shuffle") msg = player.name + ' shuffled their deck.';
			if (event === "rollDice") msg = player.name + " rolled a " + data[2] + ".";
			if (event === "coinFlip") msg = player.name + "'s coin flip landed on " + ((data[2] === "0") ? 'heads' : 'tails') + '.';
			self.addLog(msg);
			self.nextQueue();
			break;
		
		case 'revokeDraw':
			var player = self[data[1]];
			$("#draw").html("Offer Draw");
			self.addLog(player.name + " has revoked their draw offer.");
			self.nextQueue();
			break;
		
		case 'offerDraw':
			var player = self[data[1]];
			if (player.who() === "you") {
				$("#draw").html("Revoke Draw");
			} else {
				$("#draw").html("Accept Draw");
			}
			self.addLog(player.name + " has made a draw offer.");
			self.nextQueue();
			break;
		
		case 'win':
			var winner = data[1];
			var loser = data[2];
			var score = data[3];
			if (winner === 'tie') {
				self.addLog('Both players agreed to a draw offer.');
			} else {
				self.addLog('<b>' + self[loser].name + ' admitted defeat.</b>');
				self.addLog(self[winner].name + ' ' + score.split('-')[0] + ' wins.');
				self.addLog(self[loser].name + ' ' + score.split('-')[1] + ' wins.');
			}
			$("#draw").html("Offer Draw");
			$("#draw, #admit").prop("disabled", true);
			self.nextQueue();
			break;
		
		case 'nextRound':
			self.round++;
			self.addLog("<h4>Time for round " + self.round + "!<br />Side decking started.</h4>");
			this.isSideDecking = data[1];
			self.startSiding();
			self.nextQueue();
			break;
		
		case 'changePoints':
			var player = this[data[1]];
			player.changePoints(Number(data[2]), function() {
				self.nextQueue();
			});
			break;
		
		case 'j':
		case 'l':
			if (event === "l") {
				self.addLog(data[1] + " left.");
			}
			if (event === "j") {
				self.addLog(data[1] + " joined.");
			}
			self.nextQueue();
			break;
		
		case 'raw':
		case 'chat':
			var name = data[1];
			data.splice(0, 2);
			var msg = data.join('|');
			self[event](name, msg);
			self.nextQueue();
			break;
		
		case 'status':
			var player = this[data[1]];
			var status = data[2];
			$("#" + player.who() + 'status').html(status);
			self.nextQueue();
			break;
		
		case 'view':
			var viewer = this[data[1]];
			var viewee = this[data[2]];
			var list = data[3];
			var cards = data[4];
			if (cards) cards = allToNum(cards.split(','));
			viewer.viewList(viewee, list, cards);
			self.nextQueue();
			break;
		
		case 'mill':
			var player = this[data[1]];
			var list = data[2];
			var cardId = Number(data[3]);
			player.mill(cardId, function() {
				self.nextQueue();
			}, list);
			break;
		
		case 'flip':
			var player = this[data[1]];
			var zone = Number(data[2]);
			var transform = {
				0: 2,
				2: 0,
				1: 3,
				3: 1
			};
			var card = player.field[zone][0];
			card.pos = transform[card.pos];
			if (data[3]) card.id = Number(data[3]);
			if ((card.pos === 2 || card.pos === 3) && player.who() === "opp") card.id = -1;
			this.update({list: "field", zone: zone, who: player.who()});
			this.nextQueue();
			break;
		
		case 'rotate':
			var player = this[data[1]];
			var zone = Number(data[2]);
			var transform = {
				0: 1,
				1: 0,
				2: 3,
				3: 2
			};
			var card = player.field[zone][0];
			card.pos = transform[card.pos];
			this.update({list: "field", zone: zone, who: player.who()});
			this.nextQueue();
			break;
		
		case 'phase':
			this.phase = data[1];
			this.updatePhases();
			this.nextQueue();
			break;
		
		case 'nextTurn':
			this.phase = "dp";
			this.turn++;
			this.addLog('<h2>Turn ' + this.turn + '</h2>');
			if (this.turn === 1 || data[1]) {
				//initial turn player
				this.turnPlayer = this[data[1]];
				this.addLog(this.turnPlayer.name + ' is going first.');
			} else this.turnPlayer = this.turnPlayer.opp();
			this.updatePhases();
			this.nextQueue();
			break;
		
		case 'rps':
			this.rpsReceive(data[1]);
			this.nextQueue();
			break;
		
		case 'move':
			var perspective = data[1];
			var src = data[2].split(',');
			var tar = data[3].split(',');
			var cardId = Number(data[4]);
			var source = {
				perspective: perspective,
				who: src[0],
				list: src[1],
				slot: Number(src[2]),
				zone: Number(src[3]),
				pos: Number(src[4])
			};
			var target = {
				who: tar[0],
				list: tar[1],
				slot: Number(tar[2]),
				zone: Number(tar[3]),
				pos: Number(tar[4])
			};
			var sourcePlayer = this[perspective][source.who]();
			if (cardId) {
				var list = sourcePlayer[source.list];
				if (source.list === "field") {
					list[source.zone][source.slot].id = cardId;
				} else list[source.slot] = cardId;
			}
			this.move(cardId, source, target, function() {
				self.nextQueue();
			});
			break;

		case 'draw':
			var player = data[1];
			var cardId = Number(data[2]);
			var side = self[player];
			side.draw(Number(cardId), function() {
				self.nextQueue();
			});
			break;
	}
};
Game.prototype.send = function(event, data) {
	if (typeof data !== "object") data = {data: data};
	data.event2 = event;
	app.socket.emit('game', data);
};
Game.prototype.chatSend = function(msg) {
	this.send('chat', {
		msg: msg
	});
};
Game.prototype.drop = function(drag) {
	var self = this;
	function info(el, noparent) {
		var sideDecking;
		var info = {};
		var parent = el.parent();
		var img = el[0];
		if (noparent) parent = el;
		var id = parent.attr('id');
		if (el.parent().hasClass('deckContainer') || el.parent().parent().hasClass('deckContainer')) {
			//side decking
			sideDecking = true;
			parent = el.parent();
			if (!parent.hasClass('deckContainer')) {
				parent = parent.parent();
			} else img = el.find('img')[0];
			id = parent.attr('id');
			info.sideDecking = true;
		}
		//determine who
		info.who = "you";
		if (id && id.split('opp').length - 1 > 0) info.who = "opp";
		if (id) id = id.replace('you', '').replace('opp', '');
		//determine array type & zone
		if (isNaN(id)) {
			info.list = id;
		} else {
			info.list = 'field';
			info.zone = Number(id);
		}
		if (parent.hasClass("cardList")) {
			info.who = self.cardList.targetPlayer.who();
			info.list = self.cardList.list;
		}
		//determine slot
		if (noparent && !sideDecking) return info;
		var imgs = parent.find('img');
		for (var slot in imgs) {
			if (isNaN(slot)) continue;
			if (imgs[slot] === img) {
				info.slot = Number(slot);
				break;
			}
		}
		return info;
	}
	var source = info($(drag.source));
	var target = info($(drag.target), true);
	
	if (source.sideDecking) {
		var clone = $(drag.source).parent().clone();
		var selector = ".sidingContainer #" + target.list;
		if (target.slot) {
			$($(selector + " img")[target.slot]).parent().before(clone);
		} else {
			$(selector).append(clone);
		}
		$(drag.source).parent().remove();
		return;
	}
	
	var moveZone = false;
	if (source.list === target.list) {
		if (source.list === "field") {
			if (source.zone === target.zone && target.who === "you") return;
			if (target.who === "opp") {
				//giving control of cards in zone
				if (this.opp.field[target.zone].length) return; //there's already a card on this zone
			}
			//moving zones
			moveZone = true;
		} else return;
	}
	if (moveZone) {
		//moving zones
		this.send('move', {
			source: source,
			target: target
		});
	} else {
		//moving lists
		if (target.who === "opp" && target.list === "field") {
			if (this.opp.field[target.zone].length) return; //there's already a card on this zone
		}
		if (source.who !== "opp" && target.who === "you" && target.list === "field") {
			if (this.you.field[target.zone].length) {
				//you're trying to overlay a card
				target.pos = 0;
			} else return this.prompt(source, target);
		}
		if (target.list === "deck") return this.prompt(source, target);
		//moving lists
		this.send('move', {
			source: source,
			target: target
		});
	}
};
Game.prototype.prompts = {};
Game.prototype.prompt = function(source, target) {
	var id = new Date() / 1;
	$('<div id="promptOpaqueness' + id + '" class="promptOpaqueness"></div').appendTo("body");
	var prompt = $('<div id="prompt' + id + '" class="prompt abs"></div>').appendTo("body");
	if (target.list === "deck") {
		//top or bottom of deck
		prompt.append('<h2>Top or Bottom...</h2>');
		prompt.append($(cardImg(-2, true)).attr('id', 0).height(100));
		prompt.append($(cardImg(-2, true)).attr('id', 1).height(100));
	}
	if (target.list === "field") {
		var zoneEl = $("#" + this[target.who].who() + target.zone);
		prompt.css({
			"margin-left": "auto",
			"margin-top": "auto",
			top: (zoneEl.offset().top + (zoneEl.height() / 2) - prompt.height()) + "px",
			left: (zoneEl.offset().left + (zoneEl.width() / 2) - (prompt.width() / 2)) + "px"
		});
		
		var cardId = this[source.who][source.list];
		if (source.list === "field") {
			cardId = cardId[source.zone][source.slot].id;
		} else cardId = cardId[source.slot];
		var spellTrap = false;
		var positions = [3, 0, 1];
		if (target.zone > 4) spellTrap = true;
		if (spellTrap) positions = [0, 2];
		var positionCount = positions.length;
		for (var i = 0; i < positionCount; i++) {
			var position = positions[i];
			if (position === 0) prompt.append($(cardImg(cardId, true)).attr("id", position)); //faceup
			if (position === 1) prompt.append($(cardImg(cardId, true)).attr("id", position).addClass("defense")); //faceupdefense
			if (position === 2) prompt.append($(cardImg(-1, true)).attr("id", position)); //facedown
			if (position === 3) prompt.append($(cardImg(-1, true)).attr("id", position).addClass("defense")); //facedowndefense
		}
	}
	this.prompts[id] = [source, target];
};
Game.prototype.promptRemove = function(id) {
	delete this.prompts[id];
	$("#prompt" + id).remove();
	$("#promptOpaqueness" + id).remove();
};
Game.prototype.promptRespond = function(id, el) {
	var prompt = this.prompts[id];
	var source = prompt[0];
	var target = prompt[1];
	this.promptRemove(id);
	target.pos = Number(el.id);
	this.send('move', {
		source: source,
		target: target
	});
};
Game.prototype.contextHover = function(el) {
	var el = $(el);
	var oldList = "";
	var isHand = (el.parent().attr('id') === "youhand");
	if (this.context) {
		oldList = this.context.options.join('');
		if (isHand || (el.attr('id') !== this.context.el.attr('id'))) {
			this.removeContext();
		}
	}
	var id = el.attr('id');
	if (id) id = id.replace('you', '');
	var options = [];
	if (id === "deck") {
		if (el.text() === "0") return;
		options.push("Shuffle", "View", "Mill", "RFG", "RFG Set", "Show");
	} else if (id === "extra") {
		if (el.text() === "0") return;
		options.push("Show");
	} else if (!id) {
		//hand
		$("#youhand").addClass("highestCardZindex");
		options.push("Reveal", "Show Hand");
	} else {
		if (isNaN(id) || !el.html()) return;
		var zone = Number(id);
		if (app.game.phase === "bp" && zone >= 0 && zone <= 4) options.push("Attack");
		options.push("Rotate", "Flip");
	}
	if (!isHand && oldList && oldList === options.join('')) return;
	var contextMenu = $('<div class="contextMenu"></div>');
	var optionsLen = options.length;
	for (var i = optionsLen - 1; i > -1; i--) contextMenu.append('<div>' + options[i] + '</div>');
	contextMenu.css({
		left: el.offset().left + 'px',
		bottom: ($("body").height() - el.offset().top) + "px",
		width: el.width() + "px"
	}).appendTo('body');
	var changes = {height: contextMenu.height() + "px"};
	var callback = undefined;
	if (!id) {
		//animate the context menu to move up with the card animation
		changes.bottom = ($("body").height() - $("#youhand").offset().top) + "px";
		callback = function() {
			if (!id) el.addClass("risenCard");
		};
	}
	contextMenu.css("height", "0px").animate(changes, 250, callback);
	this.context = {
		el: el,
		options: options
	};
};
Game.prototype.removeContext = function() {
	if (!this.context) return;
	delete this.context;
	$(".contextMenu").finish().remove();
	$(".risenCard").removeClass("risenCard");
	$(".highestCardZindex").removeClass("highestCardZindex");
};
Game.prototype.contextClickOption = function(option) {
	var el = this.context.el;
	var info = {};
	var id = el.attr('id');
	id = id || '';
	id = id.replace('you', '').replace('opp', '');
	
	if (el.parent().attr('id') === "youhand") {
		info.list = "hand";
		var imgs = el.parent().find('img');
		for (var slot in imgs) {
			if (isNaN(slot)) continue;
			if (imgs[slot] === el[0]) {
				info.slot = Number(slot);
				break;
			}
		}
	} else if (isNaN(id)) {
		info.list = id;
	} else {
		info.list = "field";
		info.zone = Number(id);
	}
	info.option = option;
	if (this.context.who) info.who = this.context.who;
	this.removeContext();
	if (info.option === "Attack") {
		//check if there are any targets
		var zones = this.opp.field;
		var targets = 0;
		var firstTargetZone = 'direct';
		for (var i = 0; i < 13; i++) {
			if (i >= 0 && i <= 4 && zones[i].length) {
				targets++;
				if (targets === 1) firstTargetZone = i;
				$("#opp" + i).addClass("attackableZone");
			}
		}
		if (targets > 1) {
			this.findingAttackTarget = info;
			return;
		} else {
			info.target = firstTargetZone;
			$(".attackableZone").removeClass("attackableZone");
		}
	}
	this.send('contextMenu', info);
};
Game.prototype.foundAttackTarget = function(zone) {
	var info = this.findingAttackTarget;
	info.target = zone;
	this.send('contextMenu', info);
	this.cancelFindingAttackTarget();
};
Game.prototype.cancelFindingAttackTarget = function() {
	delete this.findingAttackTarget;
	$(".attackableZone").removeClass("attackableZone");
};
Game.prototype.cardInfo = function(id) {
	var card = cardInfo(id);
	var info = '<center style="margin-top: 10px;"><h3 style="text-decoration: underline;">' + card.name + '</h3>' + '<img style="float: left;margin: 5px;" width="33%" src="' + cardImg(id, true).src + '" />' + '</center>';
	if (card.race) {
		info += "<strong>Type:</strong> " + card.race + " / " + card.kind + "<br />";
	} else info += "<strong>Type:</strong> " + card.kind + "<br />";
	if (card.attribute) info += "<strong>Attribute:</strong> " + card.attribute + "<br />";
	if (card.atk) info += "<br /><strong>Atk/Def:</strong> " + card.atk + " / " + card.def + "<br />";
	if (card.level) info += "<strong>Level:</strong> " + card.level + "<br />";
	info += "<br />" + card.description;
	return info;
};
Game.prototype.move = function(cardId, source, target, callback) {
	//get sourceImg before we possibly delete the cardId from the array
	source.anim = true;
	var sourceImg = this[source.perspective][source.who]().cardImg(source);
	delete source.anim;	
	
	var self = this;
	var perspective = source.perspective;
	var sourcePlayer = this[perspective][source.who]();
	var targetPlayer = this[perspective][target.who]();
	source.who = sourcePlayer.who();
	target.who = targetPlayer.who();

	//edit the arrays
	var moveZone = false;
	if (source.list === target.list) {
		if (source.list === "field") {
			if (source.zone === target.zone && target.who === source.who) return;
			moveZone = true;
		} else return;
	}
	var revealId = false;
	if (moveZone) {
		if (target.who === source.who) {
			//card moving zones
			var cardCache = sourcePlayer.field[source.zone][source.slot];
			sourcePlayer.field[source.zone].splice(source.slot, 1);
			targetPlayer.field[target.zone].push(cardCache);
		} else {
			//changing card control - in this case we move the entire zone instead of just a single card in case we're changing control of cards with attached cards
			var zoneCache = sourcePlayer.field[source.zone];
			if (targetPlayer.field[target.zone].length) return; //there's already something in the zone
			sourcePlayer.field[source.zone] = [];
			var cardCount = zoneCache.length;
			for (var i = 0; i < cardCount; i++) targetPlayer.field[target.zone].push(zoneCache[i]);
			revealId = true;
		}
	} else {
		//moving lists
		if (target.who !== source.who) {
			//changing card control
			if (target.list === "field") {
				var cardCache = sourcePlayer[source.list][source.slot];
				if (targetPlayer.field[target.zone].length) return; //there's already something in the zone
				sourcePlayer[source.list].splice(source.slot, 1);
				targetPlayer.field[target.zone].push({
					id: cardCache,
					pos: 0
				});
				revealId = true;
			} else {
				var cardCache = sourcePlayer[source.list][source.slot];
				var pushFunk = "push";
				if (target.list === "deck" && (!target.pos || target.pos === 0)) pushFunk = "unshift";
				sourcePlayer[source.list].splice(source.slot, 1);
				targetPlayer[target.list][pushFunk](cardCache);
				revealId = true;
			}
		} else {
			//these are cases where the source === target players
			var cardCache = sourcePlayer[source.list][source.slot];
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
			revealId = true;
			if (target.pos === 2 || target.pos === 3) revealId = false;
		}
	}

	//animation
	if (source.list === "grave" || source.list === "banished" || source.list === "extra" || source.list === "deck") this.updateListCounts();
	var start = $($("#" + sourcePlayer.who() + source.list + " img")[source.slot]);
	if (source.list === "field") {
		var newStart = $($("#" + sourcePlayer.who() + source.zone + " img")[source.slot]);
		if (newStart.length) start = newStart;
	}
	if (!start.length) start = $("#" + sourcePlayer.who() + source.list);
	var moveTo = $("#" + targetPlayer.who() + target.list);
	if (target.list === "field") moveTo = $("#" + targetPlayer.who() + target.zone);
	if (target.list === "hand" && self[target.who].hand.length > 1) moveTo = $("#" + targetPlayer.who() + "hand img").last(); //move to last img in hand

	if (cardId) {
		var img = cardImg(cardId);
	} else var img = sourceImg;
	img.copy(start, true).toBody();
	if (start.is("img")) start.hide();
	if (sourcePlayer.who() === "opp") $(img).addClass("v");
	img.moveTo(moveTo, 500, function() {
		$(img).remove();
		if (start.is("img")) start.remove();
		self.update(target);
		self.update(source);
		if (callback) callback();
	});
};
