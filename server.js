'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');

var ShortUrlModel = require('./models/shortUrl');

var cors = require('cors');
var bodyParser = require('body-parser');
var validUrl = require('valid-url');
var shortId = require('shortid');

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/
// mongoose.connect(process.env.MONGOLAB_URI);
mongoose.connect("127.0.0.1:27017/shortUrls");

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});


// your first API endpoint...
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.post("/api/shorturl/new", function (req, res, next) {
  var urlToShorten = req.body.url;
  var urlRegex = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;

  if(urlRegex.test(urlToShorten) === true){
    ShortUrlModel.findOne({
      originalUrl: urlToShorten
    }).exec(function (err, url) {
      if(err){
        res.send(err);
      }
      else{
        if(url === null){
          shortId.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@');
          var shortCode = shortId.generate();

          var data = new ShortUrlModel(
            {
              originalUrl: urlToShorten,
              shortUrl: shortCode
            }
          );

          data.save(function (error, short) {
            if(error){
              return res.send('Error: ' + error);
            }

            return res.json({
              original_url: urlToShorten,
              short_url: shortCode
            });
          })
        }
        else{
          res.json({
            url: "Already exists in database"
          })
        }
      }
    })
  }
  else {
    res.json({
      error: "invalid URL"
    });
  }
});

app.get("/api/shorturl/:shortUrl", function (req, res, next) {
  var shortUrl = req.params.shortUrl;

  ShortUrlModel.findOne({
    shortUrl: shortUrl
  }).exec(function (err, url) {
    if(!err){
      if(url !== null){
        var httpRegex = /^(http|https):\/\//i;
        var originalUrl = url.originalUrl;

        if(httpRegex.test(originalUrl) === true){
          res.redirect(originalUrl);
        }
        else{
          res.redirect("http://" + originalUrl);
        }
      }
      else{
        res.status(404).send('Url not found');
      }
    }
    else{
      res.send(err);
    }
  });

});


app.listen(port, function () {
  console.log('Node.js listening ...');
});
