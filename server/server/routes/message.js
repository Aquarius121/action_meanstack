var _ = require('underscore');
var async = require('async');
var ObjectID = require('mongodb').ObjectID;
var schedule = require('node-schedule');
var url = require('url');
var winston = require('winston');

var audit_database = require('../database/instances/action-audit');
var product_database = require('../database/instances/product-info');
var message_database = require('../database/instances/action-message');

var general_util = require('../util/general-utils');
var message_util = require('../util/messaging/message-utils');
var product_util = require('../util/product-utils');
var survey_util = require('../util/survey-utils');
var user_util = require('../util/user-utils');

var mail = require('../mail');

var MAX_CRM_SEND_ATTEMPTS = 10;
var VALID_MESSAGE_TYPES = ['complaint', 'share', 'concern', 'praise', 'comment', 'question', 'reply'];

module.exports = {
    messages_get: _handleMessagesGet,
    message_put: _handleMessagePut,
    message_get_unread: _handleGetUnread,
    message_errors_get: _handleMessageErrorsGet,
    message_error_delete: _handleMessageErrorDelete,

    message_send_view: _handleMessageSendView,
    messages_errors_view: _handleGetErrorsView,
    messages_view: _handleMessagesView,
    message_thanks_view: _handleMessageThanksView,

    message_update: _handleMessageUpdate,
    response_update: _handleUpdateResponses
};

function _handleMessagesGet(req, res) {
    var caller = user_util.getCaller(req);

    var id = req.param('id');

    if(!id && caller.role != 'admin') {
        res.send('id must be supplied', 500);
        return;
    }

    // additional validations if id supplied
    if(id) {
        if(!user_util.canEditUser(caller, req.param('id'))) {
            general_util.send404(res);
            return;
        }

        if(!general_util.isValidId(req.param('id'))) {
            res.send('invalid id for user', 500);
            return;
        }
    }

    var message_results = [];

    async.series([

        // if id supplied, get a user's messages
        function(callback) {
            if(!id) {
                callback();
                return;
            }

            var history_query = {
                user_id: req.param('id'),
                state: {$ne: 'archived'}
            };

            message_database.user_messages.find(history_query).sort({created: -1}).limit(100).toArray(function(err_messages, messages) {
                if(err_messages) {
                    winston.error('while getting messages, an error occurred: ' + err_messages);
                    callback(err_messages, null);
                    return;
                }

                message_results = _.map(messages, function(message) {
                    return _.omit(message, 'user_id');
                });
                callback();
            });
        },

        // if admin, get everyone's messages
        function(callback) {
            if(caller.role == 'admin' && !id) {
                message_database.user_messages.find({}).sort({created: -1}).limit(250).toArray(function(err_messages, messages) {
                    if(err_messages) {
                        winston.error('while getting all messages as an admin, an error occurred: ' + err_messages);
                        callback(err_messages, null);
                        return;
                    }

                    message_results = messages;
                    callback();
                });
                return;
            }
            callback();
        },

        // for each message, tie brand logo_url into message
        function (callback) {
            if(!message_results || message_results.length == 0) {
                callback();
                return;
            }

            var brand_ids = _.uniq(_.pluck(message_results, 'brand'));
            brand_ids = _.map(brand_ids, function(id) { return ObjectID(id); });

            product_database.pod_brands.find({_id: {$in: brand_ids}, logo_url: {$exists: true}}, {_id: 1, logo_url: 1}).toArray(function(err_brand, brand_results) {
                if(err_brand) {
                    callback(err_brand);
                    return;
                }

                if(!brand_results || brand_results.length == 0) {
                    callback();
                    return;
                }

                _.each(brand_results, function(brand) {
                    brand._id = brand._id.toHexString();
                });

                message_results = _.map(message_results, function(message) {
                    if(message.brand) {
                        var brand_info = _.findWhere(brand_results, {_id: message.brand});
                        if(brand_info) {
                            message.brand_logo_url = brand_info.logo_url;
                        }
                    }
                    return message;
                });
                callback();
            });
        },

        // for each message, tie read status of crm-message
        function (callback) {
            if(!message_results || message_results.length == 0) {
                callback();
                return;
            }

            var root_ids = _.map(message_results, function(msg) { return msg._id.toHexString(); });
            var query = {state:"unread", root_message: {$in: root_ids}};

            message_database.crm_messages.find(query).toArray(function(err_brand, crm_results) {
                if(err_brand) {
                    callback(err_brand);
                    return;
                }
                if(!crm_results || crm_results.length == 0) {
                    callback();
                    return;
                }
                message_results = _.map(message_results, function(message) {
                    var crm_info = _.findWhere(crm_results,{root_message:message._id.toHexString()});
                    if(crm_info)
                        message.readstate = crm_info.state;
                    else
                        message.readstate = "read";

                    return message;
                });
                callback();
            });
        },

        //sort messages
        function (callback) {
            if(!message_results || message_results.length == 0) {
                callback();
                return;
            }

            message_results.sort(function(a,b){

                if(a.readstate > b.readstate)
                    return -1;
                else if(a.readstate < b.readstate)
                    return 1;
                else
                    return 0;
            });

            callback();

        },

        //parse linkable tags
        function (callback) {
            if(!message_results || message_results.length == 0) {
                callback();
                return;
            }

            message_results.forEach(function(message){
                message.text = general_util.urlify(message.text);

                if(!_.isUndefined(message.responses) && _.isArray(message.responses))
                {
                    var res = message.responses;
                    res.forEach(function(response)
                    {
                       response.body = general_util.urlify(response.body);
                    });
                    message.responses = res;
                }
            });
            callback();
        }

    ], function(err_async, async_result) {
        if(err_async) {
            res.send(err_async, 500);
            return;
        }
        res.send(message_results, 200);
    });
}

