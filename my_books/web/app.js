/**
 * Book APP client
 * @author beaver@gadan
 * @version 0.0.5
 */
var booksUrl = "https://www.googleapis.com/books/v1/volumes?maxResults=20&printType=books&key=AIzaSyCnMJmGJ8CqULyyt6T8yIyIFOS0hA9akyw&langRestrict=it&q=";
var mybooksUrl = "/api/getMyBooks?";

var curBook, curItems;
var ELLIPS = 50;

$(document).ready(function () {
	
    $("#txtBookSearch-title").autocomplete({
        source: function (request, response) {
			source("title", request, response);
        },
        select: function (event, ui) {
			selected(ui);
        },
        minLength: 2
    }).keypress(function(e) {
		if(e.keyCode == 13) {
			e.preventDefault();
			$(this).autocomplete("search");
		}
	}).focus(function() {
		$(this).autocomplete("search");
	});
	
    $("#txtBookSearch-isbn").autocomplete({
        source: function (request, response) {
			source("isbn", request, response);
        },
        select: function (event, ui) {
			selected(ui);
        },
        minLength: 2
    }).keypress(function(e) {
		if(e.keyCode == 13) {
			e.preventDefault();
			$(this).autocomplete("search");
		}
	}).focus(function() {
		$(this).autocomplete("search");
	});
	
    $("#txtBookSearch-author").autocomplete({
        source: function (request, response) {
			source("author", request, response);
        },
        select: function (event, ui) {
			selected(ui);
        },
        minLength: 2
    }).keypress(function(e) {
		if(e.keyCode == 13) {
			e.preventDefault();
			$(this).autocomplete("search");
		}
	}).focus(function() {
		$(this).autocomplete("search");
	});
	
    $("#txtMyBookSearch-title").autocomplete({
        source: function (request, response) {
			sourceMy("title", request, response);
        },
        select: function (event, ui) {
			selectedMy(ui);
        },
        minLength: 2
    }).keypress(function(e) {
		if(e.keyCode == 13) {
			e.preventDefault();
			$(this).autocomplete("search");
		}
	}).focus(function() {
		$(this).autocomplete("search");
	});
	
    $("#txtMyBookSearch-isbn").autocomplete({
        source: function (request, response) {
			sourceMy("isbn", request, response);
        },
        select: function (event, ui) {
			selectedMy(ui);
        },
        minLength: 2
    }).keypress(function(e) {
		if(e.keyCode == 13) {
			e.preventDefault();
			$(this).autocomplete("search");
		}
	}).focus(function() {
		$(this).autocomplete("search");
	});
	
    $("#txtMyBookSearch-author").autocomplete({
        source: function (request, response) {
			sourceMy("author", request, response);
        },
        select: function (event, ui) {
			selectedMy(ui);
        },
        minLength: 2
    }).keypress(function(e) {
		if(e.keyCode == 13) {
			e.preventDefault();
			$(this).autocomplete("search");
		}
	}).focus(function() {
		$(this).autocomplete("search");
	});
});

function source(key, request, response) {
	var url = booksUrl + "in"+key + ":" + encodeURIComponent(request.term);
	var author = $("#txtBookSearch-author").val();
	if (key=="title" && author!="") {
		url += "+inauthor:" + encodeURIComponent(author);
	}
	$.ajax({
		url: url,
		dataType: "jsonp",
		success: function(data) {
			if (data.items) {
				curItems = data.items;
				response($.map(data.items, function (item) {
					if (item.volumeInfo.authors && item.volumeInfo.title) {
						switch (key) {
							case "title":
								var lab = vv = item.volumeInfo.title.ellipsis(ELLIPS)+" ["+item.volumeInfo.authors[0]+"]";
							break;
							case "author":
								var lab = item.volumeInfo.authors[0] + ", "+item.volumeInfo.title.ellipsis(ELLIPS);
								var vv = item.volumeInfo.authors[0]
							break;
							case "isbn":
								var lab = request.term + ", "+item.volumeInfo.title.ellipsis(ELLIPS);
								var vv = request.term;
							break;
						}
						
						return {
							// label value will be shown in the suggestions
							label: lab,
							// value is what gets put in the textbox once an item selected
							value: vv,
							title: item.volumeInfo.title,
							author: item.volumeInfo.authors.join(", "),
							book: item.volumeInfo,
							key: key
						};
					}
				}));
			}

		}
	});
}

