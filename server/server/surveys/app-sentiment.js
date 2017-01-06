var async = require('async');
var winston = require('winston');

var survey = require('./survey');

var feedback_database = require('../database/instances/action-feedback');

AppSentimentSurvey.prototype  = new survey();
AppSentimentSurvey.prototype.constructor = AppSentimentSurvey;

function AppSentimentSurvey() {

}

AppSentimentSurvey.prototype.onDatabaseConnected = function(database, callback2) {
    // survey:
    // - type (e.g. "app sentiment", "product sentiment")
    // - timestamp
    // - title
    // - questions = []
    // - submission_response
    // - context (members optional)
    //     - user_id
    //     - product_id
    //     - brand_id
    // - before "valid until" (optional)
    // - after "valid after" (optional)
    // - active
    // - static

    // ensure an active app sentiment survey is in the system
    feedback_database.survey.update({
        type: 'app-sentiment',
        active: true
    }, {
        type: 'app-sentiment',
        questions: [
            {
                text: 'Please share more to help action! improve',
                type: 'emoticons'
            }
        ],
        title: 'Help Action! Improve',
        submission_response: 'Thank you for your feedback!',
        active: true,
        static: true
    }, {
        upsert: true
    }, function(err_update) {
        if(err_update) {
            winston.error('failed to upsert default app sentiment survey');
        }
    });
};

module.exports = {
    survey: AppSentimentSurvey,
    type: "app-sentiment"
};