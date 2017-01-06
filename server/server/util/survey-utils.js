var _ = require('underscore');
var async = require('async');

var survey_app_sentiment = require('../surveys/app-sentiment');
var survey_resolved_sentiment = require('../surveys/resolved-sentiment');

var surveys = [
    new survey_app_sentiment.survey(),
    new survey_resolved_sentiment.survey()
];

module.exports = {

    onDatabaseConnected: _onDatabaseConnected,
    onMessageThreadStart: _onMessageThreadStart, // does not apply to replies, etc
    onMessageThreadResolved: _onMessageThreadResolved,
    onSurveyResponse: _onSurveyResponse
};

function _onDatabaseConnected(database, callback2) {
    var tasks = [];

    surveys.forEach(function(survey) {
        tasks.push(function(callback) {
            survey.onDatabaseConnected(database, callback);
        });
    });

    async.series(tasks, function(err_async) {
        callback2(err_async);
    });
}

function _onMessageThreadStart(caller, message, callback2) {
    var tasks = [];

    surveys.forEach(function(survey) {
        tasks.push(function(callback) {
            survey.onMessageThreadStart(caller, message, callback);
        });
    });

    async.series(tasks, function(err_async) {
        callback2(err_async);
    });
}

function _onMessageThreadResolved(caller, message_id, callback2) {
    var tasks = [];

    surveys.forEach(function(survey) {
        tasks.push(function(callback) {
            survey.onMessageThreadResolved(caller, message_id, callback);
        });
    });

    async.series(tasks, function(err_async) {
        callback2(err_async);
    });
}

function _onSurveyResponse(caller, survey, response_record, callback2) {
    var tasks = [];

    surveys.forEach(function(survey) {
        tasks.push(function(callback) {
            survey.onSurveyResponse(caller, survey, response_record, callback);
        });
    });

    async.series(tasks, function(err_async) {
        callback2(err_async);
    });
}