function _handleMessageErrorsGet(req, res) {
    message_database.crm_errors.find({}).limit(1000).sort({_id: -1}).toArray(function(err, results) {
        if(err) {
            winston.error('while getting message errors, an error occurred: ' + err);
            res.send(err, 500);
            return;
        }
        res.send(results, 200);
    });
}

function _handleMessageErrorDelete(req, res) {
    var message_id = req.param('id');
    if(!general_util.isValidId(message_id)) {
        res.send('invalid id', 500);
        return;
    }
    message_database.crm_errors.remove({_id: ObjectID(message_id)}, function(err, results) {
        if(err) {
            winston.error('while deleting message errors, an error occurred: ' + err);
            res.send(err, 500);
            return;
        }
        if(results == 0) {
            general_util.send404(res);
            return;
        }
        res.send(results, 200);
    });
}

function _handleMessageSendView(req, res) {
    var caller = user_util.getCaller(req);
    var ip = general_util.getIPAddress(req);

    async.series({
        'product_info': function(callback) {
            var ean = req.param('ean');
            if(!ean) {
                callback();
                return;
            }

            product_util.getProductData(caller, ip, ean, false, function(err, product_data) {
                if (err != null) {
                    res.send(err, 500);
                    return;
                }

                if (!product_data || !product_data.product) {
                    res.redirect('/products/find/view?missing-code=' + ean);
                    return;
                }

                if (product_data.brand) {
                    product_data.brand = _.omit(product_data.brand, 'content');
                }
                callback(null, {
                    product: product_data.product,
                    brand: product_data.brand
                });
            });
        },

        'reply_to': function(callback) {
            var reply_to = req.param('reply-to');
            if(!reply_to) {
                callback();
                return;
            }

            message_database.crm_messages.findOne({_id: ObjectID(reply_to)}, function(err_message, crm_message) {
                if(err_message) {
                    res.send(err_message, 500);
                    return;
                }
                callback(null, {
                    reply_to: crm_message
                });
            });
        }

    }, function(err_async, async_result) {
        var caller = user_util.getCaller(req);
        var render_data = {
            title: 'Contact',
            url: req.url,
            caller: caller
        };
        render_data = _.extend(render_data, async_result['product_info']);
        render_data = _.extend(render_data, async_result['reply_to']);
        res.render('message-send', render_data);
    });
}
function _handleMessagesView(req, res) {
    res.render('messages', {
        caller: user_util.getCaller(req),
        title: 'Messages',
        url: req.url
    });
}
function _handleMessageThanksView(req, res) {
    var caller = user_util.getCaller(req);
    var ip = general_util.getIPAddress(req);
    console.log('_handleMessageThanksView: ean = ' + req.param('ean'));
    
    async.series({
        'product_info': function(callback) {
	    var ean = req.param('ean');
	    if(!ean) {
                callback();
		return;
	     }	

	    product_util.getProductData(caller, ip, ean, false, function(err, product_data) {
	        if (err != null) {
	            res.send(err, 500);
		    return;
	        }

	        if (!product_data || !product_data.product) {
	            res.redirect('/products/find/view?missing-code=' + ean);
		    return;
	        }
	    
	        if (product_data.brand) {
	            product_data.brand = _.omit(product_data.brand, 'content');
	        }
	     
	        callback(null, {
	            product: product_data.product,
		    brand: product_data.brand
	        });
	    });
	}
	
    	}, function(err_async, async_result) {
	       var caller = user_util.getCaller(req);
	       var render_data = {
	           title: 'Contact',
		   url: req.url,
		   caller: caller
	       };
			            
	       render_data = _.extend(render_data, async_result['product_info']);
               res.render('message-thanks', render_data);
        });
}
function _handleGetErrorsView(req, res) {
    res.render('message-errors', {
        caller: user_util.getCaller(req),
        title: 'Message Errors',
        url: req.url
    });
}

