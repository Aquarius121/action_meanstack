var async = require('async');
var ObjectID = require('mongodb').ObjectID;

var general_util = require('../util/general-utils');
var survey_util = require('../util/survey-utils');
var user_util = require('../util/user-utils');

var audit_database = require('../database/instances/action-audit');
var feedback_database = require('../database/instances/action-feedback');

module.exports = {
    add_survey: _handleAddSurvey,
    update_survey: _handleUpdateSurvey,
    get_survey: _handleGetSurvey,

    add_survey_response: _handleAddSurveyResponse
};

function _handleAddSurvey(req, res) {
    // TODO: validate fields (exists, etc)

    feedback_database.survey.insert({
        type: req.param('type'),
        timestamp: new Date(),
        questions: req.param('questions'),
        submission_response: req.param('submission_response'),
        active: true
    }, function(err_insert) { // insert_result
        if(err_insert) {
            res.send(err_insert, 500);
            return;
        }
        res.send('{result: "ok"}', 200);
    });
}

function _handleUpdateSurvey(req, res) {
    if(!general_util.isValidId(req.param('id'))) {
        res.send('invalid id', 500);
        return;
    }

    feedback_database.survey.update(
        {
            _id: ObjectID(req.param('id'))
        },
        req.body,
        function(err_update, update_count) {
            if(err_update) {
                res.send(err_update, 500);
                return;
            }
            res.send(update_count, 200);
        }
    );
}

function _handleAddSurveyResponse(req, res) {
    // survey response:
    // - survey = req.param('id');
    // - answers:
    //     - question "text"
    //     - question "id"
    //     - text_response "text"
    //     - extra (any object type)
    // - survey type
    // - timestamp
    // - user

    var id = req.param('id');
    if(!general_util.isValidId(id)) {
        res.send('invalid id', 500);
        return;
    }

    var caller = user_util.getCaller(req);
    var survey = null;
    var response_record = null;

    async.series({
        'survey': function(callback) {
            feedback_database.survey.findOne({_id: ObjectID(req.param('id'))}, function(err_survey, survey_result) {
                if(err_survey) {
                    res.send(err_survey, 500);
                    return;
                }
                survey = survey_result;

                if(!survey) {
                    res.send('survey not found', 400);
                    return;
                }
                callback();
            });
        },

        'insert': function(callback) {
            var audit_record = audit_database.generateAuditRecord(req, {
                'survey_id': id,
                'survey_type': survey.type
            });

            audit_database.reportEvent('surveys', audit_record);

            response_record = {
                survey: id,
                answers: req.param('answers'),
                survey_type: survey.type,
                timestamp: new Date().valueOf(),
                user: caller._id
            };

            feedback_database.survey_response.insert(
                response_record,
                function(err_update) { // , update_result
                    if(err_update) {
                        callback(err_update);
                        return;
                    }
                    callback();
                }
            );
        },

        'hand_to_survey_manager': function(callback) {

            survey_util.onSurveyResponse(caller, survey, response_record, function(err_survey) {
                callback(err_survey);
            });
        }

    }, function(err_async) {
        if(err_async) {
            res.send(err_async, 500);
            return;
        }
        res.send({result: 'ok'}, 200);
    });
}

function _handleGetSurvey(req, res) {
    var caller = user_util.getCaller(req);

    var type = req.param('type');
    var user = req.param('user');
    var id = req.param('id');
    var active = req.param('active');
    var limit = req.param('limit');

    var query = {};

    if(type) {
        query.type = type;
    }

    if(user) {
        query.context = {
            user_id: user
        };
    }

    if(id) {

        if(!general_util.isValidId(id)) {
            res.send('invalid id', 500);
            return;
        }

        // get survey by id
        query._id = ObjectID(id);
    }

    if(Object.keys(query).length == 0) {
        res.send('no query keys provided', 500);
        return;
    }

    // this kinda sucks, but if the type isn't "app-sentiment", you have to provide a user id
    if(type != 'app-sentiment' && !user) {
        res.send('a user id must be provided for this survey type', 500);
        return;
    }

    // you also can't query users that aren't you
    if(user && user != caller._id) {
        res.send('cannot query for surveys intended for other users', 500);
        return;
    }

    if(active) {
        active = !!active;
        query.active = active;
    }

    // allow a custom limit, up to a point
    var query_limit = 10;
    if(limit) {
        var limit_as_int = parseInt(limit);
        if(!isNaN(limit_as_int)) {
            query_limit = Math.min(query_limit, limit_as_int);
        }
    }

    // query for most recent survey of type
    feedback_database.survey.find(query, {sort: [['timestamp', 'desc']]}).limit(query_limit).toArray(function(err_survey, survey) {
        if(err_survey) {
            res.send(err_survey, 500);
            return;
        }
        res.send(survey, 200);
    });
}
