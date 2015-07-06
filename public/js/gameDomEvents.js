$("#findDuel").click(function() {
	if (this.innerHTML === "Find Duel") {
		var insides = "",
			id = new Date() / 1;
		insides += '<div id="daddy' + id + '" onclick="$(\'#baby' + id + '\').remove();$(this).remove();" style="width: 100%;height: 100%;background: rgba(255, 255, 255, 0.25);cursor: pointer;position: absolute;top: 0;left:0 ;"></div>';
		insides += '<div id="baby' + id + '" class="search">';
		insides += '<div><label>Deck:</label>';
		insides += '<select id="selectDeck' + id + '">';
		for (var i in app.decks) insides += '<option value="' + i + '">' + app.decks[i] + '</option>';
		insides += '</select>';
		insides += '</div>';
		insides += '<div><label>Format:</label>';
		insides += '<select id="tier' + id + '">';
		for (var i in Formats) insides += '<option>' + Formats[i] + '</option>';
		insides += '</select>';
		insides += '</div>';
		insides += '<button class="btn" onclick="var tier = $(\'#tier' + id + '\').val();var el = $(\'#selectDeck' + id + '\');$(\'#daddy' + id + '\').click();if (el.val() !== null || toId(tier) === \'random\') {app.socket.emit(\'search\', {tier: tier, deckString: app.deck[el.val()], deck: app.decks[el.val()]});}">Find Duel</button>';
		insides += '</div>';
		$("body").append(insides);
	} else app.socket.emit('search');
});
$("body").on("click", ".promptOpaqueness", function() {
	var id = this.id.replace('promptOpaqueness', '');
	app.game.promptRemove(id);
}).on("click", ".prompt img", function() {
	var id = $(this).parent().attr('id').replace('prompt', '');
	app.game.promptRespond(id, this);
}).on("click", ".selectablePhase", function() {
	var id = this.id;
	app.game.send('phase', {
		phase: id
	});
}).on("mouseover touchstart", "#youSide .o, #youhand img", function(e) {
	app.game.contextHover(this);
}).on("click", ".contextMenu div", function() {
	app.game.contextClickOption(this.innerHTML);
}).on("click", "#youdeck, #youextra, #youbanished, #oppbanished, #yougrave, #oppgrave", function(e) {
	if ($(this).find('.deckCount').text() === "0") return;
	if (this.id === "youdeck") {
		//draw a card
		app.game.context = {el: $(this)};
		app.game.contextClickOption("Draw");
	} else {
		//just view the deck list
		var list = this.id.replace('you', '').replace('opp', '');
		var who = "you";
		if (this.id.split('opp').length - 1 > 0) who = "opp";
		app.game.you.viewList(app.game[who], list, app.game[who][list]);
		app.game.context = {el: $(this), who: who};
		app.game.contextClickOption("View");
	}
}).on("click", ".closeList", function() {
	$(".viewList").remove();
	var cardList = app.game.cardList;
	if (cardList.list === "deck" || cardList.list === "extra") {
		//obscure the lists (only obscure extra if it belongs to your opponent)
		if (cardList.targetPlayer.who() === "you" && cardList.list === "extra") {} else {
			for (var i in cardList.targetPlayer[cardList.list]) {
				cardList.targetPlayer[cardList.list][i] = -1;
			}
		}
	}
	app.game.context = {el: $("#youdeck")}; //just a hack, send all context stuff without a list to the "deck" list
	app.game.contextClickOption("Close List");
	delete app.game.cardList;
}).on("keypress", ".gameInput", function(e) {
	if (e.keyCode !== 13 || this.value.replace(/ /g, "") === "") return;
	app.game.chatSend(this.value);
	this.value = '';
}).on("click", "#game", function(e) {
	//only focus on input if
		//shift key isn't being pressed
		//no selection is being made
	app.game.cancelFindingAttackTarget();
	if ((app.game && app.game.focusedInput)) return;
	if (e.shiftKey || (window.getSelection && !window.getSelection().isCollapsed)) {
		return;
	}
	if (!helpers.isMobile()) $(".gameInput").focus();
}).on("click", ".resultButtons button", function() {
	if (this.innerHTML === "Leave") {
		$("#rps, #whoGo").remove();
		app.mode("initial");
		newurl("/");
	}
	app.game.send('resultButton', {
		type: this.innerHTML
	});
}).on("mouseover", ".deckCount", function() {
	$(this).parent().find('img').mouseover();
}).on("mouseover", ".cardName", function() {
	var cardId = this.id;
	$(".cardDescription").html(app.game.cardInfo(cardId));
}).on("click", "#opphand img", function() {
	var ray = $("#opphand img");
	for (var key in ray) {
		if (isNaN(key)) continue;
		var el = ray[key];
		if (el === this) {
			slot = key;
			break;
		}
	}
	app.game.send('targetCard', {
		list: "hand",
		slot: slot
	});
}).on("click", "#oppSide .monsterSpellZones .fieldZone", function() {
	var info = app.game.findingAttackTarget;
	if (!info || !$(this).hasClass("attackableZone")) return;
	app.game.foundAttackTarget(Number(this.id.replace('opp', '')));
}).on("mousedown touchstart", "#counter, #youSide .counter", function(touch) {
	if (touch.originalEvent.touches) touch = touch.originalEvent.touches[0];
	var type = "+";
	if ($(this).hasClass("counter")) type = "-";
	var w = 50, h = 50;
	var el = $("<div class=\"counter\"></div>").width(w).height(h).css({
		top: (touch.pageY - (h / 2)) + "px",
		left: (touch.pageX - (w / 2)) + "px",
		bottom: "auto",
		"z-index": 100000
	}).appendTo("body");
	var drag = {};
	drag.offset = {
		left: w / 2,
		top: h / 2
	};
	drag.dragging = el;
	drag.type = "counter";
	drag.dropType = type;
	if (type === "-") drag.originSlot = Number($(this).parent().attr('id').replace('you', ''));
	drag.dropCounter = function() {
		var touch = this.lastTouch;
		var zone = false;
		$(this.dragging).remove();
		
		for (var i = 0; i < 11; i++) {
			var el = $("#you" + i);
			var pos = el.offset();
			if (touch.pageX > pos.left && touch.pageX < pos.left + el.width()) {
				if (touch.pageY > pos.top && touch.pageY < pos.top + el.height()) {
					zone = i;
					break;
				}
			}
		}
		if (this.dropType === "-" && zone !== this.originSlot) {
			app.game.send('counter', {
				type: "-",
				zone: this.originSlot
			});
		} else if (this.dropType === "+") {
			if (zone === false) return;
			var firstSlot = app.game.you.field[zone][0];
			if (firstSlot && (firstSlot.pos === 0 || firstSlot.pos === 1)) {
				//the main monster in the zone is face up
				app.game.send('counter', {
					type: "+",
					zone: zone
				});
			}
		}
	};
	ate.dragPM = drag;
});
$(".changePoints").mousedown(function(e) {
	app.game.focusedInput = this;
	this.value = "";
}).blur(function() {
	var val = "SUBTRACT";
	if ($(this).hasClass("plusPoints")) val = "ADD";
	val = "[input] amount of life points to " + val + ".";
	this.value = val;
	app.game.focusedInput = false;
}).dblclick(function() {
	var type = "plus";
	if ($(this).hasClass("plusPoints")) type = "minus";
	$(this).removeClass("plusPoints").removeClass("minusPoints").addClass(type + "Points");
}).keydown(function(e) {
	if (this.value.split('Sent to server').length - 1 > 0) this.value = '';
}).keypress(function(e) {
	if (e.keyCode === 13) {
		var amount = Number(this.value);
		if (isNaN(amount)) return;
		if ($(this).hasClass("minusPoints")) amount = amount * -1;
		if (amount === 0) return;
		app.game.send("changePoints", {
			amount: amount
		});
		this.value = "Sent to server " + ((amount > 0) ? '+' : '') + amount + " points";
	}
});
$("#rollDice, #coinFlip, #token").click(function() {
	app.game.send(this.id);
});
$("#game").on("mousedown", function() {
	app.game.removeContext();
});
$("#deckbuilder").click(function() {
	$('#builder').show();
});
$("#ladder").click(function() {
	if ($("#leaderboard").length) return $("#leaderboard").show();
	var container = $('<div id="leaderboard"><div class="rel"></div></div>');
	var leaderboard = container.find('.rel');
	(function() {
		var exit = $('<span class="exit">x</span>');
		exit.mousedown(function() {
			container.hide();
		});
		leaderboard.append(exit);	
	})();
	(function() {
		var header = $('<h1>Leaderboard</h1>');
		header.on("mousedown touchstart", function(touch) {
			//drag start
			if (touch.originalEvent.touches) touch = touch.originalEvent.touches[0];
			var drag = {};
			var sourceOffset = container.offset();
			drag.offset = {
				left: touch.pageX - sourceOffset.left,
				top: touch.pageY - sourceOffset.top
			};
			drag.dragging = container;
			ate.dragPM = drag;
		});
		leaderboard.append(header);	
	})();
	(function() {
		var select = $('<select><option value="">Select a format</option></select>');
		for (var i = 0; i < Formats.length; i++) {
			select.append('<option>' + Formats[i] + '</option>');
		}
		select.on("change", function() {
			if (!this.value) return;
			app.socket.emit('ladder', {tier: this.value});
		});
		select.val(Formats[0]);
		leaderboard.append(select);
	})();
	(function() {
		var ladder = $('<div class="ladder">Loading...</div>');
		leaderboard.append(ladder);
	})();
	container.appendTo("body").css({
		left: (($("body").width() / 2) - (leaderboard.width() / 2)) + "px",
		top: (($("body").height() / 2) - (leaderboard.height() / 2)) + "px"
	});
	leaderboard.find('select').trigger('change');
});
(function gameDragDropEvents() {
	var draggables = [
		"#youhand img",
		"#youSide .fieldZone img",
		"#you10 img",
		"#you11 img",
		"#you12 img",
		"#Viewyou img",
		"#Viewoppgrave img",
		".sidingContainer img"
	];
	var droppables = [
		"#youSide .o",
		"#oppSide .fieldZone",
		"#youbanished",
		"#youhand"
	];
	$("body").on("mousedown touchstart", draggables.join(','), function(touch) {
		if (touch.originalEvent.touches) touch = touch.originalEvent.touches[0];
		if ($(this).parent().hasClass("o")) app.game.contextHover($(this).parent());
		var drag = {};
		var sourceOffset = $(this).offset();
		drag.source = this;
		drag.ghost = $(drag.source).clone().css({
			position: 'absolute',
			left: (sourceOffset.left) + 'px',
			top: (sourceOffset.top) + 'px',
			"z-index": 9999
		}).width($(drag.source).width()).height($(drag.source).height()).appendTo('body');
		drag.offset = {
			left: touch.pageX - sourceOffset.left,
			top: touch.pageY - sourceOffset.top
		};
		$(drag.source).hide();
		if ($(drag.source).parent().hasClass("cardList")) $(".viewList").hide(); //hide the cardList viewer as well so we can actually see where we're dragging
		app.dragging = drag;
		touch.preventDefault();
		return false;
	});
	$(document).on("mousemove touchmove", function(touch) {
		if (touch.originalEvent.touches) touch = touch.originalEvent.touches[0];
		if (!app.dragging) return;
		//unset drop target
		delete app.dragging.target;
		$(".dropTarget").removeClass("dropTarget");

		//see if we have our mouse over any droppables
		var tars = droppables;
		if ($(app.dragging.source).parent().parent().hasClass("deckContainer")) {
			//side decking
			tars = [".deckContainer", ".deckContainer div"];
		}
		var viableDroppables = 0;
		var skippedHand = false;
		var len = tars.length;
		for (var i = 0; i < len; i++) {
			var els = $(tars[i]);
			var elCount = els.length;
			for (var x = 0; x < elCount; x++) {
				if (!isNaN(x)) {
					var el = $(els[x]);
					var offset = el.offset();
					var borders = {
						min: {
							x: offset.left,
							y: offset.top
						},
						max: {
							x: offset.left + el.width(),
							y: offset.top + el.height()
						}
					};
					if ((borders.min.x <= touch.pageX && borders.max.x >= touch.pageX) && (borders.min.y <= touch.pageY && borders.max.y >= touch.pageY)) {
						//mousing over this element
						//set drop target
						viableDroppables++;
						if (el.attr('id') === "youhand") {
							skippedHand = true;
							continue;
						}
						app.dragging.target = el;
						$(el).addClass("dropTarget");
					}
				}
			}
		}

		if (viableDroppables === 1 && skippedHand) {
			var el = $("#youhand").addClass("dropTarget");
			app.dragging.target = el[0];
		}
		
		app.dragging.ghost.css({
			left: (touch.pageX - app.dragging.offset.left) + 'px',
			top: (touch.pageY - app.dragging.offset.top) + 'px'
		});
	});
	$(document).on("mouseup touchend", function() {
		//drop
		function drop(drag) {
			if (drag) {
				$(".viewList").show();
				$(drag.source).show();
				drag.ghost.remove();
			}
			if (!drag || !drag.target) return;
			$(drag.target).removeClass("dropTarget");
			app.game.drop(drag);
		}
		drop(app.dragging);
		delete app.dragging;
	});
})();
