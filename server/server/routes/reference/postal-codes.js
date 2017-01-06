var _ = require('underscore');
var moment = require('moment');
var winston = require('winston');

var file_line_reader = require('../../file-line-reader');
var general_util = require('../../util/general-utils');
var user_util = require('../../util/user-utils');

var reference_database = require('../../database/instances/action-reference');

module.exports = {
    get_postal_codes: _handlePostalCodeGet,
    get_latlon_by_postal_code: _handleLatLonByPostalCodeGet,
    read_postal_code_file: _initPostalCodes,
    query_postal_codes: _queryPostalCodes,
    upload_postal_codes: _uploadPostalCodes
};

function _handlePostalCodeGet(req, res) {
    if(!req.query.lat || !req.query.lon) {
        res.send('lat and lon must be specified', 500);
        return;
    }

    try {
        req.query.lat = parseFloat(req.query.lat);
        req.query.lon = parseFloat(req.query.lon);
    } catch(ex) {
        res.send('lat, lon must be floats', 500);
        return;
    }

    _queryPostalCodes(req.query.lat, req.query.lon, function(err_query, query_result) {
        if(err_query) {
            res.send(err_query, 500);
            return;
        }
        res.send(query_result, 200);
    });
}

function _handleLatLonByPostalCodeGet(req, res)
{
    reference_database.postal_code.findOne({ postal_code: req.param('postal_code') }, function(err_query, query_result) {
        if(err_query) {
            res.send(err_query, 500);
            return;
        }
        res.send(query_result, 200);
    });

}

function _uploadPostalCodes(req, res) {
    if(!req.files.file) {
        res.send('no file attached', 500);
        return;
    }

    general_util.runInBackground(function() {
        winston.info('running background process to import postal code file');
        winston.info('reading postal code info from ' + req.files.file.path);
        _initPostalCodes(req.files.file.path, 100, function(err_init, init_result) {
            if(err_init) {
                winston.error('failed to upload postal codes: ' + err_init);
                return;
            }
            winston.info('completed postal code update');
        });
    });
    res.send({result: 'ok'}, 200);
}

function _initPostalCodes(path, batch_size, callback2) {

    reference_database.postal_code.remove({}, function(err_remove, remove_result) {
        var reader = new file_line_reader.FileLineReader(path, 'utf8');

        general_util.recursiveWrapper(function() { _readNextLineBatch(reader, batch_size, callback2); });
    });
}

/*
 - geonames.org format:
 country code      : iso country code, 2 characters
 postal code       : varchar(20)
 place name        : varchar(180)
 admin name1       : 1. order subdivision (state) varchar(100)
 admin code1       : 1. order subdivision (state) varchar(20)
 admin name2       : 2. order subdivision (county/province) varchar(100)
 admin code2       : 2. order subdivision (county/province) varchar(20)
 admin name3       : 3. order subdivision (community) varchar(100)
 admin code3       : 3. order subdivision (community) varchar(20)
 latitude          : estimated latitude (wgs84)
 longitude         : estimated longitude (wgs84)
 accuracy          : accuracy of lat/lng from 1=estimated to 6=centroid
 */
function _readNextLineBatch(reader, batch_size, callback2) {
    var line_queue = [], next_line, line_tokens, lines = [];

    var reached_end = reader.grabBatch(batch_size, lines);

    if(lines.length > 0) {
        lines.forEach(function(next_line) {
            line_tokens = next_line.split('\t');

            if(line_tokens.length >= 12) {

                var postal_entry = {
                    country: line_tokens[0],
                    postal_code: line_tokens[1],
                    place_name: line_tokens[2],
                    admin_info: {
                        name1: line_tokens[3],
                        code1: line_tokens[4],
                        name2: line_tokens[5],
                        code2: line_tokens[6],
                        name3: line_tokens[7],
                        code3: line_tokens[8]
                    },
                    location: {
                        lat: line_tokens[9],
                        lng: line_tokens[10]
                    },
                    accuracy: line_tokens[11]
                };

                if(postal_entry.location.lat.length == 0 || postal_entry.location.lng.length == 0) {
                    return;
                }

                try {
                    postal_entry.location.lat = parseFloat(postal_entry.location.lat);
                    postal_entry.location.lng = parseFloat(postal_entry.location.lng);
                } catch(ex) {
                    winston.error('could not parse lat/lon for country ' + line_tokens[0]);
                }

                line_queue.push(postal_entry);
                //line_tokens[line_tokens.length - 1] = line_tokens[line_tokens.length - 1].trim();
            }
        });

        if(line_queue.length == 0) {
            general_util.recursiveWrapper(function() { _readNextLineBatch(reader, batch_size, callback2); });
            return;
        }

        reference_database.postal_code.insert(line_queue, function (err_insert, insert_result) {
            if(err_insert) {
                callback2(err_insert);
                return;
            }

            if(reached_end) {
                callback2();
                return;
            }

            general_util.recursiveWrapper(function() { _readNextLineBatch(reader, batch_size, callback2); });
        });
        return;
    }
    callback2();
}

function _queryPostalCodes(lat, lon, callback2) {
    reference_database.postal_code.aggregate([
        {
            $geoNear: {
                near: [lat, lon],
                distanceField: "dist.calculated",
                maxDistance: 2.0,
                query: {  },
                num: 3
            }
        }
    ], callback2);
}


/*
general_util.runWhenDbLoaded(reference_database, function() {
    // 40.724, -73.997
    _queryPostalCodes(40.072114, -83.124852, function(err_loc, loc) {

        console.log(loc);
    });
});
*/