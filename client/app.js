// aMessage client
// Aaron Taylor
//
// This script is used to recieve messages from the server
// and relay them to the iMessage client.
// 
// TODO:
// Prevent send injection


var net = require('net');
var express = require('express');
var run = require('child_process').exec;

// Constants
var keyLength = 32;
var compareKey = "AUTH_KEY_!$qN8jd@";

// Open port map so we dont have to port forward
run("open ./Port\\ Map.app", function(err, something) {
	if (err) throw err; // Script error
})

// Start the messages app
run("osascript ./start.applescript", function(err, something) {
	if (err) throw err; // Script error
});


function parseData(data) {
	// Parses the data into sections

	var sndSpace = data.slice(33,data.length).indexOf(" "); // After phone number

	var key = data.slice(0,keyLength); // Auth key
	var to = data.slice(keyLength+1,keyLength+1+sndSpace); // Phone number
	var message = data.slice(keyLength+2+sndSpace,data.length);
	
	return {key:key,to:to,msg:message};
}

net.createServer(function(socket) {
	// Main socket server

	socket.on('data', function(data) {
		// Data recieved from socket

		data = parseData(data.toString());
		if (data.key === compareKey) {
			run("./send.sh " + data.to + " \"" + data.msg + "\""); // Send message out
		}
	});
}).listen(1336);
