/**
 * Google books API
 * @author piero@tilab
 * @version 0.0.2
 */

var http = require('https');
const url = "https://www.googleapis.com/books/v1/volumes?key=AIzaSyCnMJmGJ8CqULyyt6T8yIyIFOS0hA9akyw&q=isbn:";
const url1 = "https://books.google.it/books?vid=isbn";
const url2 = "https://isbndb.com/api/v2/json/D3JC7LDW/book/";
const url3 = "https://www.biblio.com/";
const url4 = "https://www.ibs.it/search/?ts=as&query=";
const url5 = "https://www.abebooks.it/servlet/SearchResults?isbn=";

function _get(url, isbn, callback) {
    console.info('get: url='+url+isbn);
    http.get(url+isbn, function (res) {
		const statusCode = res.statusCode;
		const contentType = res.headers['content-type'];
        var resp = {};
		var responseBody = "";
        resp.status = res.statusCode;
		
        res.on('data', function (chunk) {
            responseBody += chunk;
        });

        res.on('end', function () {
			try {
				if (contentType && contentType.indexOf("json")>-1)
					resp.body = JSON.parse(responseBody)
				else {
					resp.body = responseBody
				}
				status = 200;
			} catch (e) {
				console.log("g_books.get: ERR from "+url, e);
				resp = { cap: e };
				status = 404;
			}
            callback(resp);
        });
    })
	.on('error', function (e) {
		console.info('get: problem with request= ' + e.message);
		var resp = {};
		resp.status = -1;
		resp.error = e.message;
		callback(resp);
    });
}

function get(isbn, callback, ty) {
	console.info('get: ty=' + ty);
	if (ty==undefined) ty = 0;
	switch (ty) {
		case "1":
			getGoogle2(isbn, callback);
		break;
		case "2":
			getIsbndb(isbn, callback);
		break;
		case "3":
			getBiblio(isbn, callback);
		break;
		case "4":
			getIbs(isbn, callback);
		break;
		case "5":
			getAbe(isbn, callback);
		break;
		default:
			getGoogle(isbn, callback);
		break;
	}
}

function getIsbndb(isbn, callback) {
	_get(url2, isbn, function (resp) {
		if (resp.status==200 && !resp.error) {
			if (resp.body && resp.body.data && resp.body.data.length>=1) {
				var item = resp.body.data[0];
				resp.body.book = item;
				resp.body.book.isbn = isbn;
				resp.body.totalItems = 1;
				delete resp.body.data;
				resp.ty = 2;
			} else {
				if (!resp.body) resp.body = {};
				resp.body.book = {};
				resp.body.totalItems = 0;
				resp.body.isbn = isbn;
				delete resp.body.data;
			}
		}
		callback(resp);
	});
}

function getBiblio(isbn, callback) {
	_get(url3, isbn, function (resp) {
		if (resp.status) {
			var json = parseBiblio(resp.body);
			delete resp.body;
			if (json.title || json.author) {
				resp.body = {book: json};
				resp.body.book.isbn = isbn;
				resp.body.totalItems = 1;
				resp.ty = 3;
			} else {
				resp.body = {book: {}, isbn: isbn, totalItems: 0};
			}
			callback(resp);
		} else {
			delete resp.body;
			resp.body = {book: {}, isbn: isbn, totalItems: 0};
			callback(resp);
		}
	});
}

function getIbs(isbn, callback) {
	_get(url4, isbn, function (resp) {
		if (resp.status) {
			var json = parseIbs(resp.body);
			delete resp.body;
			if (json.title || json.author) {
				resp.body = {book: json};
				resp.body.book.isbn = isbn;
				resp.body.totalItems = 1;
				resp.ty = 4;
			} else {
				resp.body = {book: {}, isbn: isbn, totalItems: 0};
			}
			callback(resp);
		} else {
			delete resp.body;
			resp.body = {book: {}, isbn: isbn, totalItems: 0};
			callback(resp);
		}
	});
}

function getAbe(isbn, callback) {
	_get(url5, isbn, function (resp) {
		if (resp.status) {
			var json = parseBiblio(resp.body);
			delete resp.body;
			if (json.title || json.author) {
				resp.body = {book: json};
				resp.body.book.isbn = isbn;
				resp.body.totalItems = 1;
				resp.ty = 5;
			} else {
				resp.body = {book: {}, isbn: isbn, totalItems: 0};
			}
			callback(resp);
		} else {
			delete resp.body;
			resp.body = {book: {}, isbn: isbn, totalItems: 0};
			callback(resp);
		}
	});
}

