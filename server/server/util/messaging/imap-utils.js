var _ = require('underscore');
var async = require('async');
var config = require('config');
var imap_module = require('imap');
var inspect = require('util').inspect;
var semaphore = require('semaphore')(1);
var ObjectID = require('mongodb').ObjectID;
var winston = require('winston');

var message_utils = require('./message-utils');

module.exports = {
    listBoxes: _listBoxes,
    checkUnread: _checkUnread,
    startReadJob: _startReadJob
};

var imap_unread, imap_list, unread_job_incrementor = 0;

function _listBoxes(callback2) {
    semaphore.take(function() {
        if(!imap_list) {
            _getImap(function (err_connect, connection) {
                if(err_connect) {
                    winston.error('an exception occurred when imap-utils tried to connect while listing inboxes: ' + err_connect);

                    semaphore.leave();
                    callback2(err_connect);
                    return;
                }
                imap_list = connection;

                imap_list.once('ready', function () {
                    _getBoxes();
                });

                imap_list.connect();
                semaphore.leave();
            });
            return;
        }
        semaphore.leave();
        _getBoxes();
    });

    function _getBoxes() {
        imap_list.getBoxes(function (err, result) {
            if(err) {
                winston.error('an exception occurred when imap-utils tried to list inboxes: ' + err);
            }
            imap_list.end();
            callback2(err, result);
        });
    }
}

function _checkUnread(callback2) {
    //semaphore.take(function() {
        if(!imap_unread) {
            winston.debug('getting imap connection');
            _getImap(function(err_connect, connection) {
                if(err_connect) {
                    winston.error('error while getting imap connection: ' + err_connect);
                    //semaphore.leave();
                    callback2(err_connect);
                    return;
                }

                imap_unread = connection;

                //semaphore.leave();

                imap_unread.once('ready', function() {
                    _checkUnread(callback2);
                });

                imap_unread.once('error', function(err) {
                    callback2(err);
                });

                imap_unread.once('end', function() {
                    imap_unread = null;
                });

                imap_unread.connect();
            });
            return;
        }
        //semaphore.leave();

        var messages = [];

        try {
            imap_unread.openBox('INBOX', false, function(err_open) { // , box
                if(err_open) {
                    winston.error('imap-utils failed to open inbox: ' + err_open);
                    callback2(err_open);
                    return;
                }
                imap_unread.search([ 'UNSEEN' ], function(err_unseen, results) {
                    if(err_unseen) {
                        winston.error('imap-utils failed to get unseen messages: ' + err_unseen);
                        callback2(err_unseen);
                        return;
                    }
                    if(results.length == 0) {
                        callback2(null, []);
                        return;
                    }
                    winston.debug('reading ' + results.length + ' unread emails');
                    var f = imap_unread.fetch(results, {
                        bodies: [
                            'HEADER',
                            'TEXT',
                            'HEADER.FIELDS (SUBJECT)',
                            'HEADER.FIELDS (CONTENT-TYPE)',
                            'HEADER.FIELDS (Content-Transfer-Encoding)'
                        ],
                        markSeen: true });
                    f.on('message', function(msg) { // , seqno
                        var message = {};
                        msg.on('body', function(stream, info) {
                            _readMessageBody(message, stream, info);
                        });
                        msg.once('attributes', function(attrs) {
                            message.attributes = attrs;
                        });
                        msg.once('end', function() {
                            messages.push(message);
                        });
                    });
                    f.once('error', function(err_fetch) {
                        winston.error('imap-utils failed to fetch inbox messages: ' + err_fetch);
                        callback2(err_fetch);
                    });
                    f.once('end', function() {
                        callback2(null, messages);
                    });
                });
            });
        } catch(ex) {
            winston.error('an exception occurred when imap-utils tried to check unread messages: ' + ex);
            imap_unread = null; // TODO: delete?/close?/end?
            _checkUnread(callback2);
        }
    //});
}

function _defaultChunkAppender(stream, callback) {
    var result_buffer;
    stream.on('data', function(chunk) {
        result_buffer = (result_buffer ? Buffer.concat([result_buffer, chunk]) : chunk);
    });
    stream.on('end', function() {
        if(!result_buffer) {
            callback(null, '');
            return;
        }
        callback(null, result_buffer.toString('utf8'));
    });
}

function _readMessageBody(message, stream, info) {
    if (info.which === 'TEXT') {
        _defaultChunkAppender(stream, function(err, result) {
            message.body = result;
        });
    } else if(info.which == 'HEADER') {
        _defaultChunkAppender(stream, function(err, result) {
            message.header = result;
        });
    } else if(info.which.indexOf('SUBJECT') != -1) {
        _defaultChunkAppender(stream, function(err, result) {
            message.subject = result;

            if(message.subject && message.subject.length > 0) {
                message.subject = message_utils.removeTitle(result).trim();

                // allow for UTF-8-encoded subject
                var encodeIndex = message.subject.toLowerCase().indexOf('=?utf-8?q?');
                var endEncodeIndex = message.subject.lastIndexOf('?=');
                if(encodeIndex == 0 && endEncodeIndex == message.subject.length - 2) {
                    message.subject = message.subject.substring(encodeIndex + 10, endEncodeIndex);
                    message.subject = message.subject.replace(/_/g, ' ');
                }
            }
        });
    } else if(info.which.indexOf('CONTENT-TYPE') != -1) {
        _defaultChunkAppender(stream, function(err, result) {
            message.content_type = message_utils.removeTitle(result).trim();
        });

    } else if(info.which.indexOf('Content-Transfer-Encoding') != -1) {
        _defaultChunkAppender(stream, function(err, result) {
            message.encoding = message_utils.removeTitle(result).trim();
        });
    }
}

// kicks off a recurring job to read the inbox for unread mail
function _startReadJob(messageProcessingFunction) {
    setInterval(function() {
        _doRead(messageProcessingFunction);
    }, config['email']['inbound']['interval']);
}

function _doRead(messageProcessingFunction) {
    unread_job_incrementor++;
    if(unread_job_incrementor > 200) {
        winston.debug('imap read job still alive');
        unread_job_incrementor = 0;
    }

    _checkUnread(function(err_mail, mail_result) { //
        if(err_mail) {
            winston.debug('An error occcurred when reading mail: ' + err_mail);
            return;
        }

        // TODO: maybe the logic should be changed: we could make the recursive call here, so long-running mail processing doesn't slow the mail checking

        var insert_tasks = [];

        _.each(mail_result, function(message) {
            insert_tasks.push(function(callback) {
                messageProcessingFunction(message, function() { // err_process, process_result
                    callback();
                });
            });
        });

        //winston.debug('imap read ' + mail_result.length + ' messages');

        async.series(insert_tasks, function() { // err_async, async_results
        });
    });
}

function _getImap(callback2) {
    var connection_info = {
        user: config['email']['inbound'].user,
        password: config['email']['inbound'].password,
        host: config['email']['inbound'].host,
        port: config['email']['inbound'].port,
        tls: config['email']['inbound'].tls,
        tlsOptions: { rejectUnauthorized: false }
    };
    winston.info('initiating inbound IMAP connection as ' + connection_info.user);

    callback2(null, new imap_module(connection_info));
}