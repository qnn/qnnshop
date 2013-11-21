var express  = require('express');
var mongoose = require('mongoose');
var assets   = require('connect-assets');
var fs       = require('fs');
var passport = require('passport');

mongoose.connect('mongodb://localhost/qnnshop');

var app      = express();

app.set('port', process.env.PORT || 3000);
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.set('public_dir', __dirname + '/public');

app.use(express.static(app.get('public_dir')));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({ secret: '877G4ec4uEDYHbMW' }));
app.use(express.csrf());
app.use(passport.initialize());
app.use(passport.session());
app.use(assets({ buildDir: './public' }));

app.configure('production', function(){
  app.enable('captcha');
});

require('js-yaml');
var products = require('./products');
var configs = require('./configs');

require('./routes')(app, products, configs);

var SOCKET_FILE = __dirname + '/tmp/sockets/node.socket';

if (fs.existsSync(SOCKET_FILE)) {
  fs.unlinkSync(SOCKET_FILE);
}

app.configure('production', function(){
  app.set('port', SOCKET_FILE);
});

app.listen(app.get('port'), function(){
  if (fs.existsSync(SOCKET_FILE)) {
    fs.chmodSync(SOCKET_FILE, 666); // some system need this to work right;
  }
  console.log('Express server listening on port ' + app.get('port'));
});
