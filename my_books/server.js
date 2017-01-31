#!/usr/bin/env node
/**
 * Book REST server
 * @author beaver@gadan
 * @version 0.0.5
 */
var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var fs = require('fs');
const csv=require('csvtojson');
var opts = {
 	noheader: true,
    headers: ["id","isbn","ean","ts","date","desc"],
	flatkeys: true
};
var g_books = require('./modules/g_books');

var config = require('./config.js');

var csv_folder = "./csv/";
var csv_folder_done = "./csv/done/";
var db_folder = "./db/";

var app = express();

// static files
app.use('/web', express.static('web'));

/**
 * http methods routing
 */
app.get(api_context+':method', function (req, res) {
    var method = req.params.method;
	var resp, def_p, status = 200;
    console.log('GET: ', req.url, req.query);
	api_get(req, res, method, resp, def_p, status);
});

// create application/json parser
var jsonParser = bodyParser.json()

app.post(api_context+':method', jsonParser, function (req, res) {
    var method = req.params.method;
	var resp, status = 200;
	console.log('POST: ', method, req.url, req.query, "\n\tbody:", req.body);
	api_post(req, res, method, resp, jsonParser, status);
});

function api_get(req, res, method, resp, def_p, status) {
    switch (method) {
		case "listApi":
			status = 200;
			var g = getApis(api_get), h = getApis(api_post);
			resp = {"get": g, "post": h};
			response_result(res, status, resp);
		break;
		case "backupMyBooks":
			backupDb("books");
			status = 200;
			resp = {db: "books"};
			response_result(res, status, resp);
		break;
		case "parseAddBooks":
/* 			fs.readdir(csv_folder, (err, files) => {
				files.forEach(file => {
					console.log("parseAddBooks: file=", file);
					convCSVtoDB(file, function (json) {
						console.log('>json:', json);
						// TODO update books
					}); 
				});
			}) */
			
			var files = fs.readdirSync(csv_folder);
			var path = require('path');
			var t = [], db2 = [], nr = 0;
			for(var i in files) {
			   if(path.extname(files[i]) === ".csv") {
					t.push(files[i]);
					nr++;
			   }
			}
			if (nr>0) {
				backupDb("books");
				for(var i in t) {
					console.log("parseAddBooks: file["+i+"]=", t[i]);
					(function (i) {
						convCSVtoDB(csv_folder+t[i], function (json, file) {
							// move csv to done folder
							fs.renameSync(file, file.replace(csv_folder, csv_folder_done));
							db2.push.apply(db2, json);
							if (i==nr-1) {
								console.log('>db to add:', db2.length);
								// update books
								var bks = readFromDb("books");
								console.log('>db old:', bks.db.length);
								bks.db.push.apply(bks.db, db2);
								bks.len = bks.db.length;
								saveToDb(bks, "books");
								console.log('>db new:', bks.db.length);
								status = 200;
								resp = {op: "csv add books", nr_files: nr, files: t};
								response_result(res, status, resp);
							}
						});
					})(i);
				}
			} else {
				status = 200;
				resp = {op: "csv add books", nr_files: 0};
				response_result(res, status, resp);
			}
		break;
		case "parseAllBooks":
			backupDb("books");
			const csvFilePath = csv_folder+'merged.txt';
			convCSVtoDB(csvFilePath, function (db) {
				status = 200;
				resp = {len: db.length, db: db};
				saveToDb(resp, "books");
				response_result(res, status, resp);
			});
		break;
        case "getMyBooks":
			var id = req.query.isbn;
			var t = req.query.title || false;
			var a = req.query.author || false;
			try {
				resp = readFromDb("books");
				if (id) {
					resp = getBook(id, resp);
					if (!resp)
						resp = {len: 0, db: []}
					else
						resp = {len: 1, db: [resp]}
				} else if (t!=false || a!=false) {
					resp = searchBooks(t, a, resp);
				} else {
					resp = {};
				}
				status = 200;
			} catch (e) {
				console.log("getMyBooks:",e);
				resp = { cap: e };
				status = 404;
			}
            response_result(res, status, resp);
            break;
        case "getMaxOrdMyBooks":
			try {
				var bks = readFromDb("books"), max = 0, hasOrd = 0;
				for(var i = 0; i<bks.len; i++){
					if (bks.db[i].ord) {
						max = Math.max(bks.db[i].ord, max);
						hasOrd++;
					}
				}
				resp = {len: bks.len, hasOrd: hasOrd, max: max};
				status = 200;
			} catch (e) {
				console.log("getMyBooks:",e);
				resp = { cap: e };
				status = 404;
			}
            response_result(res, status, resp);
            break;
        case "checkMyBooks":
			/* try { */
				var bks = readFromDb("books");
				resp = [];
				var nr = 0;
				for(var i = 0; i<bks.len; i++){
					if (bks.db[i].desc=="") nr++;
				}
				for(var i = 0; i<bks.len; i++){
					var b = bks.db[i];
					if (b.desc=="") {
						var c = clone(b);
						c.search = "https://www.google.it/webhp?sourceid=chrome-instant&ion=1&espv=2&ie=UTF-8#q=isbn+"+b.isbn;
						c.search0 = g_books.url_google2+b.isbn;
						c.search1 = g_books.url_google+b.isbn;
						c.search2 = g_books.url_isbndb+b.isbn;
						c.search3 = g_books.url_biblio+b.isbn;
						c.search4 = g_books.url_ibs+b.isbn;
						resp.push(c);
						(function (b) {
							g_books.get(b.isbn, function (resp) {
								if(resp.body) {
									nr--;
									if (resp.body.totalItems>=1) {
										console.log(nr+">FOUND: ",resp.body);
										b.title = resp.body.book.title;
										b.author = resp.body.book.author;
										b.desc = b.title + " ["+b.author+"]";
									} else {
										console.log(nr+">NOT FOUND: ",resp.body);
									}
									if (nr==0) {
										// all responses received
										console.log(">END");
										// update db
										saveToDb(bks, "books");
									}
								}
							});						
						})(b)
					}
				}
				status = 200;
/* 			} catch (e) {
				console.log("checkMyBooks:",e);
				resp = { cap: e };
				status = 404;
			} */
            response_result(res, status, resp);
            break;
        case "updateMyBooks":
			try {
				var bks = readFromDb("books");
				resp = [];
				var nr = 0;
				for(var i = 0; i<bks.len; i++){
					if (bks.db[i].title==undefined) nr++;
				}
				if (nr==0) {
					resp = { cap: "already updated" };
					status = 200;
					response_result(res, status, resp);
				} else {
					for(var i = 0; i<bks.len; i++){
						var b = bks.db[i];
						if (b.title==undefined) {
							(function (b) {
								g_books.get(b.isbn, function (resp) {
									if(resp.body) {
										nr--;
										if (resp.body.totalItems>=1) {
											console.log(nr+">FOUND: ",resp.body);
											b.title = resp.body.book.title;
											b.author = resp.body.book.author;
											if (!b.desc) b.desc = b.title + " ["+b.author+"]";
										} else {
											console.log(nr+">NOT FOUND: ",resp.body);
										}
										if (nr==0) {
											// all responses received
											console.log(">END");
											// update db
											saveToDb(bks, "books");
											status = 200;
											response_result(res, status, bks);
										}
									}
								});						
							})(b)
						}
					}
				}
			} catch (e) {
				console.log("updateMyBooks:",e);
				resp = { cap: e };
				status = 404;
				response_result(res, status, resp);
			}
            
            break;
        case "editMyBook":
			var id = req.query.isbn;
			var t = req.query.title;
			var a = req.query.author;
			try {
				var bks = readFromDb("books");
				if (id) {
					status = 200;
					var i = getBook(id, bks, true);
					if (i) {
						bks.db[i].author = a;
						bks.db[i].title = t;
						bks.db[i].desc = t+" ["+a+"]";
						saveToDb(bks, "books");
						status = 200;
						resp = { cap: "ok modified", book: bks.db[i]};
					} else {
						status = 404;
						resp = { cap: "book not found"};
					}
				} else {
					status = 200;
					resp = { cap: "no book selected"};
				}
				
			} catch (e) {
				console.log("editMyBook:",e);
				resp = { cap: e };
				status = 404;
			}
            response_result(res, status, resp);
            break;
        case "getIsbn":
			var id = req.query.isbn;
			var ty = req.query.ty;
			if (!id) id=0;
			if (!ty) ty=0;
			try {
				resp = {};
				g_books.get(id, function (resp) {
					status = resp.status;
					response_result(res, status, resp);
				}, ty);
			} catch (e) {
				console.log("getIsbn:",e);
				resp = { cap: e };
				status = 404;
				response_result(res, status, resp);
			}
            break;
        default:
            resp = {};
            resp.cap = 'method Not Found';
            response_result(res, 404, resp);
    }
}