// request:
// ean (required)
// text (required)
// email (optional, but required if no caller found)
// files (optional) "file uploads" -> S3
//
// database object:
// product_name (required)
// text
// email (optional, required if user_id not entered)
// user_id (optional, required if email not entered)
// image_urls (optional)
// created
// brand (required)
// brand_name (required)
// target (required) "brand endpoint"
function _handleMessagePut(req, res) {
    var type = req.param('type');
    if(!type) {
        res.send('no message type provided', 500);
        return;
    }

    if(type == 'reply') {
        _handleReplyMessagePut(req, res, type);
        return;
    }

    if(VALID_MESSAGE_TYPES.indexOf(type) != -1) {
        _handleProductScopedMessagePut(req, res);
        return;
    }

    res.send('unrecognized message type ' + type, 500);
}

function _handleProductScopedMessagePut(req, res) {
    var caller = user_util.getCaller(req);
    var type = req.param('type');

    var text = req.param('text');
    if(_.isUndefined(text)) { // allow the text to be falsy
        res.send('text not supplied', 500);
        return;
    }

    var file_info = [];

    if(req.files && req.files.file) {
        file_info.push({
            name: req.files.file.name,
            size: req.files.file.size,
            type: req.files.file.type
        });
    }

    var attachment_suffix = '';
    if(req.body.attachments) {
        attachment_suffix += '\n\nAttachments: ';
        _.each(req.body.attachments, function(attachment) {
            file_info.push({
                name: attachment.name,
                size: attachment.size,
                type: attachment.type,
                link: attachment.link
            });
            attachment_suffix += '\n' + attachment.link;
        });
    }

    var message_info = {
        text: text,
        type: type,
        files: file_info,
        created: new Date(),
        last_update: new Date(),
        state: 'sent'
    };

    var ean = req.param('ean');
    if(!ean) {
        res.send('product ean not supplied', 500);
        return;
    }

    message_info.ean = ean;

    var user = {}, file = null;

    async.series({

        'user': function(callback) {
            if(_.isUndefined(caller)) {
                winston.error('a user attempted to send a message but was not authenticated');
                callback('cannot send message without being authenticated');
                return;
            }

            user = caller;
            message_info.user_id = caller._id.toLowerCase();
            message_info.email = caller.email;
            callback();
        },

        'product': function(callback) {
            product_database.ean.findOne({ean: ean}, function(err_product, product) {
                if(err_product) {
                    winston.error('an error occurred while getting product ' + req.param('ean') + ' when processing a user message: ' + err_product);
                    res.send(err_product, 500);
                    return;
                }

                if(!product) {
                    winston.error('product ' + req.param('ean') + ' not found when processing a user message');
                    general_util.send404(res, 'product not found');
                    return;
                }

                if(!product.brand) {
                    winston.error('brand not found for product ' + req.param('ean') + ' when processing a user message');
                    general_util.send404(res, 'brand not found');
                    return;
                }
                message_info.product_name = product.name;
                message_info.brand = product.brand;
                callback();
            });
        },

        'brand': function(callback) {
            product_database.pod_brands.findOne({_id: ObjectID(message_info.brand)}, function(err_brand, brand) {
                if(err_brand) {
                    winston.error('an error occurred while getting brand ' + message_info.brand + ' when processing a user message');
                    res.send(err_brand, 500);
                    return;
                }

                // we do this above - but this is here for some added safety, I guess
                if(!brand) {
                    winston.error('brand not found for product ' + req.param('ean') + ' when processing a user message');
                    general_util.send404(res, 'brand not found');
                    return;
                }
                message_info.brand_name = brand.name;
                message_info.target = brand.crm_email_endpoint;
                callback();
            });
        },

        'file': function(callback) {
            if(!req.files || !req.files.file) {
                callback();
                return;
            }

            file = req.files.file;

            callback(null, req.files.file);
        },

        'insert': function(callback) {
            message_database.user_messages.insert(message_info, function(err_insert, insert_result) {
                if(err_insert) {
                    winston.error('while inserting a user message into action-message, an error occurred: ' + err_insert);
                    callback(err_insert);
                    return;
                }

                if(insert_result.length == 0) {
                    winston.error('while processing PUT /message, the insert count was 0');
                    callback('could not send message');
                    return;
                }
                message_info.message_id = insert_result[0]._id.toHexString();

                var audit_record = audit_database.generateAuditRecord(req, {
                    'type': type,
                    'product': ean,
                    'product_name': message_info.product_name,
                    'brand': message_info.brand
                });

                // pick the correct event type for the given message type
                audit_database.reportEvent('submissions', audit_record);

                callback();
            });
        },

        'send_email': function(callback) {
            message_info.text += attachment_suffix;

            general_util.runInBackground(function() {

                // try for 5 minutes to send the message to the CRM (with 30 second delays between)
                _sendToCRMWithRetries(user, message_info, file, MAX_CRM_SEND_ATTEMPTS, 30000, function(err_send) { // , send_result
                    if(err_send) {
                        winston.error('an error occurred when sending message to CRM: ' + err_send);
                        var message = {
                            body: text.substring(0, Math.min(500, text.length))
                        };
                        message_database.crm_errors.insert({
                            message: message,
                            processed_at: new Date(),
                            error: 'email-service-issue: when sending on behalf of user with email ' + caller.email + ': ' + err_send
                        }, function() { // err_insert, insert_result
                            winston.debug('recording crm send error');
                        });
                        return;
                    }
                    winston.debug('sent message to CRM');
                });
            });

            callback();
        },

        'process_survey': function(callback) {
            general_util.runInBackground(function() {
                survey_util.onMessageThreadStart(caller, message_info, function(err_survey) {
                    if(err_survey) {
                        winston.error('while processing survey for message ' + message_info.message_id + ': ' + err_survey);
                    }

                });
            });

            callback();
        }

    }, function(err_async, async_result) {

        if(err_async) {
            res.send(err_async, 500);
            return;
        }

        res.send(message_info, 200);
    });
}

