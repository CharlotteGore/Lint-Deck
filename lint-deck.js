HOST = null;
PORT = 8001;

var fs = require('fs'),
	events = require('events'),
	jsModule = require('./lint-deck/js-module'),
	url = require('url'),
	sq = require('querystring'),
	http = require('http'),
	getRoutes = require('./lint-deck/routes').getRoutes(),
	putRoutes = require('./lint-deck/routes').putRoutes(),
	router = require('./lint-deck/choreographer').router();

global.userPath = process.argv[2] || '.';


var startTime = (new Date()).getTime();

var broker = new events.EventEmitter();

global.modules = [];
global.requests = [];

setInterval(function(){
	
	var now = (new Date()).getTime();

	while(global.requests.length > 0 && now - global.requests[0].timestamp > 30 * 1000){

		global.requests.shift().callback([]);

	}

}, 3000);

var registerRoutes = function(){
	
	var i;

	for(i in getRoutes){
		
		router.get(i, getRoutes[i]);

	}

	for(i in putRoutes){
		
		router.put(i, putRoutes[i]);

	}



};

var lintDeck = function(){
	
	global.modules = jsModule.findAndCreateModules(global.userPath, broker);

	var i;

	for(i in global.modules){
		
		if(global.modules[i].fileCount===0){
			
			delete global.modules[i];

		}

	}

	//global.modules['root'].enable();

	// here's where we set up something to 
	broker.on("file status changed", function(message){

		var i;
		var module = message.module;
		var file = message.file;

		for(i = 0;i < global.requests.length;i++){
			
			if(global.requests[i].module===module.name){

				global.requests[i].callback(module.getFullStatus());
				global.requests.splice(i, 1);

			}

		}

	});


	registerRoutes();

	http.createServer(router).listen(PORT);

	console.log("Listening on 127.0.0.1:" + PORT);


};


lintDeck();



/*

/modules

	lists modules

/module/files

	lists all files in all mo


*/