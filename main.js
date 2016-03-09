'use strict';

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const fs = require('fs');
const marked = require('marked');
const Datastore = require('nedb');
const auth = require('basic-auth');

let postsDB = new Datastore({
  filename: __dirname+'/db/posts',
  autoload: true
});
let bannedDB = new Datastore({
  filename: __dirname+'/db/banned',
  autoload: true
});

let config = {
  THINGY_TITLE: process.env.THINGY_TITLE,
  THINGY_SUBTITLE: JSON.parse(process.env.THINGY_SUBTITLE)
};

http.listen((process.env.PORT || 5000), function() {
  console.log('Server listening on port: '+(process.env.PORT || 5000));
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/resources'));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.all('*', function(request, response, next) {
  let ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
  bannedDB.findOne({_id: ip}, function(err, ban) {
    if(!err && ban)
      response.status(403).send("Your IP was banned for attempting to access resources you're not supposed to.");
    else
      next();
  });
});

app.get('/', function(request, response) {
  postsDB.find({}, function(err, posts) {
    console.log(posts);
    response.render('index', {
      title: config.THINGY_TITLE,
      subtitle: config.THINGY_SUBTITLE[Math.floor(Math.random()*(config.THINGY_SUBTITLE.length-0)+0)],
      data: posts
    });
  });
});


// TODO: POST ENTRY POINT
// app.post('/', function(request, response) {
// });

// TODO: DELETE ENTRY POINT
// app.delete('/', function(request, response) {
// });
