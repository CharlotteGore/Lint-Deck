var s = require('./static-handler');
var qs = require('querystring');
var url = require('url');

var getRoutes = {
	
	// static routes
	"/" : s.staticHandler("./lint-deck/index.html"),
	"/jquery.js" : s.staticHandler("./Lib/jquery-1.4.4.js"),
	"/lint-deck.css" : s.staticHandler("./lint-deck/lint-deck.css"),
	"/client.js" : s.staticHandler("./lint-deck/client.js"),

	"/module/**" : function(req, res, module){
		
		if(module==="root"){
			
			module = "root";

		}

		if(global.modules[module]){
			
			s.jsonize(global.modules[module].query(), res);

		}else{
			
			s.fourOhFour(res);

		}


	},

	"/modules/**/poll-for-updates.json" : function(req, res, module){
		

		if(module==="root"){
			
			module = "root";

		}

		if(global.modules[module]){

			if(qs.parse(url.parse(req.url).query).since < global.modules[module].lastUpdate){
				
				s.jsonize(global.modules[module].getFullStatus(), res);

			}else{

				global.requests.push({
					module : module,
					timestamp : (new Date()).getTime(),
					callback : function(data){

						s.jsonize(data, res);				

					}

				});

			}


		}else{
			
			s.fourOhFour(res);

		}


	},

	"/modules/status.json" : function(req, res){
		
		var i, module, results = [];

		for(i in global.modules){
			
			module = global.modules[i];
			results.push(module.query());

		}

		s.jsonize(results, res);

	},

	"/modules/**/files.json" : function(req, res, module){
		
		if(module==="root"){
			
			module = "root";

		}

		if(global.modules[module]){
			
			s.jsonize(global.modules[module].queryFiles(), res);

		}else{
			
			s.fourOhFour(res);

		}
	},


	"/modules" : function(req, res){
		
		var i, results = [], module;

		for(i in global.modules){
			
			module = global.modules[i];

			results.push(module.query());

		}

		s.jsonize(results, res);
	}


};

var putRoutes = {

	"/modules/**/enable" : function(req, res, module){
		
		if(module==="root"){
			
			module = "root";

		}

		if(global.modules[module]){

			global.modules[module].enable();
			
			s.jsonize({ module : module, status : "enabled"}, res);

		}else{
			
			s.fourOhFour(res);

		}

	},

	"/modules/**/disable" : function(req, res, module){
		
		if(module==="root"){
			
			module = "root";

		}

		if(global.modules[module]){

			global.modules[module].disable();
			
			s.jsonize({status : "ok"}, res);

		}else{
			
			s.fourOhFour(res);

		}

	}

};

exports.getRoutes = function(){
	
	return getRoutes;

};

exports.putRoutes = function(){
	
	return putRoutes;

};