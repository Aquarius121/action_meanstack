var async = require('async');
var config = require('config');
var emailjs = require("emailjs/email");
var ObjectID = require('mongodb').ObjectID;
var winston = require('winston');

var general_utils = require('./util/general-utils');
var imap_utils = require('./util/messaging/imap-utils');

var mail_database = require('./database/instances/action-message');
var message_utils = require('./util/messaging/message-utils');

// we want as much of the app-specific stuff here as we can get

// kick off inbox reader
if(config['email']['inbound'].active) {
    imap_utils.startReadJob(_processMessage);
}

module.exports = {
    connectOutbound: _connectOutbound,
    testOutboundConnection: _testOutboundConnection,
    send: _sendMail,
    sendResetPasswordLink: _resetPassword,
    composeResetEmail: _composeResetEmail
};

function _composeResetEmail(server_domain, user, token) {
    var link = 'http://' + server_domain + '/user/reset-password?e=' + user.email+'&token=' + token;
    var html = "<html><body>";
    html += "Hi " + user.first_name + ",<br><br>";
    html += "<a href='" + link + "'>Please click here to reset your password</a><br><br>";
    html += "</body></html>";
    return  [{data:html, alternative:true}];
}

function _connectOutbound(callback2) {
    var values = config['email']['outbound'];

    winston.debug('creating outbound mail connection to ' + values.host);

    try {
        var server = emailjs.server.connect({
            host 	    : values.host,
            user 	    : values.user,
            password    : values.password,
            ssl		    : values.ssl,
            tls         : values.tls,
            port        : values.port
        });
        callback2(!server ? "could not create connection" : null, server);
    } catch(ex) {
        callback2('while creating outbount connection: ' + ex);
    }
}

function _testOutboundConnection(callback) {
    _connectOutbound(function(err_connect, server) {
        if(err_connect != null) {
            callback(err_connect, false);
            return;
        }
        callback(null, server);
    });
}

function _resetPassword(domain_name, server, account, token, callback2) {
    try {
        server.send({
            from         : config['email']['outbound'].sender,
            to           : account.email,
            subject      : 'Password Reset',
            text         : 'Password Reset',
            attachment   : _composeResetEmail(domain_name, account, token)
        }, callback2 );
    } catch(ex) {
        var message = 'while sending reset password message: ' + ex;

        callback2(message);
        winston.error(message);
    }
}

function _sendMail(server, to, subject, text, attachments, callback2) {
    try {
        server.send({
            from         : config['email']['outbound'].sender,
            to           : to,
            subject      : subject,
            text         : text,
            attachment   : attachments
        }, callback2);
    } catch(ex) {
        var message = 'while sending mail: ' + ex;

        callback2(message);
        winston.error(message);
    }
}

// read a given (CRM) message (struct from startReadJob)
function _processMessage(message, callback) {
    var message_responded_to, crm_message;

    message_utils.parseCRMMessage(message, function(err_parse, message_details) {
        if(err_parse) {
            callback(err_parse);
            return;
        }

        async.series({

            // allow the user to swap ids (let them be retards)
            'get_message': function(callback_async) {
                if(!general_utils.isValidId(message_details.message_id)) {
                    callback_async('invalid message id');
                    return;
                }

                if(!general_utils.isValidId(message_details.action_user_id)) {
                    callback_async('invalid user id');
                    return;
                }

                mail_database.user_messages.findOne({_id: ObjectID(message_details.message_id)}, function(err_message, message_result) {
                    message_responded_to = message_result;
                    if(message_result) {
                        callback_async();
                        return;
                    }

                    mail_database.user_messages.findOne({_id: ObjectID(message_details.action_user_id)}, function(err_user, user_result) {
                        if (!message_result && user_result) {
                            var old_mid = message_details.message_id;
                            message_details.message_id = message_details.action_user_id;
                            message_details.action_user_id = old_mid;
                            message_responded_to = user_result;

                            winston.warn('someone appears to have swapped their messageID and ActionID');
                        }
                        callback_async();
                    });
                });
            },

            'ensure_responded_to': function(callback_async) {
                if(!message_responded_to) {
                    callback_async('message ' +  message_details.message_id + ' replied to by CRM message not found');
                    return;
                }
                callback_async();
            },

            'build_message': function(callback_async) {
                crm_message = {
                    response_to_id: message_details.message_id, // effectively, the "root"
                    case_id: message_details.case_id,
                    subject: message_details.subject,
                    state: 'unread',
                    created: new Date(),
                    body: message_details.body
                };

                if(message_details.email) {
                    crm_message.email = message_details.email;
                }

                if(message_details.action_user_id) {
                    crm_message.user_id = message_details.action_user_id;
                }

                // propogate the "thread" root
                crm_message.root_message = message_responded_to.root_message ? message_responded_to.root_message : message_details.message_id;

                callback_async(null, crm_message);
            },

            'save_message': function(callback_async) {
                mail_database.crm_messages.insert(crm_message, function(err_insert, insert_result) {
                    if (err_insert) {
                        callback_async(err_insert);
                        return;
                    }
                    crm_message._id = insert_result[0]._id.toHexString();
                    callback_async(null, crm_message);
                });
            }

        }, function(err) { // err, async_results
            if(err) {
                message.body = message.body.substring(0, Math.min(message_utils.MAX_BODY_LENGTH, message.body.length));
                mail_database.crm_errors.insert({
                    message: message,
                    error: err,
                    processed_at: new Date()
                }, function () { // err_insert, insert_result
                    winston.warn('error occurred when reading CRM email. message id: ' + message_details.message_id + '\nerr: ' + err);
                    callback('a crm message came in that claims to reply to message ' + message_details.message_id + ', which is not in the system.');
                });
                return;
            }

            // store the response with the root of the thread
            message_utils.storeCRMReply(crm_message.root_message, crm_message, function(err_user_message, user_message) {
                if(err_user_message) {
                    callback(err_user_message);
                    return;
                }

                if (user_message == 0) {
                    message.body = message.body.substring(0, Math.min(message_utils.MAX_BODY_LENGTH, message.body.length));
                    mail_database.crm_errors.insert({
                        message: message,
                        error: 'no user found',
                        processed_at: new Date()
                    }, function () { // err_insert, insert_result
                        winston.warn('user not found when reading CRM email: ' + message.body);
                        callback('a crm message came in that claims to reply to message ' + crm_message._id + ', which is not in the system.');
                    });
                    return;
                }

                callback(err_user_message, user_message);
            });
        });
    });
}