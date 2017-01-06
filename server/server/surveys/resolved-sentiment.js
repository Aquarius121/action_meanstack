var async = require('async');
var moment = require('moment');
var ObjectID = require('mongodb').ObjectID;
var winston = require('winston');

var survey = require('./survey');

var action_database = require('../database/instances/action');
var feedback_database = require('../database/instances/action-feedback');

ResolvedSentimentSurvey.prototype  = new survey();
ResolvedSentimentSurvey.prototype.constructor = ResolvedSentimentSurvey;

function ResolvedSentimentSurvey() {

}

ResolvedSentimentSurvey.prototype.onMessageThreadResolved = function(caller, message_id, callback2) {

    async.series({

        // make sure an active survey isn't already created
        'check_survey': function(callback) {

            feedback_database.survey.findOne({
                type: module.exports.type,
                'context.user_id': caller._id
            }, function (err_survey, survey) {
                if (err_survey) {
                    callback2(err_survey);
                    return;
                }

                // if there's already an active survey, don't make a new one
                if (survey && survey.active) {
                    callback2();
                    return;
                }

                callback();
            });
        },

        // ensure user exists and they don't have resolved_survey
        'check_user': function(callback) {

            action_database.user_account.findOne({
                _id: ObjectID(caller._id)
            }, function(err_user, user) {
                if(err_user) {
                    callback2(err_user);
                    return;
                }

                if(!user) {
                    callback2();
                    return;
                }

                if(user.resolved_survey) {
                    callback2();
                    return;
                }

                callback();
            });
        },

        // create the actual survey for the user
        'create_survey': function(callback) {
            winston.info('generating resolution survey for user ' + caller._id + ' (' + caller.email + ')');

            var start_time = moment.utc().add(2, 'minutes').valueOf();

            feedback_database.survey.insert({
                type: module.exports.type,
                active: true,
                after: start_time,
                static: false,
                title: 'Help Action! Improve',
                submission_response: 'thank you for your feedback',
                questions: [
                    {
                        text: 'please tell us about your action! experience',
                        type: 'emoticons'
                    }
                ],
                context: {
                    user_id: caller._id
                }
            }, function(err_insert) {
                callback2(err_insert);
            });
        }

    }, function(err_async) {
        // unreachable
    });


    // TODO: allow a mechanism that sets these surveys to "active = true" for a list of users
};

ResolvedSentimentSurvey.prototype.onSurveyResponse = function(caller, survey, survey_response, callback2) {

    if(survey_response.survey_type != 'resolved-sentiment') {
        callback2();
        return;
    }

    async.series({
        'update_survey': function(callback) {

            // flip the survey to inactive
            feedback_database.survey.update({
                _id: ObjectID(survey_response.survey)
            }, {
                $set: {
                    active: false
                }
            }, {
                upsert: true
            },function(err_update) {
                if(err_update) {
                    callback(err_update);
                    return;
                }

                // move on to next step
                callback();
            });
        },

        'update_user': function(callback) {
            action_database.user_account.update({
                _id: ObjectID(caller._id)
            }, {
                $set: {
                    resolved_survey: true
                }
            },
            function(err_update) {
                if(err_update) {
                    callback(err_update);
                    return;
                }

                callback();
            });
        }

    }, function(err_async) {
        callback2(err_async);
    });
};

module.exports = {
    survey: ResolvedSentimentSurvey,
    type: "resolved-sentiment"
};