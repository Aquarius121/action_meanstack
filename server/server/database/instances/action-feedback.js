var config = require('config');
var winston = require('winston');

var database = require('./../database');
var survey_util = require('../../util/survey-utils');

var db = database.init(config['feedback_database'], _onConnected);

exports.page_rating = db.collection('page-rating');
exports.survey = db.collection('survey');
exports.survey_response = db.collection('survey-response');

exports.db = db;

function _onConnected() {
    exports.page_rating.ensureIndex({user: 1, type: 1}, {background: true, unique: false}, function(err) {});
    exports.survey.ensureIndex({timestamp: 1, type: 1, active: 1}, {background: true, unique: false}, function(err) {});
    exports.survey_response.ensureIndex({user: 1, timestamp: 1, type: 1}, {background: true, unique: false}, function(err) {});

    survey_util.onDatabaseConnected(db, function(err_survey) {
        winston.error('while processing onDatabaseConnected for surveys: ' + err_survey);
    });
}
