var express = require('express');
var config = require('config');
var passport = require('passport');
var path = require('path');
var consolidate = require('consolidate');

var MongoStore = require('connect-mongo')(express);

var security = require('./server/security');
var server = require('./server/server');
var general_utils = require('./server/util/general-utils');

var app = express();
app.disable('x-powered-by');

// init logging via Winston
var winston = require('winston');
general_utils.initWinston();

app.engine('jade', consolidate.jade);
//app.enable('view cache');

app.set('port', config['site'].port);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view options', { layout: false });

app.set('view options', {pretty: config['site'].isHtmlPretty});
app.locals.pretty = config['site'].isHtmlPretty;

app.use(express.favicon());
//app.use(express.logger('dev'));
if(config.site.isCompressing) {
    app.use(express.compress());
}

app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser()); // TODO: use cookie secret?
app.use(require('node-response-time-tracking').middleware());
app.use(express.session({
    store: new MongoStore({
        url: 'mongodb://' + config.session.database.user + ':' +
            config.session.database.password + '@' + config.session.database.host + ':' + config.session.database.port + '/' +
            config.session.database.name
    }),
    secret: config.session.secret,
    cookie: { maxAge : config.session.timeout }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);

/*
app.get('/js/tpl/*', function(req, res){
    if(!config['site']['isTplCacheOff']) {
        res.header("Cache-Control", "max-age=86000");
    }
    res.sendfile(req.path, {root: './public'});
});
*/
app.use(express.static(path.join(__dirname, 'public')));

// caching for IE is super-sticky, and has caused some issues when testing and demoing
// so, we've provided a method to tell browsers to not cache, if the node admin so desires
// note: this doesn't work when inside of general-utils
if(config['site']['isCacheOff']) {
    winston.info('the default caching scheme is set to no-cache');
    app.use(function(req, res, next) {
        res.header("Cache-Control", "private, max-age=0, must-revalidate");
        res.header("Expires", "Thu, 01 Jan 1970 00:00:00");
        next();
    });
}

process.on('uncaughtException', function(err) {
    winston.error('uncaught exception! ... \n' + err + ' ... ' + err.stack);
});

security.init();

require('./server/router')(app);
require('./server/mail');

server.init(app);
