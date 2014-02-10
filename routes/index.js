
/*
 * GET home page.
 */

var https = require('https');
var options = {
	hostname: 'www.ingtfi.pl',
	port: 443,
	path: '/fundusze-akcji/ing-akcji?action=quotes.getQuotesCsv&unitCategoryId=1&fundIds=1&startDate=2010-02-05&endDate=2014-02-05',
	method: 'GET',
	rejectUnauthorized:false,
	strictSSL:false  
};

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
	getData(options, function(code, series, error){
		if(error != null) {
			res.send(404);
		} else {
			res.set('Content-Type', 'application/javascript');
			res.send(200, series);
		}
	});
}

exports.index = function(req, res){
	res.render('index', {});		
};