'use strict';

var io = require('socket.io').listen(8088);
io.set('log level', 1);

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
	var TICK_RATE = 133;
	var tick = 0;
	var clients = [];
	var _this = this;

	io.sockets.on('connection', function (socket) {
		console.log('client conneted');
		var cl = {
			socket: socket
		};
		clients.push(cl);
		// send hello packet
		sayHello(cl);
		socket.on('hello', function(data) {
			incomingHello.call(_this, cl, data);
		});
		socket.on('updatePlayerState', function(data) {
			incomingUpdatePlayerState.call(_this, cl, data);
		});
/*
socket.emit('news', { hello: 'world' });
socket.on('my other event', function (data) {
console.log(data);
});
*/
	});
	
	function sayHello(client) {
		client.socket.emit('hello', {
			
		});
	}
	
	function incomingHello(client, data) {
		var pl = new Player(data.id);
		pl.setData(data);
		client.player = pl;
		console.log('player logged in ');
	}
	
	var _counter = 0;
	var _timerStart = new Date().getTime();
	function incomingUpdatePlayerState(client, vel) {
		if (client.player) {
			client.player.velocity = vel;
		}
		
		_counter++;
		if (new Date().getTime()-_timerStart > 10000) {
			// 10 sek
			console.log('[SOCKET BENCHMARK] packages receivied in 10 sec: '+_counter);
			// reset
			_counter = 0;
			_timerStart = new Date().getTime();
		}
	}
	
	function runPhysic(d) {
		clients.forEach(function(cl) {
			// update player pos
			var p = cl.player;
			if (p) {
				p.update.call(p, d);
			}
		});
	}
	
	function doTick(d) {
		//console.log('tick');
		sendSnapshots();
		
		// die physic muss danach berechnet werden, sonst läuft er schon TICK_SIZE lange in die entsprechende richtung und hopft dann beim client
		runPhysic(d);
		tick++;
	}
	
	function sendSnapshots() {
		/* After simulating a tick, the server decides if any client needs a world update and takes a snapshot of the current world state if necessary
		*/
		// currently world full_snapshot
		// gen
		var snapshot = {
			tick: tick
		};
		snapshot.players = [];
		clients.forEach(function(cl) {
			if (cl.player) {
				snapshot.players.push(cl.player.toData());
			}
		});
		
		// send
		clients.forEach(function(cl) {
			cl.socket.emit('update', snapshot);
		});
		
		//if (snapshot.players.length > 0)
		//console.log('send world state [tick: '+tick+' | vel: '+snapshot.players[0].vel+']');
	}
	
	// main loop
	var _this = this;
	var time = new Date().getTime();
	setInterval(function() {
		var d = new Date().getTime()-time;
		doTick.call(_this, d);
		
		time += d;
	}, TICK_RATE);

})();

