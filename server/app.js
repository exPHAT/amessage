// aMessage relay server
// Aaron Taylor
//
// BEFORE RUNNING:
// Ensure there is a folder entitled "db"
// to store database informaiton.
// 
// ERROR CODES:
// -1: Unknown error
// -2: Auth error
// -3: Unknown action

var net = require('net');
var express = require('express');
var sha256 = require('sha256');
var tingo = require('tingodb')().Db;
var run = require('child_process').exec;

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server, {log: false});
var db = new tingo('./db', {});
var users =  db.collection("users");
var pending = db.collection("pending");

// Constants
var keyLength = 32;
var values = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";

function checkArrays(arrA, arrB) {
	// Check if arrays are the same

	if (arrA.length !== arrB.length) {
		return false;
	}

	var cA = arrA.slice().sort().join(",");
	var cB = arrB.slice().sort().join(",");

	return cA === cB;
}

function randKey(callback, times) {
	// Generate a random key of requested length

	if (times == undefined) {
		times = 0;
	}
	else if (times > 30) {
		// There has been a key match > 30 times

		console.log("Key error");
		return;
	}

	var finalKey = "";

	for (var i = 0; i < keyLength; i++) {
		var charIndex = Math.floor(Math.random()*values.length);
		finalKey += values[charIndex];
	}

	users.findOne({key:finalKey}, function(err, row) {
		if (row) {
			randKey(callback, times+1);
		}
		else {
			callback(finalKey);
		}
	});
}

function ifUser(key, yes, no) {
	// If a user with this key exists

	users.findOne({key:key}, function(err, row) {
		if (err) throw err;
		else if (row) {
			yes(row);
		}
		else {
			no();
		}
	});
}

var connected = {};

net.createServer(function(socket) {
	// Main socket server

	on = {}; // Used to store action methods

	on['new'] = function(data) {
		// New chat initiated

		var key = data[0];
		var from = data[1];
		var message = data.slice(2,data.length).join(" ");

		ifUser(key, function(user) {
			// New chat validated

			console.log("New chat initiated!");
		}, function() {
			console.log("Chat init from unknown source.");
		});
	};

	on['recieve'] = function(data) {
		// Message recieved from someone

		var key = data[0];
		var from = data[1].split(":")[1];
		var message = data.slice(2,data.length).join(" ");
		
		ifUser(key, function(user) {
			var toSend = {
				from: from,
				message: message
			};
			if (connected[key]) { // Just incase
				connected[key].emit("recieve", toSend);
			}
			else {
				pending.insert({
					key: key,
					data: toSend
				});
				console.log("Added message to pending db");
			}
		}, function() {
			console.log("Unknown key:",key);
		});
	};


	on['register'] = (function(data) {
		// Crete user
		// Responds with new auth-key

		var email = data[0];
		var password = sha256(data[1]); // Encrypt for security
		var address = data[2];

		users.findOne({email: email}, function(err, row) {
			// Query for if email exists

			if (!row) { // The user doesnt exist
				randKey(function(key) {
					// Add user to database
					users.insert(
					{
						email: email,
						password: password,
						key: key,
						ip: address
					}
					);
					socket.write(key);
				});
			}
			else {
				socket.write("-4");
			}
		});
	});

	on['delete'] = function(data) {
		// Deletes user

		var email = data[0];
		var password = sha256(data[1]);
		var address = data[2];

		users.remove({email:email,password:password,ip:address}, function(err) {
			if (err) throw err;
		});		
	};

	on['login'] = function(data) {
		// Login user
		// Responds with auth-key

		var email = data[0];
		var password = sha256(data[1]);
		
		users.findOne({email:email,password:password}, function(err, row) {
			if (row) {
				// The key exists

				socket.write(row.key);
			}
			else {
				socket.write("-4");
			}
		});
	};

	socket.on('data', function(data) {
		// Data recieved from socket

		data = data.toString().split(" ");

		if (data.length < 3) {
			socket.write("-1");
			return;
		}

		var identifier = data[0];

		var use = false;

		for (var key in on) {
			if (key == identifier && key != "") {
				use = true;
				break;
			}
		}

		if (!use) {
			socket.write("-3");
			return;
		}
		
		on[identifier](data.slice(1,data.length));

	});
}).listen(1337);

io.sockets.on('connection', function(socket) {
	socket.on("auth", function(key) {
		connected[key] = socket;
		socket.key = key;

		pending.find({key:key}).toArray(function(err, rows) {
			for (var i = 0; i < rows.length; i++) {
				socket.emit("recieve", rows[i].data);
			}
		});
	});
	socket.on("login", function(data) {
		users.findOne({email:data.email,password:sha256(data.password)}, function(err, row) {
			if (row) {
				// The key exists

				socket.emit("login", row.key);
			}
			else {
				socket.emit("login", false);
			}
		});
	});
	socket.on('send', function(data) {
		ifUser(data.key, function(user) {
			// Send data to client server

			try {
				var s = net.Socket();
				s.connect(1336,user.ip);
				s.write(user.key+" "+data.to+" "+data.message);
				s.end();
			}
			catch (ETIMEDOUT) {
				console.log("Client server connection error!");
			}
			socket.emit("send","0"); // Emit for good measure
		}, function() {
			socket.emit("send","-2");
		});
	});
	socket.on('disconnect', function() {
		connected[socket.key] = undefined; // Remove user from connected
	});
});

server.listen(1338);