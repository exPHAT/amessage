// aMessage test client
// Used to run whatever command to the server

var net = require('net');

var s = net.Socket();
s.connect(1337,"exphat.com");
s.write("register exphat PASSWORD_ZY3OMnlx IP_HVx&ljCV");
s.on('data', function (data) {
	console.log(data.toString());
	s.end();
});
