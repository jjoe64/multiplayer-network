'use strict';

var Player = function() {
	this.position = [0, 0]; // x/y
	this.velocity = [0, 0]; // xy
	this.color = "rgb(255, 0, 0)";
};
Player.prototype.update = function() {
	this.position[0] += this.velocity[0];
	this.position[1] += this.velocity[1];
};

(function() {
	var canvas = document.getElementById('canvas');
	var ctx = canvas.getContext('2d');
	
	var p1 = new Player(); // me
	
	var p2 = new Player();
	p2.color = "rgb(0, 255, 0)";
	var players = [
		p1, p2
	];

	canvas.addEventListener('keydown', function(ev) {
		console.log(ev.keyCode);
		if (ev.keyCode == 38) {
			 // up
			 p1.velocity[1] = -5;
		} else if (ev.keyCode == 40) {
			// down
			p1.velocity[1] = 5;
		} else if (ev.keyCode == 37) {
			// left
			p1.velocity[0] = -5;
		} else if (ev.keyCode == 39) {
			// right
			p1.velocity[0] = 5;
		} else if (ev.keyCode == 32) {
			// stop / space
			p1.velocity = [0, 0];
		}
	}, true);


	// main loop
	setInterval(function() {
		calcPlayers();
		drawPlayers();	
	}, 100);
	
	function calcPlayers() {
		players.forEach(function(p) {
			// update player pos
			p.update.call(p);
		});
	}
	function drawPlayers() {
		ctx.clearRect(0, 0, 600, 400);
		players.forEach(function(p) {
			// draw player
			ctx.fillStyle = p.color;
			ctx.fillRect(p.position[0], p.position[1], 30, 30);
		});
	}
})();


function connect() {
	var socket = io.connect('http://localhost:8088');
	socket.on('news', function (data) {
		console.log(data);
		socket.emit('my other event', { my: 'data' });
	});
}

