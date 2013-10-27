/**
 * Basic web server.
 */

var express = require("express");
var app = express();

// Configure express
app.use(express.logger());

// Static assets
app.use(express.static(__dirname + '/feeds'));

// Default server
app.get('/', function(request, response) {
  response.send('Feeding CARs.');
});

// Start server with port
var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log('Listening on port ' + port);
});