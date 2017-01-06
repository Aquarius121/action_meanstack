
var user_util = require('../util/user-utils');

var audit_database = require('../database/instances/action-audit');
var feedback_database = require('../database/instances/action-feedback');

module.exports = {
    add_feedback: _handleAddFeedback,
    get_feedback: _handleGetFeedback
};

function _handleAddFeedback(req, res) {
    var caller = user_util.getCaller(req);

    var type = req.param('type');
    if(type == 'rating' || type == 'sentiment') {
        var page = req.param('page');
        if(!page) {
            res.send('page must be specified', 500);
            return;
        }

        var value = req.param('value');
        if(!value) {
            res.send('value must be specified', 500);
            return;
        }

        try {
            // TODO: parseFloat in our future?
            value = parseInt(value);
        } catch(ex) {
            res.send('value was not an integer', 500);
            return;
        }

        var audit_record = audit_database.generateAuditRecord(req, {
            'page': page,
            'value': value,
            'type': type
        });

        if(type == 'rating') {
            audit_database.reportEvent('page_ratings', audit_record);

        } else {
            audit_database.reportEvent('page_ratings', audit_record); // TODO: make new bucket
        }

        feedback_database.page_rating.update(
            {user: caller._id, page: page, type: type},
            {user: caller._id, page: page, value: value, type: type, rate_time: new Date()},
            {upsert: true},
            function(err_update) { // , update_result
                if(err_update) {
                    res.send(err_update, 500);
                    return;
                }
                res.send({result: 'ok'}, 200);
            }
        );

        return;
    }

    res.send('unrecognized type', 500);
}

function _handleGetFeedback(req, res) {
    var caller = user_util.getCaller(req);

    var type = req.param('type');
    if(type == 'rating' || type == 'sentiment') {
        var page = req.param('page');
        if(!page) {
            res.send('page must be specified', 500);
            return;
        }

        feedback_database.page_rating.findOne(
            {user: caller._id, page: page, type: type},
            function(err_rating, rating_result) {
                if(err_rating) {
                    res.send(err_rating, 500);
                    return;
                }
                res.send(rating_result, 200);
            }
        );

        return;
    }

    res.send('unrecognized type', 500);
}