function sourceMy(key, request, response) {
	var url = mybooksUrl + key + "=" + encodeURIComponent(request.term);
	var author = $("#txtMyBookSearch-author").val();
	if (key=="title" && author!="") {
		url += "&author=" + encodeURIComponent(author);
	}
	$.ajax({
		url: url,
		dataType: "json",
		success: function(data) {
			if (data.db) {
				curItems = data.db;
				response($.map(data.db, function (item) {
					if (item.author && item.title) {
						switch (key) {
							case "title":
								var lab = vv = item.title;
							break;
							case "author":
								var lab = item.author + ", "+item.title;
								var vv = item.author
							break;

							case "isbn":
								var lab = request.term + ", "+item.title;
								var vv = request.term;
							break;
						}
						
						return {
							// label value will be shown in the suggestions
							label: lab,
							// value is what gets put in the textbox once an item selected
							value: vv,
							title: item.title,
							author: item.author,
							book: item,
							key: key
						};
					}
				}));
			}

		}
	});
}

function selected(ui) {
	curBook = ui.item.book;
	console.log("curBook:", curBook);
	$('#formBook').find("input[type=text], textarea").val("");
	$('input[name=title]').val(ui.item.title);
	$('input[name=author]').val(ui.item.author);
	$('input[name=isbn]').val(getIsbn(ui.item.book));
	
	if (ui.item.key=="title") $("#txtBookSearch-author").val(ui.item.author);
	
	$('#collapseDetails').empty();
	if (curBook.description)
		$('#collapseDetails').append('<p><b>Description:</b> ' + curBook.description  + '</p>');
	if (curBook.pageCount)
		$('#collapseDetails').append('<p><b>Pages:</b> ' + curBook.pageCount  + '</p>');
	if (curBook.publisher) {
		var pub = curBook.publisher;
		if (curBook.publishedDate) pub+=" "+curBook.publishedDate.substring(0, 4);
		$('#collapseDetails').append('<p><b>Publisher:</b> '+pub+'</p>');	
	}
	if (curBook.imageLinks && curBook.imageLinks.thumbnail)
		$('#collapseDetails').append('<p><img src="' + curBook.imageLinks.thumbnail  + '"/></p>');
}

function selectedMy(ui) {
	curBook = ui.item.book;
	console.log("curBook:", curBook);
	$('#formMyBook').find(".form-control-static").html("");
	setFormItemVal("m_title", ui.item.title);
	setFormItemVal("m_author", ui.item.author);
	if (ui.item.book.isbn) {
		setFormItemVal("m_isbn", ui.item.book.isbn);
	}
}

$(".cancel").click(function(){
   $(this).prev().val('').focus();
})

function chkBook() {
	var isbn = $('input[name=isbn]').val();
	var title = $('input[name=title]').val();
	if (isbn=="") {
		doAlert({type:"warning",title:"Warning",body:"Book has no ISBN, checking only TITLE!"},5);
		chkBookTitle(title);
	} else {
		getBook("isbn="+isbn, function (data) {
			if (data.len==0) {
				chkBookTitle(title);
			} else {
				popUp({title: "info", body: "Warn, book is already in list (same ISBN)!", bodyclass: " "});
			}
		});
	}
}

function chkBookTitle(title) {
	getBook("title="+title, function (data) {
		if (data.len==0) {
			popUp({title: "info", body: "Ok, book is NOT in list.", bodyclass: " "});
		} else {
			popUp({title: "info", body: "Warn, book is already in list (diff ISBN)!", bodyclass: " "});
		}
	});
}

function addBook() {
	getMaxOrdMyBooks(function(data) {
		$('input[name=ord]').val(data.max+1);
		$('#confirmDialog div.modal-body').html("Are you sure to add this book?");
		$('#confirmDialog').modal();
		$('#okBtn').one('click', function (e) {
			postBook();
		});
	});
}

function saveBook() {
	$('#confirmDialog div.modal-body').html("Are you sure to modify this book?");
	$('#confirmDialog').modal();
	$('#okBtn').one('click', function (e) {
		postBook('m_', true);
	});
}

function postBook(tag, edit) {
	if (tag==undefined) tag = "";
	if (edit) var api = "editMyBook"; else api = "addMyBook";
	var book = {};
	book.author = $('input[name='+tag+'author]').val();
	book.title = $('input[name='+tag+'title]').val();
	book.isbn = book.id = $('input[name='+tag+'isbn]').val();
	book.ord = $('input[name='+tag+'ord]').val();
	if (book.author=="" && book.title=="") return;
	book.desc = book.title + " ["+book.author+"]";
	book.date = new Date().toISOString();
	book.ts = new Date().getTime();
	book.ean = "EAN_13";
	console.log("book: ", book);
	
 	$.ajax({
		type: 'POST',
		url: "/api/"+api,
		data: JSON.stringify(book),
		success: function(data) {
			console.log("postBook.success");
			doAlert({type:"success",title:"Success",body:"Book saved"},5);
		},
		contentType: "application/json",
		dataType: 'json'
	})
	.fail(function(xhr, status, error) {
		console.log("postBook.error");
		var cap = ""
		if (xhr.responseJSON && xhr.responseJSON.cap) cap = " - "+xhr.responseJSON.cap;
		doAlert({type:"danger",title:"Error",body:"Book NOT saved!"+cap},5);
	});
}

