var config = require('config');
var http = require('http');
var winston = require('winston');

module.exports = {
    init: _init,
    shutdown: _shutdown,
    getServer: _getServer,
    getRTCServer: _getRTCServer
};

var server = null;
var rtc_server = null;

function _init(app) {
    server = http.createServer(app);

    var easyrtc;

    if(config['rtc']['enabled']) {
        var io = require('socket.io').listen(server, { log: false });
        io.set('log level', 1); // reduce logging
        easyrtc = require('easyrtc');
    }

    server.listen(app.get('port'), function(){
        winston.info('express server listening on port ' + app.get('port') + ' in ' + config.environment + ' environment');
    });

    if(config['rtc']['enabled']) {
        // Start EasyRTC server
        rtc_server = easyrtc.listen(app, io);
    }
}

function _shutdown() {
    winston.info('shutting down server');

    //server.close(function() {
        winston.info('server shutdown complete - exiting process');
        process.exit();
    //});
}

function _getRTCServer() {
    return rtc_server;
}

function _getServer() {
    return server;
}