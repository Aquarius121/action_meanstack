var _ = require('underscore');
var async = require('async');
var winston = require('winston');

function Report() {

}

// OVERRIDE this!!
Report.prototype.getTypesToProcess = function(from_moment, to_moment, callback2) {
    callback2(null, []);
};

// OVERRIDE this!!
Report.prototype.processReportType = function(type, from_moment, to_moment, callback2) {
    callback2(null, []);
};

// OVERRIDE this!!
Report.prototype.queryResults = function(type, context, from_moment, to_moment, callback2) {
    callback2(null, []);
};

Report.prototype.processTimeframe = function(from_moment, to_moment, callback2) {
    var that = this;

    this.getTypesToProcess(from_moment, to_moment, function(err_types, types_to_process) {
        // generate reports for missing_reports
        var async_tasks = [];
        _.each(types_to_process, function(report_type) {
            async_tasks.push(function(callback) {
                that.processReportType(report_type, from_moment, to_moment, function(err_process, process_result) {
                    callback(err_process, process_result);
                });
            });
        });
        async.parallel(async_tasks, function(err_async, async_results) {
            callback2(err_async, async_results);
        });
    });
};

// results come back most recent first
Report.prototype.standardQuery = function(collection, type, context, from_moment, to_moment, callback2) {
    var report_query = [
        { type: type },
        { from_time: {$lt: to_moment.valueOf()} },
        { to_time: {$gt: from_moment.valueOf()} }
    ];

    // TODO: check context for brands array!
    // TODO: improve using aggregation

    var find_cursor = collection.find({
        $and: report_query
    }).sort({from_time: -1});

    if(context.limit) {
        find_cursor = find_cursor.limit(context.limit);
    }

    find_cursor.toArray(function(err_reports, reports) {
        if(err_reports) {
            callback2(err_reports);
            return;
        }

        find_cursor.close();

        if(context.brands) {
            _.each(reports, function(result, index) {
                reports[index].values = result.values.filter(function(value) {
                    return context.brands.indexOf(value.brand) != -1;
                });
            });
        }

        callback2(null, reports);
    });
};

module.exports = Report;