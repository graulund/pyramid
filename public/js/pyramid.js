function ucfirst(str){
	var f = str.charAt(0)
		.toUpperCase();
	return f + str.substr(1)
}

function formatTime(milliseconds){
	var seconds = Math.floor(milliseconds / 1000)
	var days    = Math.floor(seconds / 86400)
	    seconds = seconds % 86400
	var hours   = Math.floor(seconds / 3600)
	    seconds = seconds % 3600
	var minutes = Math.floor(seconds / 60)
	    seconds = seconds % 60
	return {
		day: days,
		hour: hours,
		min: minutes,
		sec: seconds
	}
}

function timeOpacity(secondsSince){
	// Exponential fall
	var maxSeconds = 2*3600
	return 1/Math.pow(Math.pow(10, 1/(maxSeconds/2)), secondsSince)
}

function timeTextOpacity(secondsSince){
	// Linear fall
	var minOpacity = 0.2, maxOpacity = 1
	return Math.max(minOpacity, Math.min(maxOpacity, 29/25 - secondsSince/45000))
}

function round2(val){
	return Math.round(val * 100) / 100
}

function pathname(){
	var pn = location.pathname
	// Replace double slashes with just one /
	pn = pn.replace(/\/+/g, "/")
	return pn
}

function areWeScrolledToTheBottom(){
	// Are we scrolled to the bottom?
	// --> Elements that have heights and offsets that matter
	var b = $("body"), w = $(window), c = $("#container")
	// --> Two oft-used heights
	var ch = c.height(), wh = w.height()
	// --> The calculation!
	return (ch - (b.scrollTop() + wh)) <= 100 || wh >= ch
}

function scrollToTheBottom(){
	$("body").scrollTop($("#content").height())
}

function onLivestampChange(event, from, to){
	var dt = $(this).attr("datetime"),
		li = $(this).parents("li"),
		m = moment(dt).tz(DEFAULT_TIMEZONE),
		ms = moment(new Date()).tz(DEFAULT_TIMEZONE).diff(m),
		timeInfo = formatTime(ms),
		className = "",//timeClassName(timeInfo),
		sts = m.format("H:mm"),
		ym = moment().tz(DEFAULT_TIMEZONE).subtract(1, "days").startOf("day")

	if(timeInfo.day == 1 && ym < m){
		sts = "yesterday " + sts
	}

	// If the date is before yesterday midnight, it's earlier than yesterday.
	if(ym > m){
		sts = ""
	}

	$(".ts", li).text(sts)

	// Color
	var backgroundOpacity = timeOpacity(ms/1000), textColor = "#000",
		opacity = timeTextOpacity(ms/1000)

	if(backgroundOpacity >= 0.3){
		textColor = "#fff"
	}

	li.css("background-color", "rgba(" +
		DEFAULT_COLOR_RGB + "," +
		round2(backgroundOpacity) +
	")")
	li.css("color", textColor)
	li.css("opacity", round2(opacity))

	//console.log("Livestamp changing", arguments, formatTime(ms))
}

var DEFAULT_COLOR_RGB = "0,0,51";
var DEFAULT_TIMEZONE = "Europe/Copenhagen";
var ROOT_PATHNAME = "/";

(function($){

	$(document).ready(function(){

		var ls = $("#lastseen")

		// Events:

		// LIVESTAMP CHANGING -------------------------------------------------

		$("time", ls).on("change.livestamp", onLivestampChange)

		// MESSAGE RECEIVED ---------------------------------------------------

		var socket = io()

		socket.on("msg", function(details){

			// Just checking properties
			if(
				typeof details != "object" ||
					!("username" in details) ||
					!("date" in details)
				){
				return
			}

			// DEBUG
			//console.log("MSG", details)

			// Event time
			var m = moment(details.date).tz(DEFAULT_TIMEZONE)

			// WHAT WE DO NOW DEPENDS ON THE PAGE WE'RE ON

			var pn = pathname()

			// FRONT PAGE:

			if(pn == ROOT_PATHNAME){
				// Let's go!
				var el = $("li#" + details.username, ls), isNew = false

				if(el.length <= 0){
					isNew = true
					el = $("<li></li>").attr("id", details.username)
					el.html(
						'<div class="l"><strong><a href="/user/' + details.username.toLowerCase() + '">' + details.username + '</a></strong> ' +
						'<time></time> <span class="channel"></span></div> <div class="ts"></div>'
					);

					if (details.isBestFriend) {
						el.attr("class", "bestfriend");
					}

					// Insert alphabetically
					var lis = ls.children("li");
					var inserted = false;

					if (lis.length) {
						lis.each(function(i) {

							if (inserted) {
								return;
							}

							var n = lis[i+1], me = $(this);

							var un = details.username.toLowerCase();
							var id = this.id.toLowerCase();

							if (id > un) {
								me.before(el);
								inserted = true;
								return;
							}

							if (
								id < un &&
								(!n || n.id.toLowerCase() > un)
							) {
								me.after(el);
								inserted = true;
							}
						});
					} else {
						ls.append(el);
					}
				}

				el.css("background-color", "rgba(" +
					DEFAULT_COLOR_RGB + ",1)")
				el.css("color", "#fff")
				el.css("opacity", 1)

				var ts = m.format("H:mm:ss"), sts = m.format("H:mm"),
					tel = $("time", el), tsel = $(".ts", el), chel = $(".channel", el)

				tel.attr("title", ts)
					//.text(ts)
					.attr("datetime", m.format())

				if(isNew){
					tel.livestamp(m)
					tel.on("change.livestamp", onLivestampChange)
				} else {
					tel.attr("data-livestamp", m.format("X"))
				}

				tsel.text(sts)

				chel.text("in " + details.channel)
				el.attr("title", "In " + details.channel)

				// Do a lil' flash!
				el.addClass("flash")
				setTimeout(function(){
					el.removeClass("flash")
				}, 200)
			}

			// USER PAGE:

			var upMatches = pn.substr(ROOT_PATHNAME.length).match(/^user\/([^\/]+)/)
			var allMatches = pn.substr(ROOT_PATHNAME.length).match(/^all\/?$/)
			if(upMatches || allMatches){
				var username = upMatches ? upMatches[1] : "", linesEl = $("#lines")
				if(
					linesEl.length > 0 &&
					(allMatches || details.username.toLowerCase() == username.toLowerCase())
				){
					// This is the user page for this person!

					if(!("message" in details)){
						return
					}
					if(!("isAction" in details)){
						details.isAction = false
					}

					// Clear waiting message
					$("li.waiting", linesEl).hide()

					// Are we scrolled to the bottom?
					var scrolledDown = areWeScrolledToTheBottom()

					// Add this message to the log.
					var logentry = $('<li><span class="channel"></span><time></time>' +
						'<strong class="author"></strong><span class="msg"></span></li>')
					$("time", logentry).text(m.format("HH:mm:ss")).attr("datetime", m.format())
					$("strong.author", logentry).text(
						(details.isAction ? "* " : "") +
						ucfirst(details.username)
					)
					$("span.msg", logentry).text(details.message)
					$("span.channel", logentry).text(details.channel)

					if(details.isAction){
						logentry.addClass("action")
					}

					linesEl.append(logentry)

					// Incrementing line number at the top of the page, if present
					var lnel = $("#linenum")
					if(lnel.length > 0){
						var ln = lnel.text()
						if(/^[0-9]+$/.test(ln)){
							lnel.text(++ln)
						}
					}

					// Scroll down to the bottom if we were previously scrolled down
					if(scrolledDown){
						scrollToTheBottom()
					}
				}
			}

		})

	})


})(jQuery)