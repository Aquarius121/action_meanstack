var _ = require('underscore');
var winston = require('winston');

var MongoDB             = require('mongodb').Db;
var Server              = require('mongodb').Server;

module.exports = {
    init: _init,
    query: _query,
    repair: _repair,
    compact: _compact
};

function _init(config_item, onConnected) {

    var db = new MongoDB(config_item.name, new Server(config_item.host, config_item.port, {auto_reconnect: true}), {w: 1});
    db.open(function(e, data){
        if (e) {
            winston.error('failed to open database ' + config_item.name + ': ' + e);
        } else{
            winston.info('connected to database :: ' + config_item.name + ' ... authenticating...');
            data.authenticate(config_item.user, config_item.password,function(err2,data2){
                if(data2){
                    winston.info("database authentication for " + config_item.name + " successful");
                    onConnected();
                } else {
                    winston.error('database authentication for ' + config_item.name + ' failed: ' + err2);
                }
            });
        }
    });
    return db;
}

// query_info = page, pageSize, query, fields, sort_by
// fields MUST BE PROVIDED (i.e. you must mind materialization)
function _query(collection, query_info, callback2) {
    var page = query_info['page'];
    var pageSize = query_info['pageSize'];

    if(page && pageSize) {
        try {
            pageSize = parseInt(pageSize);
            page = parseInt(page);

            var sort = query_info['sort_by'];

            collection.find(query_info.query).count(function(err_count, count) {
                if(err_count) {
                    callback2('could not count samples: ' + err_count);
                    return;
                }

                // make new attribute during aggregation that is a lower-case copy of the attribute
                // do it only for sorted fields.  Then, modify the sort struct to refer to the new field(s)
                if(!query_info.case_sensitive) {
                    _.each(_.keys(sort), function(sort_field) {
                        var field_name = sort_field + '_lwr';
                        field_name = field_name.replace(/\./gm,"_");

                        var aggregation_name = "$" + sort_field;

                        query_info.fields[field_name] = { "$toLower": aggregation_name};

                        sort[field_name] = sort[sort_field];
                        delete sort[sort_field];
                    });
                }

                var aggregation_values = [];

                if(_.keys(query_info.query).length > 0) {
                    aggregation_values.push({ $match: query_info.query });
                }

                // apply "fields" / materialization
                if(_.keys(query_info.fields).length > 0) {
                    aggregation_values.push({ $project: query_info.fields });
                }

                // apply sorting
                if(sort && _.keys(sort).length > 0) {
                    aggregation_values.push({ $sort: sort });
                }

                // do paging
                aggregation_values.push({ $skip: page * pageSize });
                aggregation_values.push({ $limit: pageSize });

                collection.aggregate(
                    aggregation_values,
                    {
                        allowDiskUse: true
                    }, function(err_result, result) {
                        callback2(null, {rows: result, total_records: count}, 200);
                    }
                );
            });
        } catch (ex) {
            callback2('could not parse page and page size');
        }
        return;
    }

    collection.find(query_info.query, query_info.fields).toArray(callback2);
}

function _repair(db, callback2) {
    winston.info('began repairing database ' + db.db.databaseName);
    db.db.command({repairDatabase: 1}, function(err_command, command_result) {
        if(command_result && !command_result.ok) {
            winston.error('failed to repair database: ' + command_result.errmsg);
            callback2(command_result.errmsg);
            return;
        }
        winston.info('finished repairing database ' + db.db.databaseName);
        callback2(err_command, command_result);
    });
}

function _compact(db, collection_name, callback2) {
    winston.info('began compacting collection ' + collection_name + ' on database ' + db.db.databaseName);
    db.db.command({compact: collection_name}, function(err_command, command_result) {
        if(command_result && !command_result.ok) {
            winston.error('failed to compact collection: ' + command_result.errmsg);
            callback2(command_result.errmsg);
            return;
        }
        winston.info('finished compacting collection ' + collection_name + ' on database ' + db.db.databaseName);
        callback2(err_command, command_result);
    });
}