function getBook(clause, cb, cb_fail) {
	$.ajax({
		type: 'GET',
		url: "/api/getMyBooks?"+clause,
		success: function(data) {
			console.log("getBook.success");
			if (cb) cb(data);
		},
		contentType: "application/json",
		dataType: 'json'
	})
	.fail(function() {
		console.log("getBook.error");
		if (cb_fail) cb_fail();
	});
}

function getMaxOrdMyBooks(cb, cb_fail) {
	$.ajax({
		type: 'GET',
		url: "/api/getMaxOrdMyBooks",
		success: function(data) {
			console.log("getMaxOrdMyBooks.success");
			if (cb) cb(data);
		},
		contentType: "application/json",
		dataType: 'json'
	})
	.fail(function() {
		console.log("getMaxOrdMyBooks.error");
		if (cb_fail) cb_fail();
	});
}

function listBooks(tb) {
	table(tb, curItems);
}
function clearBooks(tb) {
	$("#"+tb+" > tbody tr").remove();
}

function table(tb, items) {
	$("#"+tb+" > tbody tr").remove();
	var nr = 0;
	for(var i in items) {
		nr++;
		var html = '<tr>';
		if (items[i].volumeInfo)
			var item = items[i].volumeInfo;
		else item = items[i];
		if (item.id)
			html += '<td>'+item.id+'</td>';
		else
			html += '<td>'+nr+'</td>';
		
		html += '<td>'+getIsbn(item)+'</td>';
		html += '<td>'+getAuthor(item)+'</td>';
		html += '<td>'+item.title+'</td>';
		html += '</tr>';
		$('#'+tb+' > tbody').append(html);
	}
}

function getIsbn(book) {
	if (book.industryIdentifiers) {
		var id = book.industryIdentifiers;
		for(var i in id) {
			if (id[i].type=="ISBN_13") return id[i].identifier;
		}
	} else if (book.isbn) {
		return book.isbn;
	}
}

function getAuthor(book) {
	if (book.authors)
		return book.authors.join(", ");
	else
		return book.author;
}

function popUp(obj) {
	if (!obj.bodyclass) obj.bodyclass = "text-center";
	if (!obj.size) obj.size = "modal-sm";
	var popupTemplate =
	  '<div class="modal fade">' +
	  '  <div class="modal-dialog '+obj.size+'">' +
	  '    <div class="modal-content">' +
	  '      <div class="modal-header">' +
	  '        <button type="button" class="close" data-dismiss="modal">&times;</button>' +
	  '        <h4 class="modal-title text-center">'+obj.title+'</h4>' +
	  '      </div>' +
	  '      <div class="modal-body '+obj.bodyclass+'">'+obj.body+'</div>'+
	  '      <div class="modal-footer">' +
	  '        <button type="button" class="btn btn-link" data-dismiss="modal">Close</button>' +
	  '      </div>' +
	  '    </div>' +
	  '  </div>' +
	  '</div>';
	$(popupTemplate).modal();
}

function doAlert(msg, sec) {
	$("#alert").removeClass("alert-success alert-info alert-danger alert-warning");
	$("#alert").addClass("alert-"+msg.type);
	$("#alert-title").html(msg.title);
	$("#alert-body").html(msg.body);
	$("#alert").show();
	if (sec) {
		setTimeout(function(){ $("#alert").hide(); }, 1000*sec);
	}
}

function enableEditField(name) {
	$("p[name="+name+"]").toggleClass("hidden");
	$("input[name="+name+"]").toggleClass("hidden");
	$("p[name="+name+"]").html($("input[name="+name+"]").val());
	$("input[name="+name+"]").focus();
}

function editMyBook() {
	enableEditField("m_author");
	enableEditField("m_isbn");
	enableEditField("m_ord");
	enableEditField("m_title");
	$("#btnSaveBook").toggleClass("hidden");
}

function setFormItemVal(nm, val) {
	$("p[name="+nm+"]").html(val);
	if ($("input[name="+nm+"]").length) $("input[name="+nm+"]").val(val);
	else if ($("textarea[name="+nm+"]").length) $("textarea[name="+nm+"]").val(val);
	if ($("select[name="+nm+"]").length) {
		$("select[name="+nm+"]").val(val);
		var lbl = $("select[name="+nm+"] option:selected").text();
		$("p[name="+nm+"]").html(lbl);
	}
}

function getFormItemVal(nm) {
	if ($("input[name="+nm+"]").length) {
		return $("input[name="+nm+"]").val()+'';
	} else if ($("textarea[name="+nm+"]").length) {
		return $("textarea[name="+nm+"]").val()+'';
	} else if ($("select[name="+nm+"]").length) {
		return $("select[name="+nm+"]").val()+'';
	}
	return null;
}

String.prototype.ellipsis = function(n) {
	if (this.length<=n)
	return this;
	else
    return this.substring(0, n)+"...";
};