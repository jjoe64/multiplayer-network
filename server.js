'use strict';

var io = require('socket.io').listen(8088);

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
	
	console.log('updateing ... '+this.velocity[0]+' * '+d);
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
	var TICK_RATE = 1000;//133;
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
	
	function incomingUpdatePlayerState(client, data) {
		if (client.player) {
			client.player.setData(data);
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
		runPhysic(d);
		sendSnapshots();
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

