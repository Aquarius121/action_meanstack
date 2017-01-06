var _ = require('underscore');
var winston = require('winston');

var reports_module = require('reports-using-mongo');
var GenericReport = reports_module.GenericReport;

var feedback_database = require('../database/instances/action-feedback');
var reports_database = require('../database/instances/action-report');

var types = {
    'app-sentiment-totals': _handleAppSentimentTotals
};

DailySurveyReportBuilder.prototype  = new GenericReport();
DailySurveyReportBuilder.prototype.constructor = DailySurveyReportBuilder;

function DailySurveyReportBuilder(max_days_back) {
    GenericReport.prototype.constructor.call(this, types, reports_database.surveys, GenericReport.units.DAYS, max_days_back);
}

function _handleAppSentimentTotals(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily report for ' + type + ' from ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    reports_module.AggregationUtils.aggregateOnField({
        match: {
            $and: [
                { timestamp: {$gte: from_moment.valueOf()} },
                { timestamp: {$lt: to_moment.valueOf()} },
                { survey_type: 'app-sentiment' }
            ]
        },
        unwind_property: 'answers',
        primary_property: 'answers.extra',
        audit_collection: feedback_database.survey_response

    }, function(err_aggregate, aggregate_result) {
        if (err_aggregate) {
            winston.error('while processing daily ' + type + ' report: ' + err_aggregate);
            callback2(err_aggregate);
            return;
        }

        aggregate_result = _.map(aggregate_result, function(item) {
            item.extra = item.answers.extra;
            delete item.answers;
            return item;
        });

        /*
        var to_write = {};
        _.each(aggregate_result, function(result) {
            to_write[result.extra] = result.count;
        });
        */

        GenericReport.saveReport(reports_database.surveys, type, from_moment, to_moment, aggregate_result, callback2);
    });
}

module.exports = DailySurveyReportBuilder;