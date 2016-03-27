'use strict';

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const marked = require('marked');
const Datastore = require('nedb');
const auth = require('basic-auth');
const crypto = require('crypto');

let postsDB = new Datastore({
  filename: __dirname+'/db/posts',
  autoload: true
});
let bannedDB = new Datastore({
  filename: __dirname+'/db/banned',
  autoload: true
});
let usersDB = new Datastore({
  filename: __dirname+'/db/users',
  autoload: true
});

let checkAuth = function(pass, salt, hash) {
  return salt+':'+crypto.pbkdf2Sync(pass, salt, 10000, 512, 'sha512').toString('hex') === hash;
};

http.listen((process.env.PORT || 5000), function() {
  console.log('Server listening on port: '+(process.env.PORT || 5000));
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use('/resources', express.static(__dirname + '/node_modules/bootstrap/dist'));
app.use('/resources', express.static(__dirname + '/node_modules/jquery/dist'));

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
  postsDB.find({}).sort({date: -1}).exec(function(err, posts) {
    response.render('index', {
      title: process.env.THINGY_TITLE,
      subtitles: JSON.parse(process.env.THINGY_SUBTITLE),
      data: posts
    });
  });
});

app.post('/', function(request, response) {
  var credentials = auth(request);
  usersDB.findOne({_id: credentials.name}, function(err, doc) {
    if(checkAuth(credentials.pass, doc.pass.split(':')[0], doc.pass)) {
      postsDB.insert({date: new Date(), text: marked(request.body.text), by: credentials.name}, function(err, post) {
        if(err) {
          response.status(500).send();
        } else {
          io.emit('post', post);
          response.status(200).send();
        }
      });
    } else {
      let ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
      bannedDB.insert({_id: ip}, function(err) {
        if(err)
          response.status(500).send();
        else
          response.status(401).send();
      });
    }
  });
});

app.delete('/', function(request, response) {
  var credentials = auth(request);
  usersDB.findOne({_id: credentials.name}, function(err, doc) {
    if(checkAuth(credentials.pass, doc.pass.split(':')[0], doc.pass)) {
      postsDB.remove({_id: request.body.id}, function(err) {
        if(err) {
          response.status(500).send();
        } else {
          io.emit('delete', request.body.id);
          response.status(200).send();
        }
      });
    } else {
      let ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
      bannedDB.insert({_id: ip}, function(err) {
        if(err)
          response.status(500).send();
        else
          response.status(401).send();
      });
    }
  });
});
