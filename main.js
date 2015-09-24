var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var fs = require('fs');
var marked = require('marked');
var colors = require('colors');
var redis = require('redis');

var cli = undefined;
if(process.env.REDIS_URL) {
    var credentials = require("url").parse(process.env.REDIS_URL);
    cli = redis.createClient(credentials.port, credentials.hostname);
    cli.auth(credentials.auth.split(":")[1]);
} else {
    cli = redis.createClient();
}

var conf = JSON.parse(fs.readFileSync('./conf/global.json', 'utf8'));

http.listen((process.env.PORT || 5000), function() {
    console.log('Server listening on port: 5000');
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/resources'));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');


// Redis Init
cli.on('connect', function() {
    console.log('Redis connected');
});

cli.on('error', function(err) {
    console.log('Redis error: ' + err);
});


// INDEX ENTRY POINT
// SHOWS EVERYTHING
app.get('/', function(request, response) {
    var posts = [];
    var subtitle = conf.subtitle[Math.floor(Math.random() * (conf.subtitle.length - 0) + 0)];
    cli.sort('posts', 'alpha', 'desc', function(err, reply) {
        if(reply.length === 0) {
            response.render('index', {
                title: conf.title,
                subtitle: subtitle,
                data: null
            });
        } else {
            reply.forEach(function(val, index, array) {
                cli.hgetall(val, function(err, reply) {
                    posts.push(reply);
                    if(index === array.length - 1) {
                        response.render('index', {
                            title: conf.title,
                            subtitle: subtitle,
                            data: posts
                        });
                    }
                });
            });
        }
    });
});

// POST ENTRY POINT
app.post('/', function(request, response) {
    var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    console.log(('[POST ENTRY POINT]'.bold + ' Incomming request from ' + ip).blue);

    cli.smembers('banned', function(err, reply) {
        if(reply.indexOf(ip) === -1) {
            if(request.body.key === conf.key) {
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
            } else {
                cli.sadd('banned', ip);
                console.log(('[POST ENTRY POINT]'.bold + ' Request rejected - IP banned').red);
                response.status(503).send('Rejected\n'.red.bold);
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
            if(request.body.key === conf.key) {
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
            } else {
                cli.sadd('banned', ip);
                console.log(('[DELETE ENTRY POINT]'.bold + ' Request rejected - IP banned').red);
                response.status(503).send('Rejected\n'.red.bold);
            }
        } else {
            console.log(('[DELETE ENTRY POINT]'.bold + ' Request rejected - Already banned').red);
            response.status(503).send('Rejected\n'.red.bold);
        }
    });
});