function getGoogle2(isbn, callback) {
	_get(url1, isbn, function (resp) {
		if (resp.status!=404) {
			var json = parseGoogle(resp.body);
			delete resp.body;
			if (json.title || json.author) {
				resp.body = {book: json};
				resp.body.book.isbn = isbn;
				resp.body.totalItems = 1;
				resp.ty = 1;
			} else {
				resp.body = {book: {}, isbn: isbn, totalItems: 0};
			}
			callback(resp);
		} else {
			delete resp.body;
			resp.body = {book: {}, isbn: isbn, totalItems: 0};
			callback(resp);
		}
	});
}

function getGoogle(isbn, callback) {
    //console.info('getGoogle: ' + isbn);
    _get(url, isbn, function (resp) {
		if (resp.status==200) {
			if (resp.body.totalItems>=1) {
				var item = resp.body.items[0].volumeInfo;
				resp.body.book = item;
				if (resp.body.book.authors) {
					resp.body.book.author = resp.body.book.authors.join(", ");
				}
				resp.body.book.isbn = isbn;
				delete resp.body.items;
				resp.ty = 0;
				callback(resp);
			} else {
				getIsbndb(isbn, function (resp) {
					if (resp.body.totalItems>=1) {
						callback(resp);
					} else {
						getIbs(isbn, function (resp) {
							if (resp.body.totalItems>=1) {
								callback(resp);
							} else {
								getBiblio(isbn, function (resp) {
									if (resp.body.totalItems>=1) {
										callback(resp);
									} else {
										getAbe(isbn, function (resp) {
											callback(resp);
										});
									}
								});
							}
						});
					}
				});
			}
		}
    })
}

function parseBiblio(html) {
    /* console.info('parseBiblio: '); */
	
/* <meta itemprop="name" content="La storia di Ettore Castiglioni. Alpinista, scrittore, partigiano">
   <meta itemprop="author" content="A., Marco"> */
 	var obj = {};
	obj.title = "";
	obj.author = "";
	
	var n1 = html.search('<meta itemprop="name"');
	if (n1>=0) {
		obj.title = html.slice(n1,n1+100);
		obj.title = obj.title.split('content="')[1];
		obj.title = obj.title.substr(0, obj.title.search('"'));
	}
	
	var n2 = html.search('<meta itemprop="author"');
	if (n2>=0) {
		obj.author = html.slice(n2,n2+100);
		obj.author = obj.author.split('content="')[1];
		obj.author = obj.author.substr(0, obj.author.search('"'));
	}

	return obj;
}

function parseIbs(html) {
    /* console.info('parseIbs: '); */
	
/* <div class="title"><a href="/giorno-dell-astragalo-libro-alberto-paleari/e/9788874801022">Il giorno dell&#39;astragalo</a></div>
        <div class="abstract"></div>
            <div class="authors"><label>Autore</label><span>Alberto Paleari</span></div>
 */
 	var obj = {};
	obj.title = "";
	obj.author = "";
	
	var n1 = html.search('<div class="title"><a');
	if (n1>=0) {
		obj.title = html.slice(n1,n1+200);
		obj.title = obj.title.replace('<div class="title">',"");
		obj.title = obj.title.split('">')[1];
		obj.title = obj.title.substr(0, obj.title.search('</a>'));
	}
	
	var n2 = html.search('<div class="authors"><label>');
	if (n2>=0) {
		obj.author = html.slice(n2,n2+100);
		obj.author = obj.author.split('<span>')[1];
		obj.author = obj.author.substr(0, obj.author.search('</span>'));
	}

	return obj;
}

function parseGoogle(html) {
    /* console.info('parseGoogle: '); */
	
/*  <title>Il capitano di Shackleton. Vita e avventure di Frank Worsley - John Thomson - Google Libri</title>
 */
 	var obj = {};
	obj.title = "";
	obj.author = "";
	
	var n1 = html.search('<title>');
	if (n1>=0) {
		obj.title = html.slice(n1,n1+200).replace('<title>','');
		var tmp = obj.title.split(' - ');
		obj.title = tmp[0];
		obj.author = tmp[1];
	}
	return obj;
}


// Functions which will be available to external callers
exports.get = get;
exports.getBiblio = getBiblio;
exports.getIsbndb = getIsbndb;
exports.getIbs = getIbs;
exports.getAbe = getAbe;


exports.url_google = url;
exports.url_google2 = url1;
exports.url_isbndb = url2;
exports.url_biblio = url3;
exports.url_ibs = url4;
exports.url_abe = url5;