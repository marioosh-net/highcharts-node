
/*
 * GET home page.
 */

var https = require('https');
var async = require('async');
var fs = require("fs");
var urlp = require('url');

/**
 * save settings into settings.json
 */
var writeSettings = function(settings, callback){
	fs.writeFile('./settings.json', JSON.stringify(settings,null,2), "utf8", callback);	
};

/**
 * get CSV stock data, parse and produce JSON
 */
var getData = function(options, callback) {
	
	var parsed = urlp.parse(options.url);
	parsed.rejectUnauthorized = false;
	parsed.strictSSL = false;

	var ing = https.request(parsed, function(res1){
		var data = '';
		res1.on('data', function(chunk) {
    		data += chunk;
	  	});	
		res1.on('end', function(d) {
			// console.log(res1.headers['content-type']);
			if(res1.statusCode != '200') {
				callback(res1.statusCode);
			} else {
				var lines = data.split('\n');
	            var series = {
	                data: []
	            };
				var lineNo = 0;
	            lines.forEach(function (line) {
	            	var items = line.split(',');
			        if (lineNo != 0) {
			        	if(items[0] != '') {
							var date = new Date(items[0]); // some mock date
							var ms = date.getTime();
							var w = parseFloat(items[1]);
							if(options.lj != null) {
								w = w * options.lj; 
							}							
				        	series.data.push([ms,w]);
			        	}
			        } else {
			        	if(options.name != null) {
			        		series.name = options.name;
			        	} else {
			        		series.name = items[1].replace(/^.*dla /gi, "");
			        	}
			        }            	
	            	lineNo++;
	            });
				callback(200, series);
			}
		});	  	  	
	});	
	ing.end();
	ing.on('error', function(err){
		console.log(err);
		callback('503', null, err);
	});
};

/**
 * call getData with urls readed from settings.json
 * return JSON to use with Highcharts
 * used in index template ($.getJSON...)
 */
exports.data = function(req, res){
	var seriesOptions = [];
	var errors = [];
	
	var lj = req.query.lj; // lj
	var ch = req.query.ch; // checked
	
	/**
	 * load urls from settings.json
	 * and create array of functions to get data from that urls
	 */
	var series = [];
	var settings = require('../settings.json');
	if(settings.urls != null) {
		settings.urls.forEach(function (u,index) {
			if(ch == null || ch[index] == 1) {
				series.push(function(callback){
					var lj1 = 1;
					if(lj != null && lj[index] != null) {
						lj1 = lj[index];
					}
	            	getData({url:u.url, name:u.name, lj: lj1}, function(code, series, error){
	        		if(error != null) {
	        			errors.push(error);
	        			callback(error);
	        		} else {
	        			seriesOptions.push(series);
	        			callback(null);
	        		}
	        	    });				
				});
			}
		});
	}	
	
	/**
	 * call getData functions in series
	 */
	async.series(series, function(){
		if(errors.lenght > 0) {
			res.send(404);
		} else {
			res.set('Content-Type', 'application/javascript');
			res.send(200, seriesOptions);										
		}		
	});	
};

/**
 * render index
 * with list of urls 
 */
exports.index = function(req, res){
	var settings = require('../settings.json');
	res.render('index', {
		urls:settings.urls
	});		
};

/**
 * add url to settings.json
 */
exports.addurl = function(req, res) {
	var settings = require('../settings.json');
	
	/**
	 * post params
	 */
	var url = req.body.url;
	var name = req.body.name;
	
	var exists = false;
	if(settings.urls != null) {
		settings.urls.forEach(function (u) {
			if(url == u.url) {
				exists = true;
			}
		});
	}
	if(exists == false) {
		if(settings.urls == null) {
			settings.urls = [];
		}
		settings.urls.push({url:url,name:name});
	}	
	writeSettings(settings, function(){
		res.redirect('/');
	});
};

/**
 * delete url from settings.json
 */
exports.delurl = function(req, res) {
	var settings = require('../settings.json');
	var url = req.body.url;
	if(settings.urls != null) {
		var i = 0;
		settings.urls.forEach(function (u) {
			if(url == u.url) {
				exists = true;
				settings.urls.splice(i,1);
			}
			i++;
		});
	}	
	writeSettings(settings, function(){
		res.redirect('/');
	});		
};