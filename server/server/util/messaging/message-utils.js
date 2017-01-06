var _ = require('underscore');
var cheerio = require('cheerio');
var ObjectID = require('mongodb').ObjectID;
var utf8 = require('utf8');
var winston = require('winston');

var general_utils = require('./../general-utils');
var user_util = require('./../user-utils');

var audit_database = require('../../database/instances/action-audit');
var mail_database = require('../../database/instances/action-message');

var MAX_BODY_LENGTH = 800;

module.exports = {
    storeMessage: _storeMessage,
    storeCRMReply: _storeCRMReply,
    parseCRMMessage: _parseCRMMessage,

    removeTitle: _removeTitle,

    MAX_BODY_LENGTH: MAX_BODY_LENGTH
};

function _storeMessage(req, message_info, callback2) {
    var caller = user_util.getCaller(req);

    mail_database.user_messages.insert(message_info, function(err_insert, insert_result) {
        if(err_insert) {
            callback2('while inserting a user message into action-message, an error occurred: ' + err_insert);
            return;
        }

        if(insert_result.length == 0) {
            winston.error('while processing PUT /message, the insert count was 0');
            callback2('could not send message');
            return;
        }
        message_info.message_id = insert_result[0]._id.toHexString();

        var audit_record = {
            'host': req.header('host'),
            'referer': req.header('referer'),
            'user-agent': req.header('user-agent'),
            'user_id': caller._id,
            'type': message_info.type,
            'platform': req.param('platform')
        };

        // pick the correct event type for the given message type
        audit_database.reportEvent('submissions', audit_record);

        callback2(null, message_info);
    });
}

function _storeCRMReply(message_id, crm_message, callback2) {
    mail_database.user_messages.findOne({ _id: ObjectID(message_id) }, function(err_message, message) {
        if(err_message) {
            callback2(err_message);
            return;
        }

        var responses_count = message.responses ? message.responses.length + 1 : 1;
        mail_database.user_messages.update({ _id: ObjectID(message_id) }, {
            $set: {
                last_update: new Date(),
                responses_count: responses_count
            },
            $push: {
                'responses': {
                    'id': crm_message._id,
                    'body': crm_message.body,
                    'created': crm_message.created,
                    'case_id': crm_message.case_id,
                    'subject': crm_message.subject
                }
            }
        }, callback2);
    });
}

function _extractValue(full_string, key) {
    var match_index = full_string.toUpperCase().lastIndexOf(key.toUpperCase());

    if(match_index == -1) {
        return {
            full_string: full_string,
            final_string: ''
        };
    }

    try {
        var final_index = full_string.indexOf('\n', match_index);
        var final_string = full_string.substring(match_index, final_index);

        full_string = full_string.substring(0, match_index) + full_string.slice(final_index, full_string.length);

        return {
            full_string: full_string,
            final_string: final_string
        };
    } catch(ex) {
        return {
            full_string: full_string,
            final_string: ''
        };
    }
}

