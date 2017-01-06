var async = require('async');
var winston = require('winston');

var ak_util = require('astute-knowledge-sdk');
var brand_util = require('../util/brand-utils');
var general_util = require('../util/general-utils');
var product_util = require('../util/product-utils');
var user_util = require('../util/user-utils');

module.exports = {
    get_session: _getSession,
    get_dialog_response: _getDialogResponse,
    get_dialog_history: _getDialogHistory,
    get_product_info: _getProductInfo
};

function _getFAQConfig(caller, ip, ean, brand, callback2) {
    var brand_info;

    async.series({
        'use_ean': function (callback) {
            if (!ean) {
                callback();
                return;
            }

            product_util.getProductData(caller, ip, ean, false, function (err, product_data) {
                if (err) {
                    callback(err);
                    return;
                }

                brand_info = product_data.brand;
                if (!brand_info) {
                    callback('brand not found for product');
                    return;
                }
                callback(null, brand_info);
            });
        },

        'use_brand': function (callback) {
            if (ean) {
                callback();
                return;
            }

            brand_util.getBrandData(caller, brand, function (err_brand, brand_result) {
                if (err_brand) {
                    callback(err_brand);
                    return;
                }

                brand_info = brand_result;
                if (!brand_info) {
                    callback('brand not found');
                    return;
                }

                if(!brand_info.faq) {
                    callback('brand not configured for FAQs');
                    return;
                }

                callback(null, brand_info.faq);
            });
        }
    }, function(err_async) {
        if(err_async) {
            callback2(err_async);
            return;
        }
        callback2(null, brand_info.faq);
    });
}

function _getSession(req, res) {
    var ean = req.param('ean');
    var brand = req.param('brand');

    if(!ean && !brand) {
        res.send('either a brand or ean must be provided', 500);
        return;
    }

    var caller = user_util.getCaller(req);
    var ip = general_util.getIPAddress(req);

    var faq_config;

    async.series({

        'get_config': function(callback) {
            _getFAQConfig(caller, ip, ean, brand, function(err_get, faq_config_result) {
                if(err_get) {
                    callback(err_get);
                    return;
                }

                if(!faq_config_result) {
                    callback('faq config not found');
                    return;
                }

                if(!faq_config_result.astute_knowledge_5 && !faq_config_result.astute_knowledge) {
                    callback('brand is not configured to use Astute Knowledge');
                    return;
                }

                faq_config = faq_config_result;
                callback();
            });
        },

        'talk_rd': function(callback) {
            if(!faq_config.astute_knowledge) {
                callback();
                return;
            }

            general_util.runInBackground(function() {
                ak_util.makeInitializeSessionRequest67(faq_config.astute_knowledge, function(err_call, call_result) {
                    if(err_call) {
                        winston.error('an error occurred while getting a session with astute knowledge 6+: ' + err_call);
                        res.send(err_call, 500);
                        return;
                    }
                    res.send(call_result, 200);
                });
            });
            // doesn't call final function of async.series
        },

        'talk_rd5': function(callback) {
            if(!faq_config.astute_knowledge_5) {
                callback();
                return;
            }

            general_util.runInBackground(function() {
                ak_util.makeInitializeSessionRequest5(faq_config.astute_knowledge_5, function(err_call, call_result) {
                    if(err_call) {
                        winston.error('an error occurred while getting a session with astute knowledge 5: ' + err_call);
                        res.send(err_call, 500);
                        return;
                    }
                    res.send(call_result, 200);
                });
            });
            // doesn't call final function of async.series
        }

    }, function(err_async, async_result) {
        if(err_async) {
            res.send(err_async, 500);
            return;
        }
        res.send(async_result, 200);
    });
}

