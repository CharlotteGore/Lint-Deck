var fs = require('fs');
var JSLINT = require('./jslint').jslint();

exports.checkFile = function(file, callback){

	var errors = [];
	
	fs.readFile(file, 'utf8', function(err, data){
			
		if(err){
			throw err;
		}

		if(data.charCodeAt(0)===65279){

			data = data.substr(1);			

		};

		var result = JSLINT(data, {evil: true, forin: true, maxerr: 100});

		var found = 0, w;

		var ok = {
			"Use '===' to compare with 'null'.": true,
			"Use '!==' to compare with 'null'.": true,
			"Expected an assignment or function call and instead saw an expression.": true,
			"Expected a 'break' statement before 'case'.": true
		};

		JSLINT.errors.forEach(function( complaint ){
				
				if(complaint){

					if(!ok[complaint.reason]){

						found++;

						errors.push(complaint);

					} 

				}


			});

					
			callback(errors);

		});


		JSLINT.errors = [];

	};

