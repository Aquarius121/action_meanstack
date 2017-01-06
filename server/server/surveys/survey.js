
function Survey() {

}

// is called when the database that contains surveys is connected
Survey.prototype.onDatabaseConnected = function(database, callback2) {
    callback2();
};

// is called when a user presses the "resolved" button on a message thread
Survey.prototype.onMessageThreadResolved = function(caller, message_id, callback2) {
    callback2();
};

// is called after the survey response is inserted into the database
Survey.prototype.onSurveyResponse = function(caller, survey, survey_response, callback2) {
    callback2();
};

Survey.prototype.onMessageThreadStart = function(caller, message, callback2) {
    callback2();
};

module.exports = Survey;