function _handleReplyMessagePut(req, res, type) {
    var caller = user_util.getCaller(req);

    var text = req.param('text');
    if(_.isUndefined(text)) { // allow the text to be falsy
        res.send('text not supplied', 500);
        return;
    }

    var file_info = [];

    if(req.files && req.files.file) {
        file_info.push({
            name: req.files.file.name,
            size: req.files.file.size,
            type: req.files.file.type
        })
    }

    var attachment_suffix = '';
    if(req.body.attachments) {
        attachment_suffix += '\n\nAttachments: ';
        _.each(req.body.attachments, function(attachment) {
            file_info.push({
                name: attachment.name,
                size: attachment.size,
                type: attachment.type,
                link: attachment.link
            });
            attachment_suffix += "\n" + attachment.link;
        });
    }

    var message_info = {
        text: text,
        type: type,
        files: file_info,
        created: new Date(),
        last_update: new Date(),
        state: 'sent'
    };

    var reply_to_id = req.param('reply_to');
    if(!reply_to_id) {
        res.send('reply_to id not provided', 500);
        return;
    }

    message_info.reply_to = reply_to_id;

    var user = {};
    var message_root;

    async.series({

        'user': function(callback) {
            if(_.isUndefined(caller)) {
                winston.error('a user attempted to send a message but was not authenticated');
                callback('cannot send message without being authenticated');
                return;
            }

            user = caller;
            message_info.user_id = caller._id.toLowerCase();
            message_info.email = caller.email;
            callback();
        },

        'crm_message': function(callback) {
            message_database.crm_messages.findOne({_id: ObjectID(reply_to_id)}, function(err_crm, crm_message_result) {
                if(err_crm) {
                    winston.error('an error occurred while getting crm message  ' + reply_to_id + ' when processing a user reply');
                    callback(err_crm);
                    return;
                }

                if(!crm_message_result) {
                    winston.error('crm message ' + reply_to_id + ' not found when processing a reply');
                    general_util.send404(res, 'crm message not found');
                    return;
                }

                message_info.reply_to = reply_to_id;
                message_info.root_message = crm_message_result.root_message;
                message_info.subject = crm_message_result.subject;

                if(!message_info.root_message) {
                    winston.error('could not build thread for reply to crm message ' + reply_to_id);

                    message_database.crm_errors.insert({
                        message: message_info,
                        processed_at: new Date(),
                        error: 'reply-threading: crm message ' + reply_to_id + ' had no root defined'
                    }, function(err_insert) { // insert_result
                        winston.debug('recording crm send error: ' + err_insert);
                        callback('no thread root found');
                    });
                    return;
                }

                callback();
            });
        },

        'get_properties_from_thread_root': function(callback) {
            message_database.user_messages.findOne({_id: ObjectID(message_info.root_message)}, function(err_root, root_result) {
                if(err_root) {
                    winston.error('an error occurred while getting root message  ' + message_info.root_message + ' when processing a user reply');
                    callback(err_root);
                    return;
                }

                if(!root_result) {
                    winston.error('root message ' + message_info.root_message + ' not found when processing a reply');
                    general_util.send404(res, 'root message not found');
                    return;
                }

                message_root = root_result;
                message_info.brand = root_result.brand;
                message_info.brand_name = root_result.brand_name;
                message_info.ean = root_result.ean;
                message_info.product_name = root_result.product_name;
                message_info.target = root_result.target;
                callback();
            });
        },

        'file': function(callback) {
            if(!req.files || !req.files.file) {
                callback();
                return;
            }

            callback(null, req.files.file);
        },

        'store_message': function(callback) {
            message_util.storeMessage(req, message_info, function(err_insert, insert_result) {
                if (err_insert) {
                    callback(err_insert);
                    return;
                }
                callback(err_insert, insert_result);
            });
        },

        'add_reply_to_thread_root': function(callback) {
            var replies_count = message_root.user_replies ? message_root.user_replies.length + 1 : 1;

            message_database.user_messages.update(
                {
                    _id: message_root._id
                },
                {
                    $push: {
                        user_replies: {
                            id: message_info.message_id,
                            text: message_info.text,
                            created: message_info.created
                        }
                    },
                    $set: {
                        user_replies_count: replies_count
                    }
                }, function(err_root, root_result) {
                    callback(err_root, root_result);
                }
            );
        }

    }, function(err_async, async_result) {

        if(err_async) {
            res.send(err_async, 500);
            return;
        }
        message_info.text += attachment_suffix;
        general_util.runInBackground(function() {

            // try for 5 minutes to send the message to the CRM (with 30 second delays between)
            _sendToCRMWithRetries(user, message_info, async_result.file, MAX_CRM_SEND_ATTEMPTS, 30000, function(err_send) { // , send_result
                if(err_send) {
                    winston.error('an error occurred when sending message to CRM: ' + err_send);

                    var message = {
                        body: text.substring(0, Math.min(500, text.length))
                    };
                    message_database.crm_errors.insert({
                        message: message,
                        processed_at: new Date(),
                        error: 'email-service-issue: when sending on behalf of user with email ' + caller.email + ': ' + err_send
                    }, function(err_insert) { // , insert_result
                        winston.debug('recording crm send error: ' + err_insert);
                    });
                }
            });
        });

        res.send('{"result": "ok"}', 200);
    });
}