function _parseCRMMessage(message, callback2) {

    // decode base64 if it's encoded that way
    if(message.encoding == 'base64') {
        var is_utf8 = (message.content_type && message.content_type.indexOf('utf-8') != -1);
        message.body = new Buffer(message.body, 'base64').toString(is_utf8 ? 'utf8' : 'ascii');
    }

    // if there's no body, just GTFO
    if(!message.body) {
        callback2(null, null);
        return;
    }

    // adapt multi-part (TODO: improve approach)
    if(message.content_type && message.content_type.indexOf('multipart') != -1) {
        var tokens = message.content_type.split(';');
        var boundary = undefined;
        _.each(tokens, function(token) {
            var boundaryStart = token.indexOf('boundary');
            if(boundaryStart != -1) {
                boundaryStart += 9;
                boundary = token.substring(boundaryStart).replace(/"/g, '');
            }
        });

        if(_.isUndefined(boundary)) {
            callback2('could not parse multipart email');
            return;
        }

        var body_parts = message.body.split('--' + boundary);
        var body_to_process = '';
        _.each(body_parts, function(part) {
            if(part.indexOf('Content-Type: text/plain') != -1 || part.indexOf('Content-Type:text/plain') != -1) {
                body_to_process += part;
            }
        });
        message.body = body_to_process;
    }

    // normalize the newlines
    message.body = message.body.replace(/\r?\n|\r/g, '\n');

    // extract the keys we care about (some dummies put the header as a footer)
    var message_position = _extractValue(message.body, "Message ID:");
    var email_position = _extractValue(message_position.full_string, "Email Address:");
    var action_position = _extractValue(email_position.full_string, "ActionID:");

    // extract keys we might use in the future, but don't really process
    var content_type = _extractValue(action_position.full_string, "Content-Type:");
    var mime_version = _extractValue(content_type.full_string, "MIME-Version:");
    var content_transfer = _extractValue(mime_version.full_string, "Content-Transfer-Encoding:");

    // move them to the top of the body
    message.body =
        (content_transfer.final_string.length > 0 ? content_transfer.final_string + '\n' : '') +
        message_position.final_string + '\n' +
        email_position.final_string + '\n' +
        action_position.final_string + '\n' +
        content_transfer.full_string;

    // use mailparser to parse the body
    var MailParser = require("mailparser").MailParser;
    var mailparser = new MailParser() ;

    mailparser.on("end", function(mail_object){
        _makeBodySafe(message);

        if(!mail_object.text) {
            message.body = message.body.substring(0, Math.min(MAX_BODY_LENGTH, message.body.length));
            mail_database.crm_errors.insert({
                message: message,
                error: 'no body text',
                processed_at: new Date()
            }, function() { // err_insert, insert_result
                winston.warn('got improper email: ' + message.body);
                callback2('could not parse body text');
            });
            return;
        }

        if(!mail_object.headers) {
            message.body = message.body.substring(0, Math.min(MAX_BODY_LENGTH, message.body.length));
            mail_database.crm_errors.insert({
                message: message,
                error: 'headers not readable',
                processed_at: new Date()
            }, function() { // err_insert, insert_result
                winston.warn('got improper email: ' + message.body);
                callback2('could not parse headers');
            });
            return;
        }

        // replace newlines with breaks, and decode any utf8 special characters
        message.body = utf8.decode(mail_object.text.trim()).replace(/\n/g, '<br/>');

        var message_id = mail_object.headers['message id'];
        if(!message_id) {
            message.body = message.body.substring(0, Math.min(MAX_BODY_LENGTH, message.body.length));
            mail_database.crm_errors.insert({
                message: message,
                error: 'no message id',
                processed_at: new Date()
            }, function() { // err_insert, insert_result
                winston.warn('got improper email: ' + message.body);
                callback2('message not properly formatted (no message id was found in a reponse message)');
            });
            return;
        }

        var email_address = mail_object.headers['email address'];
        if(!email_address) {
            message.body = message.body.substring(0, Math.min(MAX_BODY_LENGTH, message.body.length));
            mail_database.crm_errors.insert({
                message: message,
                error: 'no email address',
                processed_at: new Date()
            }, function() { // err_insert, insert_result
                winston.warn('got improper email: ' + message.body);
                callback2('message does not contain source email address');
            });
            return;
        }

        var action_user_id = (mail_object.headers['actionid'] ? mail_object.headers['actionid'] : mail_object.headers['action id']);
        if(!action_user_id) {
            message.body = message.body.substring(0, Math.min(MAX_BODY_LENGTH, message.body.length));
            mail_database.crm_errors.insert({
                message: message,
                error: 'no action user id',
                processed_at: new Date()
            }, function() { // err_insert, insert_result
                winston.warn('got improper email: ' + message.body);
                callback2('message does not contain user id in action system');
            });
            return;
        }

        // take breaks and whitespace out of our control fields
        var br_regex = /<br\s*[\/]?>/gi;
        message_id = message_id.replace(br_regex, "").trim();
        email_address = email_address.replace(br_regex, "").trim();
        action_user_id = action_user_id.replace(br_regex, "").trim();

        // fill in case id
        var case_id = '';
        if(message.subject) {
            try {
                var case_id_tokens = message.subject.split(':');
                if(case_id_tokens[0] == 'Response for Case ID' || case_id_tokens[0] == 'Case ID') {
                    case_id = case_id_tokens[1].trim();
                }
            } catch(ex) {
                winston.debug('an error occurred while parsing the case_id token for subject ' + message.subject);
            }
        }

        callback2(null, {
            case_id: case_id,
            subject: message.subject,
            body: message.body,
            message_id: message_id,
            action_user_id: action_user_id,
            email: email_address
        });
    });
    mailparser.write(message.body);
    mailparser.end();
}

function _removeTitle(value) {
    return value.substring(value.indexOf(':') + 1);
}

function _makeBodySafe(message) {
    if(!message || !message.body || message.body.trim().length == 0) {
        return;
    }

    var dom = cheerio.load(message.body);

    var scripts = dom('script');
    if(scripts.length > 0) {
        scripts.remove();
    }

    message.body = dom.root().html();
    console.log(message.body);

    /*
    // don't allow script indices - if no end script tag, allow butchering of body (the goal is safety, not preserving the data for people who don't follow the rules)
    var scriptIndex = message.body.indexOf('<script'), endIndex;
    while(scriptIndex != -1) {
        winston.debug('script element found in message body');

        endIndex = message.body.indexOf('</script');

        if(endIndex != -1) {
            message.body = message.body.slice(0, scriptIndex) + ' ' + message.body.slice(endIndex, message.body.length);
        }

        scriptIndex = message.body.indexOf('<script');
    }
    */
}