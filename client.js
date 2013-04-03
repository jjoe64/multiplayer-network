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


/** Timeline **/
var Timeline = function() {
	this.currentTick = 0;
	this.curWorldState = null;
	this.nextWorldState = null;
	this.nextNextWorldState = null; /* just in case server is too fast */
};
Timeline.prototype.update = function(d) {
	// current tick based on servers tickrate (133)
	this.currentTick += d/133;
};
Timeline.prototype.getWorldState = function() {
	if (!this.curWorldState || !this.nextWorldState) return;
	
	// shifting
	if (this.currentTick >= this.nextWorldState.tick) {
		this.curWorldState = this.nextWorldState;
		this.nextWorldState = this.nextNextWorldState;
		this.nextNextWorldState = null;
	}
	if (this.currentTick >= this.curWorldState.tick && this.curWorldState.processed === false) {
		this.curWorldState.processed = true;
		return this.curWorldState;
	}
	return null;
};
Timeline.prototype.addWorldState = function(world) {
	world.processed = false;
	if (!this.curWorldState) {
		// first worldstate
		this.curWorldState = world;
		this.currentTick = world.tick;
	} else if (!this.nextWorldState) {
		this.nextWorldState = world;
	} else {
		this.nextNextWorldState = world;
	}
};


(function() {
	var CLIENT_CMDRATE = 1000/30; //30
	
	var socket;
	var canvas = document.getElementById('canvas');
	var ctx = canvas.getContext('2d');
	var _this = this;
	
	var p1 = new Player(new Date().getTime()); // me
	var p1Vel = [0, 0];
	
	var players = [
		p1
	];

	var timeline = new Timeline();

	canvas.addEventListener('keydown', function(ev) {
		console.log(ev.keyCode);
		if (ev.keyCode == 38) {
			 // up
			p1Vel[1] = -0.05;
		} else if (ev.keyCode == 40) {
			// down
			p1Vel[1] = 0.05;
		} else if (ev.keyCode == 37) {
			// left
			p1Vel[0] = -0.05;
		} else if (ev.keyCode == 39) {
			// right
			p1Vel[0] = 0.05;
		} else if (ev.keyCode == 32) {
			// stop / space
			p1Vel = [0, 0];
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
		time += d;
		
		// current tick based on servers tickrate (133)
		timeline.update(d);
	}, 33);
	
	// client update rate
	var _counter = 0;
	var _timerStart = new Date().getTime();
	setInterval(function() {
		/* The client creates user commands from sampling input devices (snapshot of the current keyboard and mouse state) and sends command packets at a certain rate of packets per second (usually 30). (cl_cmdrate) */
		if (socket) {
			socket.emit('updatePlayerState', p1Vel);
		}
		
		_counter++;
		if (new Date().getTime()-_timerStart > 10000) {
			// 10 sek
			console.log('[SOCKET BENCHMARK] packages sent in 10 sec: '+_counter);
			// reset
			_counter = 0;
			_timerStart = new Date().getTime();
		}
	}, CLIENT_CMDRATE);
	
	function updateWorld() {
		var world = timeline.getWorldState();
		if (world) {
			// start
			// set
			world.players.forEach(function(pl) {
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
		timeline.addWorldState(world);
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

