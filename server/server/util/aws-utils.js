var _ = require('underscore');
var AWS = require('aws-sdk');
var config = require('config');
var fs = require('fs');
var winston = require('winston');

AWS.config.update({ accessKeyId: config['aws'].awsId, secretAccessKey: config['aws'].awsSecret, region: config['aws'].awsS3Region });

var database = require('../database/instances/product-info');

exports.file_upload = function(scope, file_info, type, callback2) {

    var s3 = new AWS.S3();
    winston.log('debug', 'while handling POST file upload, reading temp file');

    fs.readFile(file_info.path, function (err_read, fileData) {
        if(err_read) {
            winston.error('an error occurred while reading file during AWS file upload: ' + err_read);
            callback2(err_read);
            return;
        }

        //var nameTokens = file_info.name.split('.');
        //var extension = nameTokens[nameTokens.length - 1];
        //var serverFileName = general_utils.generateSnowflake() + '.' + extension;

        var bucket = config['aws']['bucket'];
        var key = type  + '/'  + file_info.name;

        winston.log('debug', 'while handling POST file upload, putting object');
        var params = { Bucket: bucket, Key: key, Body: fileData };

        s3.putObject(params, function(err_put) { // , data
            if(err_put) {
                winston.error('while handling POST file upload, an error occurred: ' + err_put);
                callback2(err_put);
                return;
            }

            var imageUrl = config['aws']['awsS3ImageURL'] + bucket + '/' + encodeURIComponent(key);
            database.files.insert({
                type: type, // TODO: we're missing scope (e.g. brand, brand-owner, etc)
                url: imageUrl
            }, function(err_insert, inserted_docs) {
                if(err_insert != null) {
                    winston.error('An error occurred while inserting into the file database: ' + err_insert);
                    callback2(err_insert);
                    return;
                }

                if(inserted_docs.length == 0) {
                    callback2('No file was added');
                    return;
                }

                //ActionAuditModule.report(caller, 'create', 'image', imageUrl);
                winston.info('while handling POST file upload, completed upload to ' + imageUrl);
                callback2(null, imageUrl);
            });
        });
    });
};

exports.file_delete = function(url, callback2) {

    var s3 = new AWS.S3();
    winston.log('debug', 'handling DELETE file from AWS');

    var params = {
        Bucket: config['aws']['bucket']
    };

    var bucket_string_index = url.indexOf(params.Bucket);
    if(bucket_string_index == -1) {
        callback2('resource was not in the proper bucket');
        return;
    }
    params.Key = url.substring(bucket_string_index + params.Bucket.length + 1, url.length);

    s3.deleteObject(params, callback2);
};

exports.files_delete = function(bucket_name, urls, callback2) {

    var s3 = new AWS.S3();
    winston.debug('handling DELETE file from AWS');

    // make sure all of the files to be erased are in our bucket
    var file_in_wrong_bucket = _.find(urls, function(url) {
        return url.indexOf(bucket_name) == -1;
    });
    if(file_in_wrong_bucket) {
        callback2(file_in_wrong_bucket + ' is not in this bucket');
        return;
    }

    // now, put things into a properly-formed object
    var key_objects = _.map(urls, function(url) {
        var bucket_string_index = url.indexOf(bucket_name);
        return {
            Key: url.substring(bucket_string_index + bucket_name.length + 1, url.length)
        };
    });

    var params = {
        Bucket: bucket_name,
        Delete: {
            Objects: key_objects
        }
    };

    s3.deleteObjects(params, function(err_delete, delete_result) {
        winston.debug('completed deleteObjects from s3');
        callback2(err_delete, delete_result);
    });
};