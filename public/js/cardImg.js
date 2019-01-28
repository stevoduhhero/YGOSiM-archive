function cardImg(card, dontAnimate) {
	var imgs = {
		"-1": "./img/back.png",
		"-2": "./img/deck.png",
		"-3": "./img/sword.png"
	};
	var img = new Image();
	var src = 'http://elloworld.ddns.net/__!!nongit/pics/' + card + '.jpg';
	if (card < 0) src = './img/back.png'; //this means a card was banished face down, so even though we know the id, just use the facedown image
	if (imgs[card]) src = imgs[card];
	img.src = src;
	img.cardId = card;
	if (app.game) {
		function faceDownCardIdResolve(el) {
			if (cardInfo(el.cardId)) return;
			var parent = $(el).parent();
			var parentId = parent.attr('id') || '';
			if (parentId.split('opp').length - 1 > 0) return; //can't get opponents facedown info
			var zone = parentId.replace('you', '');
			if (isNaN(zone)) return;
			var imgs = parent.find('img');
			for (var slot in imgs) {
				if (isNaN(slot)) continue;
				if (imgs[slot] === el) break;
			}
			var card = app.game.you.field[zone][slot];
			if (card) el.cardId = card.id;
		}
		function lookup() {
			faceDownCardIdResolve(this);
			mousingon = this.cardId;
			var cardId = this.cardId;
			function check() {
				if (mousingon !== undefined) {
					if (cardInfo(cardId)) $(".cardDescription").html(app.game.cardInfo(cardId));
					lookupOff();
				}
			}
			if (typeof mousingonTimeout === "undefined") mousingonTimeout = setTimeout(check, 250);
		}
		function lookupOff() {
			if (typeof mousingonTimeout !== "undefined") {
				clearTimeout(mousingonTimeout);
				mousingonTimeout = undefined;
				mousingon = undefined;
			}
		}
		function directLookup() {
			faceDownCardIdResolve(this);
			var cardId = this.cardId;
			if (cardInfo(cardId)) $(".cardDescription").html(app.game.cardInfo(cardId));
		}
		img.ontouchstart = directLookup;
		img.onmousedown = directLookup;
		img.onmouseover = lookup;
		img.onmouseout = lookupOff;
	}
	if (dontAnimate) {} else {
		img.style.position = 'absolute';
		img.style.top = '0px';
		img.style.left = '0px';
		img.style.display = 'none';
		img.copy = function(el, justHeight) {
			el = jQuery(el);
			jQuery(this).css({
				left: el.offset().left + 'px',
				top: el.offset().top + 'px'
			});
			if (justHeight !== false) {
				jQuery(this).height(el.height());
				if (!justHeight) jQuery(this).width(el.width());
			}
			return this;
		};
		img.toBody = function() {
			jQuery(this).appendTo('body');
			return this;
		};
		img.moveTo = function(e, time, funk) {
			var div = jQuery(this);
			var start = {
				left: Number(div[0].style.left.replace('px', '')),
				top: Number(div[0].style.top.replace('px', ''))
			};
			var end = {
				left: 0,
				top: 0
			};
			//if s or e are html elements instead of coordinates, center the div's position inside the start and end
			if (e.left) end = e;
			else {
				end = $(e).offset();
				end.left += ($(e).width() - $(div).width()) / 2;
				end.top += ($(e).height() - $(div).height()) / 2;
			}

			//animate it
			div.css({
				position: "absolute",
				display: "block",
				left: start.left + "px",
				top: start.top + "px",
				"z-index": 99999,
			}).animate({
				left: end.left + "px",
				top: end.top + "px"
			}, time, function() {
				funk();
			});
		};
	}
	return img;
}
