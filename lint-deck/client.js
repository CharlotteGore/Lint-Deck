var modules = {};

var File = function(){ return this; };


File.prototype = {
	
	registerFile : function(file, jq){
		
		var statusText;

		if(file.status==="dirty"){

			statusText = file.errors.length + " errors";
			

		}else if(file.status==="unknown"){
			
			statusText = "Not yet scanned.";

		}else{
			
			statusText = "No errors";

		}
		
		this.container = $('<div class="file unknown"><h4>' + file.name + '</h4></div>');
		this.errors = $('<div class="errors-container"></div>');
		this.statusText = $('<p></p>');

		this.container.append(this.statusText)
			.append(this.errors);

		jq.append(this.container);

		this.updateStatus( file );

		return this;

	},

	updateStatus : function( data ){
		
		var that = this;
		// update the visual display of it here, somehow.
		if(data.status==="clean"){
			
			this.container.addClass('clean').removeClass('dirty').removeClass('unknown');
			this.statusText.text('No errors');
			this.errors.empty();

		}else if(data.status==="dirty"){
			
			this.container.addClass('dirty').removeClass('clean').removeClass('unknown');
			this.statusText.text(data.errors.length + " errors");

			that.errors.empty();

			data.errors.forEach(function(error){
				
			var evidence = [];
				if(error.evidence){

					evidence[0] = error.evidence.substr(0, error.character);
					evidence[1] = error.evidence.substr(error.character, 1) ;
	 				evidence[2] = error.evidence.substr(error.character + 1) ;

 				 	evidence = evidence[0] + '<span class="error-point">' + evidence[1] + '</span>' + evidence[2];
 				}else{
 					
 					evidence = "";

 				}




				var html = '<div class="error">';
					html+= '<p class="evidence">';
					html+= '<span class="line-number">' + error.line + '</span>';
					html+= '<code>' + evidence + '</code>';
					html+= '</p>';
					html+= '<p class="reason">Problem at line ' + error.line + ' character ' + error.character + ': ' + error.reason +'</p>';
						   

				var element = $(html);
				that.errors.append(html);

			});

		}else{
			
			this.statusText.text("Not yet scanned");

		}
	}

};

var Module = function(){ 

	this.timeoutId = -1;
	this.files = {};
	this.lastUpdate = -1;
	return this; 

};

Module.parseLinks = function(links){
		
		var parsed = {};

		links.forEach(function(link){
			
			switch(link.rel){
				
				case "module/enable" :
					parsed["enable module"] = link;
				case "module/disable" : 
					parsed["disable module"] = link;
				case "module/view-files" :
					parsed["view files"] = link;
				case "module/poll-for-updates" :
					parsed["update polling"] = link;

			}

		});

		return parsed;

	};


Module.prototype = {
	
	registerModule : function(module, jq){
		
		var that = this;

		this.timeoutId = -1;
		this.hasFiles = false;

		// copy the data to this
		$.extend(this, module);

		// parse the links..
		this.links = Module.parseLinks(module.links);

		if(module.name==="root"){
			
			module.name="/";

		}


		this.moduleHTML = $('<div class="module ' + module.enabled + ' ' + module.status + '"><h3>' + module.name + '</h3></div>');

		var detailHTML = $('<div class="module-details">Scripts in this module: '+ module.fileCount + '</ul>');

		var controlsHTML = $('<div class="module-controls"></div>');
		this.filesHTML = $('<div class="files-container"></div>');

		$.ajax({
				url : that.links["view files"].uri,
				type : "GET",
				success : function(data, status, res){
					
					data.forEach(function(file){

						that.files[file.name] = new File();
						that.files[file.name].registerFile(file, that.filesHTML);

						});
					

				}

		});

		this.moduleHTML.append(detailHTML)
			.append(controlsHTML)
			.append(this.filesHTML);

		this.filesHTML.hide();


		jq.append(this.moduleHTML);

		this.moduleHTML.bind('click', function(e){
			
			if(that.filesHTML.is(':hidden')){

				that.enable();

			}else{
				
				that.disable();

			}

			that.filesHTML.toggle();
			
			e.preventDefault();

		});




		if(module.enabled==="enabled"){
			
			this.enable();

		}else{


		}

	},

	drawModuleView : function(){
		

	},

	enable : function(e){

		var that = this;

		if(this.enabled==="disabled"){

			this.enabled = "enabled";
			
			// begin the long polling to check for changes, and send an enable request.
			that.requestUpdate();

			$.ajax({
					url : this.links["enable module"].uri,
					type : "PUT",
					success : function(data, status, res){

						that.moduleHTML.addClass('enabled').removeClass('disabled');

						that.filesHTML.show();


					}

				});

		}


	},

	disable : function(){
		
		var that = this;
		this.enabled = "disabled";
		// disable the long polling

		// send the disable request
		$.ajax({
			url : this.links["disable module"].uri,
			type : "PUT",
			success : function(data, status, res){

				that.moduleHTML.addClass('disabled').removeClass('enabled');

				that.filesHTML.hide();

			}

		});

	},

	requestUpdate : function(){

		var that = this;

		$.ajax({
			url : this.links["update polling"].uri + "?since=" + this.lastUpdate,
			type : "GET",
			success : function(data, status, res){
				
				that.processUpdate(data);

			}

		});

	},

	processUpdate : function(data){
		
		var that = this;

		if(data.status){

			this.lastUpdate = data.lastUpdate;

			if(data.status==="clean"){
				
				this.moduleHTML.removeClass('dirty').addClass('clean');
				//this.filesHTML.hide();

			}else{

				this.moduleHTML.removeClass('clean').addClass('dirty');
				this.filesHTML.show();

			}

			data.files.forEach(function(file){
				
				that.files[file.name].updateStatus(file);

			});

		}

		if(this.enabled){

			setTimeout(function(){
				

				that.requestUpdate();

			},100);

		}

	}

};

$(document).ready(function(){

	$('#content').delegate('a[rel="app/hide-inactive-modules"]', 'click', function(e){
		
		e.preventDefault();

		$('div.module.disabled').hide();

	}).delegate('a[rel="app/show-modules"]', 'click', function(e){
		
		e.preventDefault();

		$('div.module.disabled').show();

	});

	$.ajax({
		
		url : "/modules",
		success : function(data, status, request){
			
			data.forEach(function(module){

				if(!modules[module.name]){
					
					modules[module.name] = new Module().registerModule(module, $('#content'));

				}


			});
		}

	});

});