function _getDialogResponse(req, res) {
    var ean = req.param('ean');
    var brand = req.param('brand');

    if(!ean && !brand) {
        res.send('either a brand or ean must be provided', 500);
        return;
    }

    var session_id = req.param('session-id');
    if(!session_id) {
        res.send('a valid session id must be provided', 500);
        return;
    }

    var utterance = req.param('utterance');
    if(!utterance) {
        res.send('an utterance must be provided', 500);
        return;
    }

    var question_id = req.param('question-id');

    var caller = user_util.getCaller(req);
    var ip = general_util.getIPAddress(req);
    var faq_config;

    async.series({
        'get_config': function(callback) {
            _getFAQConfig(caller, ip, ean, brand, function(err_get, faq_config_result) {
                if(err_get) {
                    callback(err_get);
                    return;
                }

                if(!faq_config_result.astute_knowledge_5 && !faq_config_result.astute_knowledge()) {
                    callback('brand is not configured to use Astute Knowledge');
                    return;
                }

                faq_config = faq_config_result;
                callback();
            });
        },

        'make_request': function(callback) {
            if(!faq_config.astute_knowledge) {
                callback();
                return;
            }
            ak_util.makeGetDialogRequest67(faq_config.astute_knowledge, session_id, utterance, question_id, function(err_call, call_result) {
                if(err_call) {
                    winston.error('an error occurred during dialog request to astute knowledge 6+: ' + err_call);
                    res.send(err_call, 500);
                    return;
                }
                res.send(call_result, 200);
            });
            // doesn't call final function of async.series
        },

        'make_request_5': function(callback) {
            if(!faq_config.astute_knowledge_5) {
                callback();
                return;
            }
            ak_util.makeGetDialogRequest5(faq_config.astute_knowledge_5, session_id, utterance, question_id, function(err_call, call_result) {
                if(err_call) {
                    winston.error('an error occurred during dialog request to astute knowledge 5: ' + err_call);
                    res.send(err_call, 500);
                    return;
                }
                res.send(call_result, 200);
            });
            // doesn't call final function of async.series
        }

    }, function(err_async) {
        if(err_async) {
            res.send(err_async, 500);
        }
    });
}

// TODO: nobody uses this directly
function _getProductInfo(req, res) {
    var ean = req.param('ean');

    var caller = user_util.getCaller(req);
    var ip = general_util.getIPAddress(req);

    _getFAQConfig(caller, ip, ean, undefined, function(err_config, faq_config_result) {
        if(err_config) {
            res.send(err_config, 500);
            return;
        }

        if(faq_config_result.astute_knowledge) {
            ak_util.getProductInfo67(faq_config_result, ean, function(err_product, product_result) {
                if(err_product) {
                    res.send(err_product, 500);
                    return;
                }
                res.send(product_result, 200);
            });
            return;
        }

        if(faq_config_result.astute_knowledge_5) {
            ak_util.getProductInfo5(faq_config_result, ean, function(err_product, product_result) {
                if(err_product) {
                    res.send(err_product, 500);
                    return;
                }
                res.send(product_result, 200);
            });
            return;
        }

        res.send('not found', 404); // TODO: maybe 500 -> not configured for ak?
    });
}

function _getDialogHistory(req, res) {
    var ean = req.param('ean');
    var brand = req.param('brand');

    if(!ean && !brand) {
        res.send('either a brand or ean must be provided', 500);
        return;
    }

    var session_id = req.param('session-id');
    if(!session_id) {
        res.send('a valid session id must be provided', 500);
        return;
    }

    var caller = user_util.getCaller(req);
    var ip = general_util.getIPAddress(req);
    var faq_config;

    async.series({
        'get_config': function(callback) {
            _getFAQConfig(caller, ip, ean, brand, function(err_get, faq_config_result) {
                if(err_get) {
                    callback(err_get);
                    return;
                }

                if(!faq_config_result.astute_knowledge_5 && !faq_config_result.astute_knowledge) {
                    callback('brand is not configured to use Astute Knowledge');
                    return;
                }

                faq_config = faq_config_result;
                callback();
            });
        },

        'make_request': function(callback) {
            if(!faq_config.astute_knowledge) {
                callback();
                return;
            }

            ak_util.makeGetDialogHistoryRequest67(faq_config.astute_knowledge, session_id, function(err_call, call_result) {
                if(err_call) {
                    winston.error('an error occurred during dialog history request to astute knowledge 6+: ' + err_call);
                    res.send(err_call, 500);
                    return;
                }
                res.send(call_result, 200);
            });
            // doesn't call final function of async.series
        },

        'make_request5': function(callback) {
            if(!faq_config.astute_knowledge_5) {
                callback();
                return;
            }

            ak_util.makeGetDialogHistoryRequest5(faq_config.astute_knowledge_5, session_id, function(err_call, call_result) {
                if(err_call) {
                    winston.error('an error occurred during dialog history request to astute knowledge 5: ' + err_call);
                    res.send(err_call, 500);
                    return;
                }
                res.send(call_result, 200);
            });
            // doesn't call final function of async.series
        }

    }, function(err_async) {
        if(err_async) {
            res.send(err_async, 500);
        }
    });
}