function api_post(req, res, method, resp, jsonParser, status) {
	switch (method) {
        case "addMyBook":
			try {
				var id = req.body.isbn;
				var bks = readFromDb("books");
				if (id) {
					status = 200;
					var i = getBook(id, bks, true);
					console.log("	>:",i);
					if (i!=-1) {
						status = 403;
						resp = { cap: "isbn already existing", book: bks.db[i]};
					} else {
						status = 200;
						var i = bks.db.push(req.body);
						bks.len = i;
						resp = { cap: "new book added", book: bks.db[i]};
						saveToDb(bks, "books");
					}
				} else {
					status = 403;
					resp = { cap: "no isbn specified"};
				}
			} catch (e) {
				console.log("addMyBook:",e);
				resp = { cap: e };
				status = 404;
			}
            response_result(res, status, resp);
            break;
        case "editMyBook":
			try {
				var id = req.body.isbn;
				var bks = readFromDb("books");
				if (id) {
					status = 200;
					var i = getBook(id, bks, true);
					if (i!=-1) {
						bks.db[i].author = req.body.author;
						bks.db[i].title = req.body.title;
						bks.db[i].desc = req.body.title+" ["+req.body.author+"]";
						saveToDb(bks, "books");
						status = 200;
						resp = { cap: "ok modified", book: bks.db[i]};
					} else {
						status = 404;
						resp = { cap: "book not found"};
					}
				} else {
					status = 200;
					resp = { cap: "no book selected"};
				}
			} catch (e) {
				console.log("editMyBook:",e);
				resp = { cap: e };
				status = 404;
			}
            response_result(res, status, resp);
            break;
		case "setSet":
			var st = req.query.set;
			try {
				resp = { cap: "ok"};
				saveToDb(req.body, "set");
				status = 200;
			} catch (e) {
				console.log(e);
				resp = { cap: e };
				status = 404;
			}
			response_result(res, status, resp);
			break;
		default:
			resp = {};
			resp.cap = 'method Not Found';
			response_result(res, 404, resp);
	}
};


