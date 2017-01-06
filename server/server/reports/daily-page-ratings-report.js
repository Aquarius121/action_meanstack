var _ = require('underscore');
var async = require('async');
var winston = require('winston');

var reports_module = require('reports-using-mongo');
var GenericReport = reports_module.GenericReport;

var audit_database = require('../database/instances/action-audit');
var reports_database = require('../database/instances/action-report');

var types = {
    'ratings-totals': _handleRatingsTotals
};

DailyPageRatingsReportBuilder.prototype  = new GenericReport();
DailyPageRatingsReportBuilder.prototype.constructor = DailyPageRatingsReportBuilder;

function DailyPageRatingsReportBuilder(max_days_back) {
    GenericReport.prototype.constructor.call(this, types, reports_database.page_ratings, GenericReport.units.DAYS, max_days_back);
}

function _handleRatingsTotals(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily report for ' + type + ' from ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    var aggregation_pipeline = [
        {
            $group : {
                _id : { page: "$page", value: "$value" },
                count : { $sum : 1 }
            }
        },
        {
            $project: {
                page: '$_id.page',
                rating: {
                    value: '$_id.value',
                    count: '$count'
                },
                _id: 0
            }
        },
        {
            $group : {
                _id : "$page",
                ratings : { $push : "$rating" }
            }
        },
        {
            $project: {
                page: '$_id',
                ratings: '$ratings',
                _id: 0
            }
        }
    ];

    audit_database.page_ratings.aggregate(aggregation_pipeline,
        {
            //$limit: 10000,// top 10,000 enough?
            allowDiskUse: true
        },
        function(err_aggregate, aggregate_result) {
            if (err_aggregate) {
                winston.error('while processing daily ' + type + ' report: ' + err_aggregate);
                callback2(err_aggregate);
                return;
            }

            GenericReport.saveReport(reports_database.page_ratings, type, from_moment, to_moment, aggregate_result, callback2);
        }
    );
}

module.exports = DailyPageRatingsReportBuilder;