const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const mongojs = require('mongojs');
const path = require('path');

const jsforce = require('jsforce');
const session = require('express-session');
const util = require('util');

var users = require('./routes/user');
var index = require('./routes/index');
var salesforce = require('./routes/salesforce');

const app = express();

var port = 8080;
var db = mongojs('mongodb://rahul:rahul123@ds125684.mlab.com:25684/powersupport', ['users']);

app.use(function(req,res,next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
	res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	next();
});
app
.set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))

//initialize session
app.use(session({secret: 'S3CRE7', resave: true, saveUninitialized: true}));

var accessToken;
var instanceUrl;
var refreshToken;


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.engine('html', require('ejs').renderFile);
//app.use(express.static(__dirname + '../client/src'));

app.set('powersupport', db);

// app.use('/', function(req, res) {
// 	res.send("application running on port: " + port);
// });

// var jsforce = require('jsforce');
// var conn = new jsforce.Connection();
// conn.login('rahul.kumar@powerschool.com.emsdev', 'Tinku_3456', function(err, res) {
//   if (err) { return console.error(err); }
//   else { console.log(res);}
//   // conn.query('SELECT Id, Name FROM Account', function(err, res) {
//   //   if (err) { return console.error(err); }
//   //   console.log(res);
//   // });
// });

app.use('/', salesforce);
app.use('/api', users);
//app.use('/', index); 

// app.get('*', function(req, res) {
// 	res.send('hello');
// });

app.listen(port, function() {
	console.log('Server started on Port: '+ port);
});