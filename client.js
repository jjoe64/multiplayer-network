'use strict';

/** shared */
var Player = function(id) {
	this.position = [0, 0]; // x/y
	this.velocity = [0, 0]; // xy
	this.color = "rgb(255, 0, 0)";
	this.id = id;
};
Player.prototype.update = function(d) {
	this.position[0] += this.velocity[0] *d;
	this.position[1] += this.velocity[1] *d;
};
Player.prototype.toData = function() {
	return {
		pos: this.position,
		vel: this.velocity,
		clr: this.color,
		id: this.id
	};
};
Player.prototype.setData = function(d) {
	this.position = d.pos;
	this.velocity = d.vel;
	this.color = d.clr;
};


(function() {
	var CLIENT_CMDRATE = 1000/30;
	
	var socket;
	var canvas = document.getElementById('canvas');
	var ctx = canvas.getContext('2d');
	var _this = this;
	var tick=0;
	
	var p1 = new Player(new Date().getTime()); // me
	
	var players = [
		p1
	];
	var nextWorldUpdate;
	var curWorldUpdate;

	canvas.addEventListener('keydown', function(ev) {
		console.log(ev.keyCode);
		if (ev.keyCode == 38) {
			 // up
			 p1.velocity[1] = -0.05;
		} else if (ev.keyCode == 40) {
			// down
			p1.velocity[1] = 0.05;
		} else if (ev.keyCode == 37) {
			// left
			p1.velocity[0] = -0.05;
		} else if (ev.keyCode == 39) {
			// right
			p1.velocity[0] = 0.05;
		} else if (ev.keyCode == 32) {
			// stop / space
			p1.velocity = [0, 0];
		}
	}, true);
	
	document.getElementById('btnConnect').addEventListener('click', function() {
		connect.call(_this);
	});
	document.getElementById('color').addEventListener('change', function() {
		p1.color = this.value;
		console.log(p1.color);
	});


	// main loop
	var time = new Date().getTime();
	setInterval(function() {
		var d = new Date().getTime()-time;
		updateWorld();
		interpolate(d);
		drawPlayers();
		time = new Date().getTime();
		
		// current tick based on servers tickrate (133)
		tick += d/133;
	}, 100);
	
	// client update rate
	setInterval(function() {
		/* The client creates user commands from sampling input devices (snapshot of the current keyboard and mouse state) and sends command packets at a certain rate of packets per second (usually 30). (cl_cmdrate) */
		if (socket) {
			
		}
	}, CLIENT_CMDRATE);
	
	function updateWorld() {
		if (!curWorldUpdate || !nextWorldUpdate) return;
		
		if (tick >= nextWorldUpdate.tick) {
			curWorldUpdate = nextWorldUpdate;
		}
		if (tick >= curWorldUpdate.tick && curWorldUpdate.processsed === false) {
			// start
			// set
			curWorldUpdate.players.forEach(function(pl) {
				// find player
				var localPl;
				players.forEach(function(_pl) {
					if (_pl.id == pl.id) {
						localPl = _pl;
					}
				});
				if (!localPl) {
					// new player
					console.log("new player");
					localPl = new Player(pl.id);
					players.push(localPl);
				}
				localPl.setData(pl);
			});
			curWorldUpdate.processsed = true;
		}
	}
	
	function interpolate(d) {
		players.forEach(function(p) {
			// update player pos
			p.update.call(p, d);
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

	function sayHello() {
		socket.emit('hello', p1.toData());
	}

	function incomingWorldUpdate(world) {
		world.processed = false;
		if (!curWorldUpdate) {
			curWorldUpdate = world;
			tick = world.tick;
		} else {
			nextWorldUpdate = world;
		}
	}

	function connect() {
		console.log('connecting...');
		socket = io.connect('http://localhost:8088');
		socket.on('hello', function(data) {
			console.log('...connected');
			// send hello back
			sayHello.call(_this);
		});
		socket.on('update', function(data) {
			incomingWorldUpdate.call(_this, data);
		});
	}

})();

