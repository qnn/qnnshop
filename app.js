var express = require('express');
var assets  = require('connect-assets');
var routes  = require('./routes');

var app     = express();

app.set('port', process.env.PORT || 3000);
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.set('public_dir', __dirname + '/public');

app.use(express.static(app.get('public_dir')));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(assets({ buildDir: './public' }));

routes(app);

app.use(function(req, res){
  res.status(404).render('404');
});

app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
