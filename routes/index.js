
/*
 * GET home page.
 */

var https = require('https');
var async = require('async');

var getData = function(options, callback) {
	var data = '';
	var ing = https.request(options, function(res1){
		res1.on('data', function(chunk) {
    		data += chunk;
	  	});	
		res1.on('end', function(d) {
			console.log(res1.headers['content-type']);
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
				        	series.data.push([ms,parseFloat(items[1])]);
			        	}
			        } else {
			        	series.name = items[1].replace(/^.*dla /gi, "");
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

exports.data = function(req, res){
	var seriesOptions = [];
	var errors = [];
	
	async.series([
            function(callback){ 
            	getData('https://www.ingtfi.pl/fundusze-akcji/ing-akcji?action=quotes.getQuotesCsv&unitCategoryId=1&fundIds=1&startDate=2013-02-06&endDate=2014-02-06', function(code, series, error){
            		if(error != null) {
            			errors.push(error);
            			callback(error);
            		} else {
            			seriesOptions.push(series);
            			callback(null);
            		}
            	});
            },
            function(callback){
            	getData('https://www.ingtfi.pl/fundusze-gotowkowe/ing-gotowkowy?action=quotes.getQuotesCsv&unitCategoryId=1&fundIds=8&startDate=2013-02-06&endDate=2014-02-06', function(code, series, error){
            		if(error != null) {
            			errors.push(error);
            			callback(error);
            		} else {
            			seriesOptions.push(series);
            			callback(null);
            		}
            	});	                	
            },
            function(callback){
            	getData('https://www.ingtfi.pl/fundusze-akcji/ing-japonia?action=quotes.getQuotesCsv&unitCategoryId=1&fundIds=27&startDate=2013-02-06&endDate=2014-02-06', function(code, series, error){
            		if(error != null) {
            			errors.push(error);
            			callback(error);
            		} else {
            			seriesOptions.push(series);
            			callback(null);
            		}
            	});	                	
            }
        ], function(){
		if(errors.lenght > 0) {
			res.send(404);
		} else {
			res.set('Content-Type', 'application/javascript');
			res.send(200, seriesOptions);										
		}		
	});	
};

exports.index = function(req, res){
	res.render('index', {});		
};