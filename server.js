var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var cheerio = require('cheerio');
var request = require('request');
var Note = require('./models/note.js');
var Article = require('./models/article.js');
var PORT = process.env.PORT || 3000;

mongoose.Promise = Promise;

var app = express();

app.use(bodyParser.urlencoded({
	extended: false
}));

app.use(express.static("public"));

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);

var db = mongoose.connection;

db.on("error", function(error) {
	console.log("Mongoose Error: " + error);
});

db.once("open", function() {
	console.log("Mongoose connection successful.");
});

// mongoose routes

app.get("/scrape", function(req, res) {
	request("http://www.nytimes.com", function(error, response, html) {
		var $ = cheerio.load(html);
		$('h2.story-heading').each(function(i, element) {
			var result = {};
			result.title = $(this).children("a").text();
			result.link = $(this).children("a").attr("href");

			var entry = new Article(result);

			entry.save(function(err, doc) {
				if (err) {
					console.log(err);
				}
				else {
					console.log(doc);
				}
			});
		});
	});
	res.redirect("/");
});

app.get("/articles", function(req, res) {
	Article.find({}, function(error, doc) {
		if (error) {
			console.log(error);
		}
		else {
			res.json(doc);
		}
	});
});

app.get("/articles/:id", function(req, res) {
	Article.findOne({ "_id": req.params.id })
	.populate("note")
	.exec(function(error, doc) {
		if (error) {
			console.log(error);
		}
		else {
			res.json(doc);
		}
	});
});

app.post("/articles/:id", function(req, res) {
	var newNote = new Note(req.body);
	newNote.save(function(error, doc) {
		if (err) {
			console.log(err);
		}
		else {
			res.send(doc);
		}
	});
});

app.listen(PORT, function() {
	console.log("Listening on port: " + PORT);
});