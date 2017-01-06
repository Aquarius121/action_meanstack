var _ = require('underscore');
var fs = require('fs');
var winston = require('winston');
var config = require('config');

var aws_util = require('../util/aws-utils');
var database = require('../database/instances/product-info');
var general_utils = require('../util/general-utils');

exports.coupon_upload = function(req, res) {

    // first, make sure the EAN is found
    database.ean.findOne({ean: req.param('ean')}, function(err, product) {
        if(err != null) {
            res.send(err, 500);
            return;
        }

        if(product == null) {
            res.send('No product was found for the supplied EAN', 200);
            return;
        }

        aws_util.file_upload('', req.files.file, "coupon", function(err_upload, upload_result) {
            if(err_upload) {
                winston.log('error', 'while handling POST coupon upload, an error occurred: ' + err);
                res.send(err, 500);
                return;
            }

            database.coupons.insert({
                ean: req.param('ean'),
                type: req.param('type'),
                url: upload_result
            }, function(err, inserted_docs) {
                if(err != null) {
                    res.send('An error occurred: ' + err, 500);
                    return;
                }
                if(inserted_docs.length == 0) {
                    res.send('No coupon was added', 500);
                    return;
                }

                winston.log('info', 'while handling POST coupon upload, completed upload to ' + upload_result);
                res.send(upload_result, 200);
            });
        });
    });
};