function _handleGetUnread(req, res) {
    var caller = user_util.getCaller(req);

    if(_.isUndefined(caller)) {
        res.send('must be logged in', 500);
        return;
    }

    var query = {
        state: 'unread'
    };
    query.user_id = caller._id.toLowerCase();

    var unread_messages;
    //winston.info(caller._id.toLowerCase());
    async.series({

        // make sure root_message exists for each
        'unread_ids': function(callback) {
            message_database.crm_messages.find(query).sort({created: -1}).limit(1000).toArray(function(err_messages, unread_results) {
                if(err_messages) {
                    winston.error('while getting unread crm messages, an error occurred: ' + err_messages);
                    res.send(err_messages, 500);
                    return;
                }
                //winston.info(query);
                //winston.info(unread_results);
                unread_messages = unread_results;
                if(!unread_messages) {
                    res.send([], 200);
                    return;
                }

                callback();
            });
        },

        'prune_threadless': function(callback) {
            var root_message_ids = _.map(unread_messages, function(unread) {
                //winston.info(unread.root_message);
                //return "ObjectId('"+unread.root_message+"')";
                return ObjectID(unread.root_message);
            });
            //winston.info("*****tostring*******");
            //winston.info(root_message_ids.toString());

            var root_query = {
                _id: {$in: root_message_ids},
                state: {$ne: 'archived'}
            };
            /*
             var root_message_ids = _.map(unread_messages, function(unread) {
             winston.info(unread.root_message);
             //return "ObjectId('"+unread.root_message+"')";
             return ObjectID(unread.root_message);
             });
             winston.info("*****tostring*******");
             winston.info(root_message_ids.toString());

             var root_query = {
             _id: '{$in:[' +root_message_ids.toString()+']}',
             state: "{$ne: 'archived'}"
             };

             var root_query = {};
             root_query._id = {$in: root_message_ids};
             root_query.state= {$ne: 'archived'};

            var root_query = {};
            root_query._id = '{$in:[' +root_message_ids.toString()+']}';
            root_query.state= "{$ne: 'archived'}";
            winston.info(root_query);
             */
            //message_database.user_messages.find(root_query, {_id: 1}).toArray(function(err_user_messages, user_messages) {
            message_database.user_messages.find(root_query).toArray(function(err_user_messages, user_messages) {
                if(err_user_messages) {
                    winston.error('while getting roots for unread crm messages, an error occurred: ' + err_user_messages);
                    res.send(err_user_messages, 500);
                    return;
                }
                /*
                winston.info("********");
                winston.info(root_query);
                winston.info("********");
                winston.info(user_messages);
                */
                if(!user_messages || user_messages.length == 0) {
                    res.send([], 200);
                    return;
                }

                var ids = _.map(user_messages, function(msg) { return msg._id.toHexString(); });
                /*
                winston.debug("***IDS******");
                winston.debug(ids);
                */
                var crm_messages_with_roots = _.filter(unread_messages, function(message) {
                    winston.debug(message.root_message);
                    return ids.indexOf(message.root_message.toLowerCase()) != -1;
                });
                /*
                winston.debug(crm_messages_with_roots);
                winston.debug("**********");
                */
                _.each(crm_messages_with_roots, function(message, index) {
                    crm_messages_with_roots[index] = _.omit(message, 'raw');
                });
                //winston.info(crm_messages_with_roots);
                res.send(crm_messages_with_roots, 200);
            });
        }
    });
}