var server = app.listen(process.env.PORT || port_listening, function () {
    console.log('Server listening on port ' + server.address().port + ' context: ' + api_context);
});

function response_result(response, status, resp_obj) {
	/* console.log(">>>>>>>>>>>>>>response_result", status, resp_obj); */
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader('Content-Type', "application/json");
    var bodyString = JSON.stringify(resp_obj);
    response.status(status).end(bodyString);
	//console.log('RESPONSE SENT: ', bodyString, "\n---------------");
}

function getApis(fn) {
	var fnToString = fn.toString();
	//var fnBody = fnToString.match(/function[^{]+\{([\s\S]*)\}$/)[1];
	var cases = fnToString.match(/case(.*?):/g);
	var count = cases.length;
	for(var i in cases) {
		cases[i] = cases[i].replace('case "','').replace('":','');
	}
	return {apis: cases, count: count};
}

function searchBooks(t, a, bks) {
	console.log("searchBooks: ", t, a);
	var resp = [], nr = 0;
	for(var i = 0; i<bks.len; i++){
		var test = false;
		if (t) {
			if (bks.db[i].title && bks.db[i].title.toLowerCase().indexOf(t.toLowerCase()) != -1){
				test = true;
			} else {
				test = false;
			}
		} else {
			test = true;
		}
		if (a) {
			if (bks.db[i].author && bks.db[i].author.toLowerCase().indexOf(a.toLowerCase()) != -1) {
				test = test && true;
			} else {
				test = test && false;
			}
		} else {
			test = test && true;
		}
		if (test) {
			nr++;
			resp.push(bks.db[i]);
		}
	}
	return {len: nr, db: resp};
}

function getBook(isbn, bks, onlyindex) {
	for(var i = 0; i<bks.len; i++){
		if (bks.db[i].isbn==isbn) {
			if (onlyindex) return i; else return bks.db[i];
		}
	}
	if (onlyindex) return -1; else return false;
}

function saveToDb(data, table) {
	if (typeof data == "string") {
		var json = data;
	} else {
		var json = JSON.stringify(data, null, 4);
	}
	fs.writeFile(db_folder+table+'.json', json, 'utf8', function(err) {
		console.log('saveToDb: table=', table, ", err=",err);
	});
}

function convCSVtoDB(csvFilePath, callback) {
	var db = [];
	csv(opts)
	.fromFile(csvFilePath)
	.on('json',(jsonObj)=>{
		db.push(jsonObj);
	})
	.on('done',(error)=>{
		callback(db, csvFilePath);
	})
}

function backupDb(table) {
	var now = new Date();
	var bak_name = db_folder+table+"_"+now.toISOString();
	bak_name = bak_name.split("T");
	fs.createReadStream(db_folder+table+'.json')
	.pipe(fs.createWriteStream(bak_name[0]+'.bak'));
}

function readFromDb(table, cb) {
	if (!cb) {
		console.log('readSyncFromDb: table=', table);
		try {
			var data = fs.readFileSync(db_folder+table+'.json', "utf8");
		} catch (e) {
			var data = "";
			console.log('readFromDb: table=', table, ", err=",e);
		}
		var obj = data != "" ? JSON.parse(data) : {};
		return obj;		
	} else {
		fs.readFile(db_folder+table+'.json', 'utf8', function readFileCallback(err, data){
			if (err){
				console.log('readFromDb: table=', table, ", err=",err);
				cb({});
			} else {
				obj = JSON.parse(data); //now object
				cb(obj);
			}
		});
	}
}

function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}