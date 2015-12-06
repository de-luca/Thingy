var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var fs = require('fs');
var marked = require('marked');
var colors = require('colors');
var redis = require('redis');

// CONFIGURATION STUFF
var config = {
  THINGY_TITLE: process.env.THINGY_TITLE,
  THINGY_SUBTITLE: JSON.parse(process.env.THINGY_SUBTITLE),
  THINGY_KEY: process.env.THINGY_KEY,
  THINGY_POST_MAN_USER_AGENT: new RegExp(process.env.THINGY_POST_MAN_USER_AGENT)
};

// REDIS STUFF
var cli;
if(process.env.REDIS_URL) {
  var credentials = require("url").parse(process.env.REDIS_URL);
  cli = redis.createClient(credentials.port, credentials.hostname);
  cli.auth(credentials.auth.split(":")[1]);
} else {
  cli = redis.createClient();
}

cli.on('connect', function() {
  console.log('Redis connected'.green.bold);
});

cli.on('error', function(err) {
  console.log('Redis error: ' + err);
});

http.listen((process.env.PORT || 5000), function() {
  console.log('Server listening on port: 5000'.green.bold);
});

// EXPRESS/EJS/APP STUFF
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/resources'));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// INDEX ENTRY POINT
app.get('/', function(request, response) {
  var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
  cli.smembers('banned', function(err, reply) {
    if(reply.indexOf(ip) === -1) {
      var posts = [];
      cli.sort('posts', 'alpha', 'desc', function(err, reply) {
        if(reply.length === 0) {
          response.render('index', {
            title: config.THINGY_TITLE,
            subtitle: config.THINGY_SUBTITLE[Math.floor(Math.random()*(config.THINGY_SUBTITLE.length-0)+0)],
            data: null
          });
        } else {
          reply.forEach(function(val, index, array) {
            cli.hgetall(val, function(err, reply) {
              posts.push(reply);
              if(index === array.length - 1) {
                response.render('index', {
                  title: config.THINGY_TITLE,
                  subtitle: config.THINGY_SUBTITLE[Math.floor(Math.random()*(config.THINGY_SUBTITLE.length-0)+0)],
                  data: posts
                });
              }
            });
          });
        }
      });
    } else {
      console.log(('[Blog Entry Point]'.bold + ' Access denied to ' + ip).red);
      response.status(503).send("Your IP was banned for attempting to access resouces you're not supposed to.");
    }
  });
});

// LIST ENTRY POINT
app.get('/list/:key', function(request, response) {
  var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
  console.log(('[LIST ENTRY POINT]'.bold + ' Incomming request from ' + ip).blue);

  cli.smembers('banned', function(err, reply) {
    if(reply.indexOf(ip) === -1) {
      if(!config.THINGY_POST_MAN_USER_AGENT.test(request.headers['user-agent']) || request.params.key !== config.THINGY_KEY) {
        cli.sadd('banned', ip);
        console.log(('[LIST ENTRY POINT]'.bold + ' Request rejected - IP banned').red);
        response.status(503).send('Rejected\n'.red.bold);
      } else {
        var posts = "";
        cli.sort('posts', 'alpha', 'desc', function(err, reply) {
          if(reply.length === 0) {
            console.log(('[LIST ENTRY POINT]'.bold + ' Request accepted - List sent').green);
            response.status(200).send(posts);
          } else {
            reply.forEach(function(val, index, array) {
              cli.hgetall(val, function(err, reply) {
                posts += reply.timestamp + ":" + reply.text.substr(0, reply.text.indexOf('\n')) + "...\n";
                if(index === array.length - 1) {
                  console.log(('[LIST ENTRY POINT]'.bold + ' Request accepted - List sent').green);
                  response.status(200).send(posts);
                }
              });
            });
          }
        });
      }
    } else {
      console.log(('[LIST ENTRY POINT]'.bold + ' Request rejected - Already banned').red);
      response.status(503).send('Rejected\n'.red.bold);
    }
  });
});

// POST ENTRY POINT
app.post('/', function(request, response) {
  var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
  console.log(('[POST ENTRY POINT]'.bold + ' Incomming request from ' + ip).blue);

  cli.smembers('banned', function(err, reply) {
    if(reply.indexOf(ip) === -1) {
      if(!config.THINGY_POST_MAN_USER_AGENT.test(request.headers['user-agent']) || request.body.key !== config.THINGY_KEY) {
        cli.sadd('banned', ip);
        console.log(('[POST ENTRY POINT]'.bold + ' Request rejected - IP banned').red);
        response.status(503).send('Rejected\n'.red.bold);
      } else {
        var id = Date.now();
        cli.hmset('post:' + id, {
          timestamp: id,
          text: marked(request.body.text)
        });
        cli.sadd('posts', 'post:' + id);
        io.emit('update', {
          timestamp: id,
          text: marked(request.body.text)
        });
        console.log(('[POST ENTRY POINT]'.bold + ' Request accepted - New post saved').green);
        response.status(200).send('Ok\n'.green.bold);
      }
    } else {
      console.log(('[POST ENTRY POINT]'.bold + ' Request rejected - Already banned').red);
      response.status(503).send('Rejected\n'.red.bold);
    }
  });
});

// DELETE ENTRY POINT
app.delete('/', function(request, response) {
  var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
  console.log(('[DELETE ENTRY POINT]'.bold + ' Incomming request from ' + ip).blue);

  cli.smembers('banned', function(err, reply) {
    if(reply.indexOf(ip) === -1) {
      if(!config.THINGY_POST_MAN_USER_AGENT.test(request.headers['user-agent']) || request.body.key !== config.THINGY_KEY) {
        cli.sadd('banned', ip);
        console.log(('[DELETE ENTRY POINT]'.bold + ' Request rejected - IP banned').red);
        response.status(503).send('Rejected\n'.red.bold);
      } else {
        cli.del('post:' + request.body.id, function(err, reply) {
          if(reply === 1) {
            cli.srem('posts', 'post:' + request.body.id);
            console.log(('[DELETE ENTRY POINT]'.bold + ' Request accepted - Post deleted').green);
            response.status(200).send('Ok\n'.green.bold);
          } else {
            console.log(('[DELETE ENTRY POINT]'.bold + ' Request accepted - Post not found').yellow);
            response.status(404).send('Not found\n'.yellow.bold);
          }
        });
      }
    } else {
      console.log(('[DELETE ENTRY POINT]'.bold + ' Request rejected - Already banned').red);
      response.status(503).send('Rejected\n'.red.bold);
    }
  });
});