function _handleMessageUpdate(req, res) {
    var id = req.param('id');

    // validate each id
    if (!general_util.isValidId(id)) {
        general_util.send404(res, 'invalid id');
        return;
    }

    var caller = user_util.getCaller(req);

    if(req.query['state']) {

        message_database.user_messages.findOne({_id: ObjectID(id)}, function (err_message, message) {
            if (err_message) {
                winston.error('while updating a message record, an error occurred: ' + err_message);
                res.send(err_message, 500);
                return;
            }

            if (!message) {
                general_util.send404(res);
                return;
            }

            // make sure caller has access to message
            if (!user_util.canEditUser(caller, message.user_id)) {
                general_util.send404(res);
                return;
            }

            var allowable_states = [ 'sent', 'archived' ];

            if (allowable_states.indexOf(req.query['state']) == -1) {
                res.send('invalid state', 500);
                return;
            }

            message_database.user_messages.update({
                _id: ObjectID(id)
            }, {
                $set: {
                    state: req.query['state']
                }
            }, function (err_update, update_result) {
                if (err_update) {
                    winston.error('while updating a message record state, an error occurred: ' + err_update);
                    res.send(err_update, 500);
                    return;
                }
                res.send(update_result, 200);
            });
        });
        return;
    }

    if(req.query['resolved']) {
        var resolved = !!req.query['resolved'];

        message_database.user_messages.update({
            _id: ObjectID(id)
        }, {
            $set: {
                resolved: resolved,
                resolved_at: new Date()
            }
        }, function (err_update, update_result) {
            if (err_update) {
                winston.error('while updating a message record resolution state, an error occurred: ' + err_update);
                res.send(err_update, 500);
                return;
            }

            if(resolved) {
                setTimeout(function() {
                    survey_util.onMessageThreadResolved(caller, id, function(err_survey) {

                    });
                }, 0);
            }

            res.send(update_result, 200);
        });
        return;
    }

    res.send('unknown operation', 500);
}

