var _ = require('underscore');
var async = require('async');
var winston = require('winston');

var reports_module = require('reports-using-mongo');
var GenericReport = reports_module.GenericReport;

var audit_database = require('../database/instances/action-audit');
var reports_database = require('../database/instances/action-report');

var types = {
    'lookup-totals': _buildLookupTotals
};

DailyActionStatisticsReportBuilder.prototype  = new GenericReport();
DailyActionStatisticsReportBuilder.prototype.constructor = DailyActionStatisticsReportBuilder;

function DailyActionStatisticsReportBuilder(max_days_back) {
    GenericReport.prototype.constructor.call(this, types, reports_database.product_queries, GenericReport.units.DAYS, max_days_back);
}

function _buildLookupTotals(type, from_moment, to_moment, callback2) {
    winston.debug('processing daily action statistics report for ' + type + ' from ' + from_moment.format('MM/DD HH:mm:ss') + ' to ' + to_moment.format('MM/DD HH:mm:ss'));

    audit_database.product_queries.aggregate([
            {
                $match: {
                    $and: [
                        { timestamp: {$gte: from_moment.valueOf()} },
                        { timestamp: {$lt: to_moment.valueOf()} }
                    ]
                }
            },
            {
                $group : {
                    _id : "$code",
                    count : { $sum : 1 },
                    scanned : {
                        $sum: {
                            $cond: {
                                if: {$eq: [ '$source', 'scan' ]},
                                then: 1,
                                else: 0
                            }
                        }
                    },
                    searched : {
                        $sum: {
                            $cond: {
                                if: {$eq: [ '$source', 'search' ]},
                                then: 1,
                                else: 0
                            }
                        }
                    },
                    code:           { $last: '$code' },
                    participates:   { $last: '$participates' },
                    product_name:   { $last: '$product_name' },
                    brand:          { $last: '$brand' },
                    brand_name:     { $last: '$brand_name' }
                }
            }
        ],
        { allowDiskUse: true },
        function(err_aggregate, aggregate_result) {
            if (err_aggregate) {
                callback2(err_aggregate);
                return;
            }

            var to_write = _.indexBy(aggregate_result, 'code');
            _.each(_.keys(to_write), function(key) {
                to_write[key] = _.omit(to_write[key], '_id');
            });

            GenericReport.saveReport(reports_database.product_queries, type, from_moment, to_moment, to_write, callback2);
        }
    );
}

module.exports = DailyActionStatisticsReportBuilder;