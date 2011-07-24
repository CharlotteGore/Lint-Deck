var JSLINT = require('./jslint-check');
var fs = require('fs');

var JSFile = function(file){
	
	this.fileName = file;
	this.clean = 1; // clean by default
	this.errors = [];
	this.scanned = false;
	this.stats = {size : 0, mtime : '1st January 1999'};

	return this;

};

JSFile.prototype = {
	
	status : function(){
		
		return this.clean;

	},

	test : function( callback ){

		var clean, that = this;
		
		JSLINT.checkFile(this.fileName, function(errors){
			
			if(errors.length > 0){
				clean = 0;
				that.errors = errors;

			}else {
				
				clean = 1;

			}

			if(clean!==this.clean){
				
				that.clean = clean;

				callback("changed");

				if(clean!==0){
					console.log(that.fileName + " is now clean");
					that.errors = [];
				}else{
					
					console.log(that.fileName + " is now dirty");

				}

			}else{
				
				callback("no change");

			}


			that.scanned = true;

		});

		return this;

	},

	checkForUpdate : function( callback ){
		
		var that = this;

		fs.stat(this.fileName, function(err, stats){
			
			if(err){
				throw err;
			}

			if(that.stats.size!==stats.size){
				
				that.stats = stats;
				callback(0);

			}else if( (new Date(that.stats.mtime)).getTime() !== (new Date(stats.mtime)).getTime() ){

				that.stats = stats;
				callback(0);

			}else{

				callback(1);

			}

		});

	},

	query : function(){
		
		var result = {
			
			name : this.fileName,
			status : this.clean ? "clean" : "dirty",
			size : this.stats.size,
			modified : (new Date(this.stats.mtime)).getTime()

		};

		if(this.scanned===false){
			
			result.status = "unknown";
		}

		if(this.errors.length > 0){
			
			result.errors = this.errors;

		}

		return result;

	}

};

exports.createFile = function(file){
	
	return new JSFile(file);

};