function _handleUpdateResponses(req, res) {
    if(req.query['state']) {
        var idList = req.param('idList');

        if(!idList) {
            res.send('id list must be provided', 500);
            return;
        }

        // validate each id
        var idListTokens = idList.split(','), found_invalid = false;
        idListTokens.forEach(function(id) {
             if(!general_util.isValidId(id) && !found_invalid) {
                 found_invalid = true;
                 res.send('id ' + id + ' is not valid', 500);
             }
        });
        if(found_invalid) {
            return; // we've already responded
        }

        var idsForMongo = _.map(idListTokens, function(id) { return ObjectID(id);});
        message_database.crm_messages.find({_id: {$in: idsForMongo}}).toArray(function(err_responses, responses) {
            if(err_responses) {
                winston.error('while finding responses in order to update responses, an error occurred: ' + err_responses);
                res.send(err_responses, 500);
                return;
            }

            if(responses.length == 0) {
                res.send('response not found', 500);
                return;
            }

            var caller = user_util.getCaller(req);

            // make sure caller has access to responses
            var found_unusable_response = false;
            _.each(responses, function(response) {
                if(!found_unusable_response && response.user_id.toLowerCase() != caller._id.toLowerCase()) {
                    found_unusable_response = true;
                    res.send('response ' + response._id.toHexString() + ' does not belong to caller', 500);
                }
            });
            if(found_unusable_response) {
                return; // we've already responded
            }

            message_database.crm_messages.update({
                _id: {$in: idsForMongo}
            }, {
                $set: {
                    state: req.query['state']
                }
            }, {
                multi: true
            }, function(err_update, update_result) {
                if(err_update) {
                    winston.error('while updating states of responses, an error occurred: ' + err_responses);
                    res.send(err_update, 500);
                    return;
                }
                res.send(update_result, 200);
            });
        });

    } else {
        res.send('unknown operation', 500);
    }
}

