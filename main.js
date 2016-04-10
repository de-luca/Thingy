'use strict';

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const marked = require('marked');
const auth = require('basic-auth');
const crypto = require('crypto');
const pg = require('pg');

pg.defaults.ssl = true;
pg.defaults.poolIdleTimeout = 10000;

const checkAuth = function(pass, salt, hash) {
  return salt+':'+crypto.pbkdf2Sync(pass, salt, 10000, 512, 'sha512').toString('hex') === hash;
};

const banHammer = function(ip, callback) {
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query({
      text: "INSERT INTO banned (ip) VALUES ($1)",
      values: [ip]
    })
    .on('end', () => {
      done();
      callback();
    });
  });
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
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query({
      text: "SELECT * FROM banned WHERE ip = $1",
      values: [ip]
    })
    .on('row', (row, result) => result.addRow(row))
    .on('end', (result) => {
      done();
      if(result.rowCount === 0)
        next();
      else
        response.status(403).send("Your IP was banned for attempting to access resources you're not supposed to.");
    });
  });
});

app.get('/', function(request, response) {
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query(`SELECT p.id, p.date, p.text, u.login as by
                  FROM post p JOIN "user" u ON p.by = u.id
                  ORDER BY p.date DESC`)
    .on('row', (row, result) => result.addRow(row))
    .on('end', (result) => {
      done();
      response.render('index', {
        title: process.env.THINGY_TITLE,
        subtitles: JSON.parse(process.env.THINGY_SUBTITLE),
        data: result.rows
      });
    });
  });
});

app.post('/', function(request, response) {
  var credentials = auth(request);

  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query({
      text: "SELECT * FROM \"user\" WHERE login = $1",
      values: [credentials.name]
    })
    .on('row', (row, result) => result.addRow(row))
    .on('end', (result) => {
      if(result.rowCount !== 1 || !checkAuth(credentials.pass, result.rows[0].password.split(':')[0], result.rows[0].password)) {
        done();
        banHammer(request.headers['x-forwarded-for'] || request.connection.remoteAddress, () => response.status(401).send());
      } else {
        client.query({
          text: `WITH p AS (
                   INSERT INTO post (text, by) VALUES ($1, $2) RETURNING *
                 )
                 SELECT p.id, p.date, p.text, u.login as by
                 FROM p JOIN "user" u ON p.by = u.id`,
          values: [marked(request.body.text), result.rows[0].id]
        })
        .on('row', (row, result) => result.addRow(row))
        .on('end', (result) => {
          done();
          io.emit('post', result.rows[0]);
          response.status(200).send();
        });
      }
    });
  });
});

app.delete('/', function(request, response) {
  var credentials = auth(request);

  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query({
      text: "SELECT * FROM \"user\" WHERE login = $1",
      values: [credentials.name]
    })
    .on('row', (row, result) => result.addRow(row))
    .on('end', (result) => {
      if(result.rowCount !== 1 || !checkAuth(credentials.pass, result.rows[0].password.split(':')[0], result.rows[0].password)) {
        done();
        banHammer(request.headers['x-forwarded-for'] || request.connection.remoteAddress, () => response.status(401).send());
      } else {
        client.query({
          text: "DELETE FROM post WHERE id = $1",
          values: [request.body.id]
        })
        .on('end', () => {
          done();
          io.emit('delete', request.body.id);
          response.status(200).send();
        });
      }
    });
  });
});
