var app = {};

// emoticons - demfeels
var emoticons = ["batming","blu","china","coo","creep","cry","dad1","dad2","dafuq","datass","dazza1","dd","deal","dealw","disgust","drow","duckwat","duclol","Dx","eleming","evild","excite","falone","feel","feelsal","feelsbd","feelsbeard","feelsbn","feelsbr","feelsbu","feelscanada","feelsce","feelscommy","feelscr","feelscute","feelsdd","feelsde","feelsdr","feelsduke","feelseye","feelsgd","feelsgn","feelsgt","feelshitler","feelshp","feelshr","feelsht","feelsjew","feelsmario","feelsmd","feelsmoke","feelsms","feelsmug","feelsnv","feelsok","feelsold","feelspink","feelsq","feelsrs","feelssc","feelsscr","feelssp","feelsusa","feelsvp","feelswg","feelswp","feelsws","feelsww","feelszb","fliptbl","foreveralone","fuu","fuu2","fuumar","fyeah","g","goatse","gtfo","hellyeah","hface","hipnig","hmm","how","how3","how4","kid1","ling","lolnig","man","maybe","megusta","ming","mit","mit3","mit4","mog","nface","nface2","nggawat","nggwat","nicetit","nigcook","nigcry","nigglet","nighuh","nigig","niglad","nigleaf","niglol","nigmar","nigmonk","nignig","nignod","nigoof","nigrin","nigwho","nigya","ning","no","nomegusta","notbad","notsure","ohgod","okay","okay2","omd","omg","oshit","pedo","pface","pff","pirate","pirate2","santa","santrl","seewat","serious","sir","smellsgd","smugob","srs","srsno","taylor","ting","trldrum","trlfing","trollface","w","wat","who","win1","wtf","wtf2","wut","xa","XD","xd2","xe","yay","yds","yeayou","yes","yface","yuno","2cute","ahuevo","aing","alakno","allfeel","awd","babed","fukya",/* these are all the crappy new emotes pixieworld has added */"fakesloth","banana","cottonball","cottoncandy","craydada","daavey2","dada","dada1","davey","davey1","davey3","david","dogie","garde","garde1","garde2","garde3","garde4","lolli","mvlution","mvlution1","nyan","ohyeah","osha","pika","pika2","pix","pixie","pixie1","stevo","swalot","sylveon","sylveon1","sylveon2","sylveon3","sylveon4","sylveon5","sylveon6","troll","windy","windy1","windy2","windy3","windy4","pyon","cortex","feelspika"];
var emoteURL = {};
var patterns = [];
var metachars = /[[\]{}()*+?.\\|^$\-,&#\s]/g;

for (var i = 0, len = emoticons.length; i < len; i++) {
	patterns.push('(:' + emoticons[i].replace(metachars, '\\$&') + ':)');
	emoteURL[emoticons[i]] = 'https://raw.github.com/stevoduhhero/datfeels/master/' + emoticons[i] + '.gif';
}

var patternRegex = new RegExp(patterns.join('|'), 'g');

var ate = {
	init: function() {
		app = this;
		app.parseURL = function() {
			var path = window.location.pathname;
			if (path.split('replay-').length - 1 > 0) {
				var replayId = path.substr(("/replay-").length);
				this.replaying = replayId;
				this.socket.emit('replay', {id: replayId});
			}
			if (path.split('duel-').length - 1 > 0) {
				var duelId = path.substr(("/duel-").length);
				this.socket.emit('watch', {id: duelId});
				newurl("/");
			}
		};
		app.init = function() {
			this.decks = [];
			this.deck = [];
			this.events = {
				"duels": function(data) {
					data.splice(0, 1);
					var duels = new Array(),
						insides = '';
					for (var i in data) {
						if (data == "") continue;
						var d = data[i].split(',');
						duels.push(d);
						insides += '<a href="/duel-' + d[0] + '" class="gameDiv">';
							insides += '[' + d[1] + ']';
							insides += '<h3>' + escapeHTML(d[2]) + ' VS. ' + escapeHTML(d[3]) + '</h3>';
						insides += '</a>';
					}
					insides = '<br /><hr /><h2>' + duels.length + ' duels.</h2><input class="btn" type="button" value="Refresh Duels" onclick="app.socket.emit(\'duels\');" />' + insides;
					$("#duels").html(insides);
				},
				"decks": function(data) {
					data.splice(0, 1);
					var decks = data;//the break between deck names should be "|" so it should already be an array
					app.decks = decks;
				},
				"deckString": function(data) {
					var id = data[1];
					data.splice(0, 2);
					var deckString = data.join('|');
					if (isNaN(id)) {
						alert("Bad ID", "The id '" + id + "' is invalid. Maybe create a function that gets the id based on this deck name.", "error");
					}
					app.deck[id] = deckString;
				},
				"err": function(data) {
					app.prompt({
						type: "error",
						err: data[1]
					});
				},
				"search": function(data) {
					if (Number(data[1])) {
						//finding
						$("#findDuel").html("Cancel Find Duel");
					} else {
						//canceling
						$("#findDuel").html("Find Duel");
					}
				},
				"g": function(data) {
					//all events that have to do with the game
					data.splice(0, 1);
					switch (data[0]) {
						default:
						//all the animations are pushed to queue
						app.game.queue.push([data[0], data]);
						app.game.processQueue();
						break;

						case 'start':
							var game = app.game = new Game(data);
							game.parseStartData(game.unparsedData);
							delete game.unparsedData;
							break;
					}
				},
				"replay": function(data) {
					data.splice(0, 1);
					var events = data.join('|').split('\n');
					for (var i in events) {
						var event = "g|" + events[i];
						event = event.split('|');
						this.g(event);
					}
				},
				"newreplay": function(data) {
					var id = data[1];
					var opponent = data[2];
					ate.focusedRoom.addLog('<a href="/replay-' + id + '" target="_BLANK">Click here to see a replay of your duel against <b>' + opponent + '</b></a>');
				},
				"chall": function(data) {
					data.splice(0, 1);
					for (var i in data) {
						var chall = data[i].split(',');
						app.addChallenge(chall[0], chall[1], chall[2]);
					}
				},
				"reject": function(data) {
					app.removeChallenge(data[1]);
				},
				"ladder": function(data) {
					$("#leaderboard .ladder").html(data[1]);
				}
			};
			$("#builder").attr('src', './builder.html');
		};
		app.challengePrompt = function(opponent) {
			this.addChallenge(this.userid, toId(opponent.substr(1)));
		};
		app.addChallenge = function(sender, receiver, tier) {
			var sendOrAcceptChallenge = function(self, type) {
				var form = $(self).parent();
				var opponent = form.find('#opponent').text();
				var deck = form.find('#deck').val();
				var tier = form.find('#tier').val();
				console.log(form)
				if (!deck && toId(tier) !== "random") return alert('Oops!', 'No deck.', 'error');
				var obj = {
					opponent: opponent,
					tier: tier,
					deck: deck
				};
				if (app.deck[deck]) obj.deckString = app.deck[deck];
				app.socket.emit(((type === 'send') ? 'challenge' : 'accept'), obj);
			};
			var otherUser = sender;
			var fromTo = 'from';
			if (sender === ate.userid) otherUser = receiver;
			if (sender === ate.userid) fromTo = 'to';
			$('#chall' + otherUser).remove();
			var challenge = $('<div id="chall' + otherUser + '" class="challenge"></div>');
			challenge.append('<h4>Challenge ' + fromTo + ' <span id="opponent">' + otherUser + '</span></h4>');
			challenge.append('<hr />');
			var tierChoices = '';
			for (var i in Formats) {
				tierChoices += '<option>' + Formats[i] + '</option>';
			}
			var tiers = $('<div><label>Type:</label> <select id="tier">' + tierChoices + '</select></div>');
			if (tier) {
				tiers.find('select').val(tier).prop("disabled", true);
			}
			challenge.append(tiers);
			if (!tier || fromTo === 'from') {
				//only add deck selection if this is a new challenge prompt OR it's a challenge you received
				var decks = $('<div><label>Deck:</label> <select id="deck"></select></div>');
				var deckCount = app.decks.length;
				var buff = '';
				for (var i = 0; i < deckCount; i++) {
					buff += '<option>' + app.decks[i] + '</option>';
				}
				decks.find('select').html(buff);
				challenge.append(decks);
			}
			if (!tier) {
				//if (!tier) this is a new challenge prompt
				var send = $('<button class="btn">Send</button>');
				var $delete = $('<button class="btn">Delete</button>');
				send.on('click', function() {
					sendOrAcceptChallenge(this, 'send');
				});
				$delete.on('click', function() {
					var form = $(this).parent();
					var opponent = form.find('#opponent').text();
					app.removeChallenge(opponent);
				});
				challenge.append(send).append(' ').append($delete);
			} else if (fromTo === 'to') {
				var cancel = $('<button class="btn">Cancel Challenge</button>');
				cancel.on('click', function() {
					var form = $(this).parent();
					var opponent = form.find('#opponent').text();
					app.socket.emit('cancelchallenge', {
						opponent: opponent
					});
				});
				challenge.append(cancel);
			} else if (fromTo === 'from') {
				var accept = $('<button class="btn">Accept</button>');
				var reject = $('<button class="btn">Reject</button>');
				accept.on('click', function() {
					sendOrAcceptChallenge(this, 'accept');
				});
				reject.on('click', function() {
					var form = $(this).parent();
					var opponent = form.find('#opponent').text();
					app.removeChallenge(opponent);
					app.socket.emit('reject', {
						opponent: opponent
					});
				});
				challenge.append(accept).append(' ').append(reject);
			}
			challenge.appendTo('#challenges');
		};
		app.removeChallenge = function(otherUser) {
			$('#chall' + otherUser).animate({
				height: '0px'
			}, 500, function() {
				$("#chall" + otherUser).remove();
			});
		};
		app.mode = function(type) {
			$('.newMode').remove();
			var t;
			function newModeButton(id, mode) {
				$(id).append('<div class="newMode" onclick="$(this).remove();app.mode(\'' + mode + '\');"></div>');
			}
			if (type === "game") {
				$("body").addClass("bodyAnimating");
				$("#game").show();
				$("#homeScreen").css({
					position: 'absolute',
					'z-index': 1
				}).animate({
					left: '93%'
				}, t, function() {
					app.resize();
				});
				$("#game").animate({
					left: "0%"
				}, t);
				newModeButton("#homeScreen", "home");
				if (!helpers.isMobile()) $('.gameInput').focus();
			} else if (type === "home") {
				$("#homeScreen").css({
					position: 'absolute',
					'z-index': 10000
				}).animate({
					left: '7%'
				}, t);
				$("#game").animate({
					left: "-93%"
				}, t, function() {
					app.resize();
				});
				newModeButton("#game", "game");
				if (!helpers.isMobile()) $('.message').focus();
			} else if (type === "initial") {
				$(".newMode").remove();
				$("#homeScreen").css({
					position: 'absolute',
					'z-index': 10000
				}).animate({
					left: '7%'
				}, t, function() {
					$("#homeScreen").css({
						position: 'initial',
						left: '0%'
					});
					$("#game").hide();
					app.resize();
					$("body").removeClass("bodyAnimating");
				});
				$("#game").animate({
					left: "-100%"
				}, t);
				if (!helpers.isMobile()) $('.message').focus();
			}
		};
		
		inputFocus = undefined;
		this.resize();
		this.updateHeader();
		this.domEvents();
		var globalRoom = this.createRoom("Global");
		globalRoom.focusRoom();
		if (!helpers.isMobile()) $('.message').focus();
		
		ate.initial = {
			width: $("body").width(),
			height: $("body").height()
		};
		
		var t = new Date() / 1;
		var refreshLatency = 2.5 * 1000;
		var difference = t - Number(cookie("lastVisit"));
		if (difference < refreshLatency) {
			/* https://github.com/Automattic/engine.io/issues/257 */
			//hack to prevent refresh while on polling transport
			//usually if you refresh too fast the sockets won't disconnect and'll bug everything out .-.
			var self = this;
			setTimeout(function() {
				self.socket = new Socket();
			}, refreshLatency - difference);
		} else this.socket = new Socket();
		cookie("lastVisit", t);
		
		app.init();
	},
	pms: {},
	focusedPM: undefined,
	focusPM: function(pm) {
		if (!helpers.isMobile() && !inputFocus) $('.pmmessage').focus();
		if (this.focusedPM === pm) {
			return;
		}
		this.focusedPM = pm;
		$('.focusedPM').removeClass('focusedPM');
		pm.$pmer.removeClass('newPM').addClass('focusedPM');
		$('.pmlogs').empty();
		for (var i in pm.logs) {
			$('.pmlogs').append('<div>' + pm.logs[i] + '</div>');
		}
		$('.pmlogs').scrollTop($('.pmlogs').prop("scrollHeight"));
	},
	closePM: function(pm) {
		pm.$pmer.hide().removeClass('pmer');
		if (!$('.pmer').length) {
			//no other pm to focus on
			return $('.pms').hide();
		}
		if (this.focusedPM !== pm) return;
		//focus on different pm
		$('.pmer').click();
	},
	addPM: function(person, sender, msg) {
		msg = this.rooms.global.chatParse(sender, msg, true);
		this.pms[toId(person)].logs.push(msg);
		if (!this.focusedPM || this.focusedPM !== this.pms[toId(person)]) return;
		if ($('.pmlogs').scrollTop() + 60 >= $('.pmlogs').prop("scrollHeight") - $('.pmlogs').height()) {
			autoscroll = true;
		}
		$('.pmlogs').append('<div>' + msg + '</div>');
		if (autoscroll) {
			$('.pmlogs').scrollTop($('.pmlogs').prop("scrollHeight"));
		}
	},
	newPM: function(sender, receiver, msg) {
		if (this.userid === toId(sender)) {
			var you = sender;
			var person = receiver;
		} else {
			var you = receiver;
			var person = sender;
		}
		var personId = toId(person);
		var hasPM = this.pms[personId];
		if (!hasPM) {
			//first pm to person
			var pmer = $('<div onclick="ate.focusPM(ate.pms[\'' + personId + '\']);" class="pmer newPM">PM to ' + person + '<span onmousedown="ate.closePM(ate.pms[\'' + personId + '\']);">x</span></div>');
			pmer.prependTo('.pmers');
			hasPM = this.pms[personId] = {
				logs: [],
				$pmer: pmer,
				userid: personId
			};
		} else {
			var pmer = hasPM.$pmer;
			if (this.focusedPM !== hasPM) pmer.addClass('newPM');
		}
		if (!pmer.hasClass('pmer')) pmer.addClass('pmer');
		pmer.show();
		//add log
		if (msg) this.addPM(person, sender, msg);
		if ($('.pmer').length === 1) {
			//first pm from anyone
			//open pm and focus on it
			this.focusPM(hasPM);
		}
		$('.pms').show();
	},
	rooms: new Object(),
	focusedRoom: undefined,
	createRoom: function(title) {
		function Room(title) {
			this.title = title;
			this.id = toId(title);
			this.logs = [];
			this.sent = [];
			this.scrollSent = 0;
			this.message = '';
			this.users = {};
		}
		Room.prototype.deinit = function() {
			if (ate.focusedRoom === this) {
				//focus another room
				var roomCount = Object.keys(ate.rooms).length - 1; //-1 bcos of global room doesnt count
				if (roomCount === 1) {
					//this is the only room left so focus global room
					ate.rooms.global.focusRoom();
				} else {
					//click on closest room button
					var nextButton = this.$button.next();
					if (nextButton.text() !== "+") { //dont be the add room button
						nextButton.click();
					} else this.$button.prev().click();
				}
			}
			if (this.$button) this.$button.remove();
			delete ate.rooms[this];
		};
		Room.prototype.focusRoom = function() {
			ate.focusedRoom = this;
			this.updateUsers();
			$(".logs").empty();
			for (var i = 0; i < this.logs.length; i++) {
				var msg = this.logs[i];
				if (msg.substr(0, 4) === "jls|") {
					this.parseJoinLeaves(msg);
					continue;
				}
				this.addLogDom(msg);
			}
			$(".logs").scrollTop($(".logs").prop("scrollHeight"));
			$(".message").val(this.message);
			
			if (this.$button) {
				$(".selectedRoom").removeClass("selectedRoom");
				$(this.$button).addClass("selectedRoom");
			}
		};
		Room.prototype.receive = function(log) {
			if (typeof log === 'string') log = log.split('\n');
			var autoscroll = false;
			if ($('.logs').scrollTop() + 60 >= $('.logs').prop("scrollHeight") - $('.chat').height()) {
				autoscroll = true;
			}
			var userlist = '';
			for (var i = 0; i < log.length; i++) {
				if (log[i].substr(0,6) === 'users|') {
					userlist = log[i];
				} else {
					this.addRow(log[i]);
				}
			}
			if (userlist) this.addRow(userlist);
			if (autoscroll) {
				$('.logs').scrollTop($('.logs').prop("scrollHeight"));
			}
			var $children = $('.logs').children();
			if ($children.length > 900) {
				$children.slice(0,100).remove();
			}
		};
		Room.prototype.addRow = function(line) {
			var name, name2, room, action, silent, oldid;
			if (line && typeof line === 'string') {
				var row = line.split('|');
				switch (row[0]) {
				case 'c':
					if (/[a-zA-Z0-9]/.test(row[1].charAt(0))) row[1] = ' '+row[1];
					this.addChat(row[1], row.slice(2).join('|'));
					break;
				case 'j':
					var username = row[1];
					this.users[toId(username.substr(1))] = username;
					this.updateUsers();
					this.addJoin(username);
					break;
				case 'l':
					var userid = row[1];
					var username = this.users[userid];
					delete this.users[userid];
					this.updateUsers();
					this.addLeave(username);
					break;
				case 'n':
					var identity = row[1];
					var olduserid = row[2];
					delete this.users[olduserid];
					this.users[toId(identity.substr(1))] = identity;
					this.updateUsers();
					break;
				case 'users':
					if (row[1] === "") return;
					var users = row[1].split(',');
					for (var i = 0; i < users.length; i++) {
						var username = users[i];
						var userid = toId(username.substr(1));
						this.users[userid] = username;
					}
					this.updateUsers();
					break;
				case 'raw':
					this.addLog(row.slice(1).join('|'));
					break;
				case '':
					this.addLog(escapeHTML(row.slice(1).join('|')));
					break;
				default:
					this.addLog('<code>' + escapeHTML(row.join('')) + '</code>');
					break;
				}
			}
		};
		Room.prototype.addChat = function(name, message, pm, deltatime) {
			this.addLog(this.chatParse(name, message, pm, deltatime));
		};
		Room.prototype.chatParse = function(name, message, pm, deltatime) {
			var addTime = '';
			if (!helpers.isMobile()) addTime = timestamp();

			// url and escaping html
			message = urlify(escapeHTML(message));

			// emoticons
			message = message.replace(patternRegex, function(match) {
				match = match.slice(1, -1);
				return '<img src="' + emoteURL[match] + '" title="' + match + '" />';
			});

			// __italics__
			message = message.replace(/\_\_([^< ](?:[^<]*?[^< ])?)\_\_(?![^<]*?<\/a)/g, '<i>$1</i>');

			// **bold**
			message = message.replace(/\*\*([^< ](?:[^<]*?[^< ])?)\*\*/g, '<b>$1</b>');

			return addTime + '<b><font color="' + hashColor(name.substr(1)) + '" class="username">' + escapeHTML(name) + ':</b></font> ' + message;
		},
		Room.prototype.joinLeaveTemplate = function() {
			var buff = $('<div><span class="jcont"><span class="jlog"></span> joined</span><span class="lcont"><span class="and"> AND </span><span class="llog"></span> left</span></div>');
			buff.find('.jcont').hide();
			buff.find('.lcont').hide();
			buff.find('.and').hide();
			return buff;
		};
		Room.prototype.addLeave = function(name) {this.addJoin(name, true);};
		Room.prototype.addJoin = function(name, leaving) {
			var e = 'j';
			if (leaving === true) e = 'l';
			var lastLogKey = this.logs.length - 1;
			var lastLog = this.logs[lastLogKey];
			var splint = (lastLog || '').split('|');
			var lastE = splint[0];
			var lastNames = splint[1];
			if (lastLog && lastE === 'jls') {
				lastNames = lastNames.split(',');
				for (var i = 0; i < lastNames.length; i++) {
					if (lastNames[i] === e + name) return; //already added a join/leave for user
				}
				this.logs[lastLogKey] += ',' + e + name;
				var lastLogDiv = $('.logs div').last();
				lastLogDiv.find('.' + e + 'cont').show();
				if (lastLogDiv.find('.jcont').css('display') !== 'none' && lastLogDiv.find('.lcont').css('display') !== 'none') {
					lastLogDiv.find('.and').show();
				}
				var log = lastLogDiv.find('.' + e + 'log');
				var comma = '';
				if (log.text()) comma = ', '; //if empty add comma
				log.append(comma + name);
			} else {
				this.logs.push('jls|' + e + name);
				var buff = this.joinLeaveTemplate();
				buff.find('.' + e + 'cont').show(); //only show the one just appended to
				buff.find('.' + e + 'log').append(name);
				this.addLogDom(buff);
			}
		};
		Room.prototype.parseJoinLeaves = function(str) {
			var namesStr = str.substr(4);
			var names = namesStr.split(',');
			var buff = this.joinLeaveTemplate();
			for (var i = 0; i < names.length; i++) {
				var e = names[i].substr(0, 1);
				var name = names[i].substr(1);
				buff.find('.' + e + 'cont').show();
				var log = buff.find('.' + e + 'log');
				var comma = '';
				if (log.text()) comma = ', '; //if empty add comma
				log.append(comma + name);
			}
			if (buff.find('.jcont').css('display') !== 'none' && buff.find('.lcont').css('display') !== 'none') {
				buff.find('.and').show();
			}
			this.addLogDom(buff);
		};
		Room.prototype.addLog = function(msg) {
			this.logs.push(msg);
			if (ate.focusedRoom !== this) return;
			this.addLogDom(msg);
		};
		Room.prototype.addLogDom = function(msg) {
			$('.logs').append($('<div></div>').append(msg));
		};
		Room.prototype.sortUsers = function() {
			function compare(a,b) {
				if (a < b) return -1;
				if (a > b) return 1;
				return 0;
			}
			var groupKeyOrder = {
				'-': 0,
				'#': 1,
				'*': 2,
				'+': 3,
				' ': 4
			};
			var groupCount = Object.keys(groupKeyOrder).length;
			var groups = [];
			for (var i = 0; i < groupCount; i++) groups.push([]);
			//put users in respective groups
			for (var i in this.users) {
				var identity = this.users[i];
				var groupKey = groupKeyOrder[identity.charAt(0)];
				groups[groupKey].push(identity);
			}
			//sort each group
			for (var i = 0; i < groupCount; i++) {
				var sortedGroup = groups[i].sort(compare);
				groups[i] = sortedGroup;
			}
			//turn all the groups into one big list
			var list = [];
			for (var i = 0; i < groupCount; i++) list = list.concat(groups[i]);
			
			this.alphabetizedUsers = list;
		};
		Room.prototype.updateUsers = function() {
			this.sortUsers();
			if (ate.focusedRoom !== this) return;
			var list = this.alphabetizedUsers;
			var userCount = list.length;
			var buff = '<center>' + userCount + ' users</center>';
			for (var i = 0; i < userCount; i++) {
				var identity = list[i];
				buff += '<div class="username"><font color="' + hashColor(identity.substr(1)) + '">' + escapeHTML(identity) + '</font></div>';
			}
			$('.users').html(buff);
		};
		Room.prototype.addButton = function() {
			var roomCount = $(".rooms .rel").length - 1; //-1 bcos the add room button counts
			this.$button = buff = $('<div class="rel"><h4>' + title + '</h4><span>x</span></div>');
			if (roomCount === 0) {
				$('.rooms').prepend(buff);
			} else $('.rooms .rel').last().before(buff);
		};
		Room.prototype.send = function(msg) {
			this.sent.push(msg);
			this.scrollSent = this.sent.length;
			this.message = '';
			ate.socket.emit('c', {
				msg: msg,
				room: this.id
			});
		};
		Room.prototype.sendScrollDown = function() {this.sendScrollUp(true);};
		Room.prototype.sendScrollUp = function(down) {
			if (down) {
				this.scrollSent++;
				if (this.scrollSent > this.sent.length) this.scrollSent = this.sent.length;
			} else {
				this.scrollSent--;
				if (this.scrollSent < 0) this.scrollSent = 0;
			}
			var log = this.sent[this.scrollSent];
			if (log) {
				$('.message').val(log);
			} else $('.message').val(this.message);
		};
		
		var room = new Room(title);
		this.rooms[room.id] = room;
		if (title !== "Global") room.addButton();
		return room;
	},
	socketInitialized: function() {
		for (var i in this.events) this.socket.events[i] = this.events[i];
		if (cookie("token")) {
			this.socket.emit('tokenrename', {token: cookie("token")});
		} else if (cookie("username")) {
			this.socket.emit('nametaken', {username: cookie("username")});
		}
		this.parseURL();
		if (this.replaying) return;
		this.socket.emit('c', {msg: '/join lobby'});
		this.socket.emit('duels');
	},
	resize: function() {
		/* keyboard detection... since keyboards make the screen height REDICULOUSLY small... maybe i'll need it later idk
		if (ate.initial && helpers.isMobile()) {
			var percentChange = {
				width: Math.abs(100 - ($("body").width() / ate.initial.width * 100)),
				height: Math.abs(100 - ($("body").height() / ate.initial.height * 100))
			};
			if (percentChange.width < 1 && percentChange.height > 35) {
				//on keyboard popup DONT resize since there's only like 80 pixels to split in height afterwards
				return;
			}
		}
		*/
		$("#content").height($("body").height() - $("#content").offset().top);
		var smallRightSide = 300,
			bigRightSide = 600;
		if (helpers.isMobile()) smallRightSide = 175;
		var rightSideWidth = smallRightSide;
		var leftSideWidth = $("body").width() - rightSideWidth;
		var leftSideWidthWITHbigRight = $("body").width() - bigRightSide;
		if (leftSideWidth >= 700 && leftSideWidthWITHbigRight >= 500) {
			rightSideWidth = bigRightSide;
			leftSideWidth = leftSideWidthWITHbigRight;
		}
		$("#rightSide").width(rightSideWidth);
		$("#leftSide").width(leftSideWidth);
		
		var headerHeight = $(".header").height(),
			roomsHeight = $(".rooms").height(),
			inputHeight = $(".input").height(),
			usersWidth = $(".users").width();
		var chatHeight = $("body").height() - (headerHeight + roomsHeight);
		var logsWidth = leftSideWidth - usersWidth;
		var logsHeight = chatHeight - inputHeight;
		$(".chat").height(chatHeight);
		$(".logs").height(logsHeight).width(logsWidth);
		$(".input").width(logsWidth);
		
		$("#duels").height($("body").height() - $("#duels").offset().top);
		if (app.game) app.game.resize();
	},
	updateHeader: function() {
		var buff = '';
		buff += '<span>' + this.username + '</span>';
		if (!this.username || this.username.substr(0, 5) === "Guest") {
			buff = '<button onclick="ate.prompt(\'nametaken\');">Choose Name</button>';
		}
		$(".userbar").empty().html(buff);
	},
	promptCount: 0,
	prompt: function(type, opaqueness) {
		var data = {};
		if (type.type) {
			var data = type;
			var type = data.type;
		}
		var id = ++this.promptCount;
		var buff = '';
		var start = '';
		var end = '';
		if (opaqueness !== false) {
			start = '<div id="p' + id + '" class="opaqueness">';
			end = '</div>';
		}
		buff += '<div class="popup"><div class="form"><input type="hidden" name="formType" value="' + type + '" />';
		if (type === "nametaken") {
			if (data.err) buff += '<p class="err">' + data.err + '</p>';
			buff += '<p>';
			buff += '<label>Username: <input name="username" type="text" onkeypress="ate.onEnterSubmit(event, this);" /></label>';
			buff += '</p>';
			buff += '<div class="buttons"><button class="submit">Choose Name</button> <button onclick="$(\'#p' + id + '\').mouseup();">Cancel</button></div>';
		} else if (type === "nameregged") {
			if (data.err) buff += '<p class="err">' + data.err + '</p>';
			buff += '<p>';
			buff += '<label>Username: <input type="hidden" name="username" value="' + data.username + '" /><label>' + data.username + '</label></label>';
			buff += '</p>';
			buff += '<p>';
			buff += '<label>Password: <input name="password" type="password" onkeypress="ate.onEnterSubmit(event, this);" /></label>';
			buff += '</p>';
			buff += '<div class="buttons"><button class="submit">Choose Name</button> <button onclick="$(\'#p' + id + '\').mouseup();">Cancel</button></div>';
		} else if (type === "registername") {
			if (data.err) buff += '<p class="err">' + data.err + '</p>';
			buff += '<p>';
			buff += '<label>Username: <input type="hidden" name="username" value="' + data.username + '" /><label>' + data.username + '</label></label>';
			buff += '</p>';
			buff += '<p>';
			buff += '<label>Password: <input name="password" type="password" onkeypress="ate.onEnterSubmit(event, this);" /></label>';
			buff += '</p>';
			buff += '<div class="buttons"><button class="submit">REGISTER</button> <button onclick="$(\'#p' + id + '\').mouseup();">Cancel</button></div>';
		} else if (type === "error") {
			buff += '<font color="red"><b>' + data.err + '</b></font>';
		}
		buff += '</div></div>';
		var el = $(start + buff + end).appendTo("body").find('input').last();
		if (!helpers.isMobile()) el.focus();
	},
	closePrompt: function(id) {
		$("#p" + id).remove();
	},
	domEvents: function() {
		$(window).on('resize', this.resize);
		$("body").on("click", function() {
			$("#userdetails").remove();
		}).on("click", "a", function(e) {
			var duelId = this.href.split('duel-');
			if (duelId.length - 1  > 0) {
				duelId = duelId[1];
				app.socket.emit('watch', {id: duelId});
				e.preventDefault();
			}
		}).on("mouseup touchend", ".opaqueness", function(e) {
			if (e.target.id !== this.id || e.which === 3) return;
			ate.closePrompt(this.id.replace('p', ''));
		}).on("click", ".popup .submit", function() {
			var popup = $(this).closest('.popup');
			var data = {};
			var inputs = popup.find('input');
			//construct data with form elements
			for (var i in inputs) {
				if (isNaN(i)) continue;
				var el = inputs[i];
				data[el.name] = el.value;
			}
			popup.closest('.opaqueness').mouseup();//remove popup
			var event = data.formType;
			delete data.formType;
			ate.socket.emit(event, data);
		}).on("keydown", ".message", function(e) {
			if (e.keyCode === 13) {
				//enter
				if (!this.value.trim().length) return false;
				var msg = this.value;
				ate.focusedRoom.send(msg);
				this.value = "";
				e.preventDefault();
			} else if (e.keyCode === 38) {
				//up
				ate.focusedRoom.sendScrollUp();
				e.preventDefault();
			} else if (e.keyCode === 40) {
				//down
				ate.focusedRoom.sendScrollDown();
				e.preventDefault();
			}
		}).on("keyup", ".message", function() {
			if (ate.focusedRoom.scrollSent !== ate.focusedRoom.sent.length) {
				//if your editing an old log don't set it as the current 'message'
				return;
			}
			ate.focusedRoom.message = this.value;
		}).on("click", ".rooms .rel", function() {
			if (this.innerHTML === "+") {
				//see other rooms tab thing
				return;
			}
			if ($(this).hasClass("selectedRoom")) return;
			ate.rooms[toId($(this).find('h4').text())].focusRoom();
		}).on("click", "#content", function(e) {
			//only focus on input if
				//shift key isn't being pressed
				//no selection is being made
			if (e.shiftKey || (window.getSelection && !window.getSelection().isCollapsed)) {
				return;
			}
			if (!helpers.isMobile()) $(".message").focus();
		}).on("keydown", function(e) {
			if (e.keyCode === 8 && !inputFocus) {
				//prevent backspace if not in input
				//this prevents accidental page disconnections with backspace
				e.preventDefault();
				e.stopPropagation();
			}
		}).on("click", ".rooms .rel span", function() {
			ate.rooms[toId($(this).parent().find('h4').text())].send('/leave');
		}).on("focus", "input, textarea", function() {
			inputFocus = this;
		}).on("blur", "input, textarea", function() {
			inputFocus = undefined;
		}).on("keypress", ".pmmessage", function(e) {
			if (e.keyCode === 13) {
				//enter
				if (!this.value.trim().length) return false;
				var msg = this.value;
				this.value = "";
				ate.socket.emit('c', {
					msg: '/pm ' + ate.focusedPM.userid + ',' + msg,
					room: ate.focusedRoom.id
				});
			}
		}).on("click", ".pmlogs", function(e) {
			if (e.shiftKey || (window.getSelection && !window.getSelection().isCollapsed)) {
				return;
			}
			ate.focusPM(ate.focusedPM);
		}).on("mousedown touchstart", ".pmer", function(touch) {
			//drag start
			if (touch.originalEvent.touches) touch = touch.originalEvent.touches[0];
			var drag = {};
			var sourceOffset = $(".pms").offset();
			drag.offset = {
				left: touch.pageX - sourceOffset.left,
				top: touch.pageY - sourceOffset.top
			};
			drag.dragging = $(".pms");
			ate.dragPM = drag;
		}).on("click", ".username", function(e) {
			if ($(this).hasClass('nopopup')) return;
			var popup = $('<div id="userdetails" class="popup"></div>');
			var targetName = $(this).text();
			e.preventDefault();
			e.stopPropagation();
			$("#userdetails").remove();
			var name = $(this).clone().addClass("nopopup");
			name.html(name.html().replace(':', ''));
			$("<h2></h2>").append(name).appendTo(popup);
			var challengeButton = $('<button class="btn">Challenge</button>');
			var pmButton = $('<button class="btn">PM</button>');
			if (toId(targetName) === ate.userid) {
				challengeButton.prop('disabled', true);
				pmButton.prop('disabled', true);
			} else {
				challengeButton.on('click', function() {
					app.challengePrompt(targetName);
					$("#userdetails").remove();
				});
				pmButton.on('click', function() {
					ate.newPM(ate.userid, targetName);
					ate.focusPM(ate.pms[toId(targetName)]);
					$("#userdetails").remove();
				});
			}
			popup.append(challengeButton).append(' ').append(pmButton);
			popup.appendTo('body');
			var css;
			if ($(this).parent().hasClass('users')) {
				//users list username
				css = {
					left: ($(this).offset().left + $(this).width()) + 'px',
					top: ($(this).offset().top) + 'px'
				};
			} else {
				//chat username
				css = {
					left: ($(this).offset().left) + 'px',
					top: ($(this).offset().top - $(this).height() - popup.height()) + 'px'
				};
			}
			popup.css(css);
		});
		$(document).on("mousemove touchmove", function(touch) {
			//dragging
			if (ate.dragPM) touch.preventDefault();
			if (touch.originalEvent.touches) touch = touch.originalEvent.touches[0];
			if (!ate.dragPM) return;
			ate.dragPM.dragging.css({
				left: (touch.pageX - ate.dragPM.offset.left) + 'px',
				top: (touch.pageY - ate.dragPM.offset.top) + 'px'
			});
			ate.dragPM.lastTouch = touch;
		});
		$(document).on("mouseup touchend", function() {
			//drag end
			if (ate.dragPM) {
				var el = ate.dragPM.dragging;
				if (ate.dragPM.type === "counter") {
					ate.dragPM.dropCounter();
				} else {
					if (el.attr('id') === 'leaderboard') {
						var offsets = el.offset();
					} else {
						var offsets = $($('.pmer')[0]).offset();
					}
					if (offsets.top < 0) {
						el.css('top', el.position().top - offsets.top + "px");
					}
					if (offsets.left < 0) {
						el.css('left', el.position().left - offsets.left + "px");
					}
				}
				delete ate.dragPM;
			}
		});
	},
	onEnterSubmit: function(e, el) {
		if (e.keyCode === 13) {
			var closestSubmit = $(el).closest('.popup').find('.submit');
			closestSubmit.click();
		}
	},
};
$(function() {
	ate.init();
});
ate.resize();