function _sendToCRMWithRetries(caller, message_info, file, tries, interval, callback2) {
    if(tries == 0) {
        callback2('max retries attempted');
        return;
    }

    _sendToCRM(caller, message_info, file, function(err_send, send_result) {
        if(err_send) {
            if(tries == 1) {
                callback2('max retries attempted');
                return;
            }

            setTimeout(function() {
                _sendToCRMWithRetries(caller, message_info, file, tries - 1, interval, callback2);
            }, interval);
            return;
        }
        callback2(null, send_result);
    });
}

function _sendToCRM(caller, message_info, file, callback2) {
    mail.connectOutbound(function(err_connect, connection) {
        if(err_connect) {
            winston.error('an error occurred while connecting to mail: ' + err_connect);
            callback2(err_connect);
            return;
        }

        var text = _buildCRMEmailBody(caller, message_info);
        var files = [];

        if(file) {
            var file_record = {
                path: file.path,
                name: file.name,
                type: file.type ? file.type : 'application/octet-stream'
            };
            files.push(file_record);
        }

        mail.send(connection,
            message_info.target,
            message_info.subject ? message_info.subject : 'Email Us',
            text,
            files,
            function(err_send, send_result) {
                if(err_send) {
                    winston.error('An error occurred while sending to the CRM: ' + err_send);
                }
                //connection.close();
                callback2(err_send, send_result);
            }
        );
    });
}

function _buildCRMEmailBody(user, message_info) {
    var text = "";

    var first_name = (user.first_name ? user.first_name : '');
    if(message_info.first_name) {
        first_name = message_info.first_name;
    }

    var last_name = (user.last_name ? user.last_name : '');
    if(message_info.last_name) {
        last_name = message_info.last_name;
    }

    text += "ActionApp\n";
    text += "First Name: " + first_name + '\n';
    text += "Last Name: " + last_name + '\n';
    text += "Address: " + (user.address ? user.address.street : '') + '\n';
    text += "City: " + (user.address ? user.address.city : '') + '\n';
    text += "Zip: " + (user.address ? user.address.zip : '') + '\n';
    text += "Email Address: " + (user.email ? user.email : '') + '\n';
    text += "Brand: " + message_info.brand_name + '\n';
    text += "Product UPC: " + message_info.ean + '\n';
    text += "Phone Number: " + (user.phone ? user.phone : '') + '\n';
    text += "Message ID: " + message_info.message_id + '\n';
    text += "ActionID: " + message_info.user_id + '\n';
    text += "Comment or Question: " + message_info.text;
    return text;
}

/*
Sample EPC Form:

 Email Us
 First Name: Liz
 Last Name: Shaver
 Email Address: liz.shaver@realdialog.com
 Phone Number: 614-508-6157
 Comment or Question: Test Example of an email form that would be sent to the CRM.
*/
/*
 The Action Form should look like:

 ActionApp
 First Name: Liz
 Last Name: Shaver
 Address:
 City:
 Zip:
 Email: liz.shaver@realdialog.com
 Product UPC: 12345
 Phone Number: 614-508-6157
 Message ID: <hex digits>
 Comment or Question: Test Example of an email form that would be sent to the CRM.
 */

