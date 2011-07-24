// A JSModule
var jsFiles = require('./js-file.js');
var fs = require('fs');

var modules = [];

var JSModule = function(name, path, broker){
	
	this.name = name;
	this.path = path;
	this.enabled = false; // disabled by default
	this.clean = 1; // clean by default;
	this.files = {};
	this.fileCount = 0;
	this.broker = broker;
	this.updates = 0;

	this.broker.emit('jsModule added', this);

	return this;

};

JSModule.prototype = {
	
	enable : function(){
		
		this.enabled = true;

		var that = this;

		setTimeout(function(){
			
			that.doScan();

		}, 0);

		// do initial jslint check...

		// begin scanning...

	},

	disable : function(){
		
		this.enabled = false;

		// stop scanning files process...
	},

	scanModuleForChanges : function(){
		
		var property, that = this;

		var updateFile = function(file){
				
			return function(status){
				
				// we only bother doing anything if there's a problem
				if(status===0){
					
					that.files[file].test( function( status ){
						
						that.fileStatusUpdated(file, status);

					});

				}

			};

		};

		for(property in this.files){

			
			this.files[property].checkForUpdate( updateFile(property) );

		}

	},

	doScan : function(){

		var that = this;

		this.scanModuleForChanges();
		

		if(this.enabled){
			
			setTimeout(function(){
				
				that.doScan();

			}, 100);

		}

	},

	registerFile : function(file){
		
		this.files[file] = jsFiles.createFile(file);

		this.broker.emit("jsFile added to module", {module : this, file : this.files[file]});

		this.fileCount++;

		return this;

	},

	fileStatusUpdated : function(file, status){
		
		// don't actually need the status, do we?

		var property, moduleStatus = 1; // presume clean

		for(property in this.files){
			
			if(this.files[property].clean===0){
			
				moduleStatus = 0;

			}

		}

		if(moduleStatus!==this.clean){

			this.clean = moduleStatus;

			this.broker.emit("module status changed", this);


		}

		if(status==="changed"){
			
			this.broker.emit("file status changed", {module: this, file : this.files[file]});

		}

	},

	listFiles : function(){
		
		var files = [], property;

		for(property in this.files){
		
			files.push(this.files[property].fileName);

		}

		return files;

	},

	query : function(){
	
		var result = {
			name : this.name,
			status : this.clean ? "clean" : "dirty",
			enabled : this.enabled ? "enabled" : "disabled",
			path : this.path,
			fileCount : this.fileCount,
			links : [
				{
					rel : "module/enable",
					uri : "modules/" + this.name + "/enable"				
				},
				{
					rel : "module/disable",
					uri : "modules/" + this.name + "/disable"				
				},
				{
					rel : "module/view-files",
					uri : "modules/" + this.name + "/files.json"

				},
				{
					rel : "module/poll-for-updates",
					uri : "modules/" + this.name + "/poll-for-updates.json"

				}
			]

		};

		return result;

	},

	getFullStatus : function(){
		
		var result = {
			name : this.name,
			status : this.clean ? "clean" : "dirty",
			enabled : this.enabled ? "enabled" : "disabled",
			path : this.path,
			fileCount : this.fileCount,
			update : this.updates,
			links : [
				{
					rel : "module/enable",
					uri : "modules/" + this.name + "/enable"				
				},
				{
					rel : "module/disable",
					uri : "modules/" + this.name + "/disable"				
				},
				{
					rel : "module/view-files",
					uri : "modules/" + this.name + "/files.json"

				},
				{
					rel : "module/poll-for-updates",
					uri : "modules/" + this.name + "/poll-for-updates.json"

				}
			]

		};

		result.files = [];

		var i;

		for(i in this.files){
			
			result.files.push(this.files[i].query());

		}

		return result;

	},

	queryFiles : function(){
	
		var results = [];

		var i;

		for(i in this.files){
			
			results.push(this.files[i].query());

		}

		return results;

	},

	testFiles : function(){
		
		var that = this;

		var property;

		var updateFile = function( file ){
				
				return function(status){
					
					that.fileStatusUpdated(file, status);

				};

			};

		for(property in this.files){
			
			this.files[property].test( updateFile(property) );

		}

	}

};

var createModule = function(name, path, broker){

	return new JSModule(name, path, broker);

};

exports.createModule = createModule;

var traverseFileSystem = function(currentPath, broker){
	
	var moduleName = currentPath, i;

	if(moduleName==="."){
		
		moduleName="root";

	}else{
		
		moduleName = moduleName.replace("./", "root/");

	}

	if(!modules[moduleName]){

		modules[moduleName] = createModule(moduleName, currentPath, broker);

	}

	var files = fs.readdirSync(currentPath);

	for(i in files){
		
		var currentFile = currentPath + '/' + files[i];

		var stats = fs.statSync(currentFile);

		if(stats.isFile()){
			
			if(/\.js$/.test(currentFile)){
			
				modules[moduleName].registerFile(currentFile);	

			}
			
		}else if(stats.isDirectory()){
			
			traverseFileSystem(currentFile, broker);

		}

	}

};

exports.findAndCreateModules = function(path, broker){

	traverseFileSystem(path, broker);

	broker.emit('modules initialised', {});

	return modules;

};