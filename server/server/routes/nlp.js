var _ = require('underscore');
var http = require('http');
var winston = require('winston');
var xml2js = require('xml2js').parseString;

module.exports = {
    train: _train,
    query: _query
};

function _query(req, res) {

    //<?xml version="1.0" encoding="utf-8"?>
    var body = '<SentimentRequest><Text>' + req.body.text + '</Text></SentimentRequest>';

    var postRequest = {
        host: 'www.astuteverbatim.com',
        path: '/nlp/epc/sentiment/predict?learnerName=markLearner',
        port: 80,
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml',
            'Content-Length': Buffer.byteLength(body)
        }
    };

    var http_request = http.request( postRequest, function( query_res )    {
        if(query_res.statusCode != 200) {
            res.send(query_res.message, query_res.statusCode);
            return;
        }

        var buffer = '';
        query_res.on( "data", function( data ) {
            buffer = buffer + data;
        } );
        query_res.on( "error", function(data) {
            console.log( 'error!');
            res.send(data, 500);
        });
        query_res.on( "end", function() {
            xml2js(buffer, function(err, xml_data) {
                if(_.isUndefined(xml_data['SentimentResponse'])) {
                    res.send('Could not retreive sentiment response', 500);
                    return;
                }

                if(_.isUndefined(xml_data['SentimentResponse']['Sentiment']) || xml_data['SentimentResponse']['Sentiment'].length == 0) {
                    res.send('Could not retreive sentiment', 500);
                    return;
                }

                if(_.isUndefined(xml_data['SentimentResponse']['Prob']) || xml_data['SentimentResponse']['Prob'].length == 0) {
                    res.send('Could not retreive sentiment probability', 500);
                    return;
                }

                var is_medical = _containsMedicalTerms(req.body.text);

                winston.debug('Processed NLP result for ' + req.body.text + ' = ' + xml_data['SentimentResponse']['Prob'][0] + ' ' + xml_data['SentimentResponse']['Sentiment'][0] + ' is_medical=' + is_medical);
                res.send({
                    probability: xml_data['SentimentResponse']['Prob'][0],
                    sentiment: xml_data['SentimentResponse']['Sentiment'][0],
                    is_medical: is_medical
                }, 200);
            });
        } );
    });

    http_request.write( body );
    http_request.end();
}

function _train(req, res) {
    if(_.isUndefined(req.body.sentiment)) {
        res.send('A sentiment must be provided', 500);
        return;
    }

    if(['neutral', 'positive', 'negative'].indexOf(req.body.sentiment.toLowerCase()) == -1) {
        res.send('A sentiment must be [positive, negative, neutral] (case insensitive)', 500);
        return;
    }

    if(_.isUndefined(req.body.text) || req.body.text == null || req.body.text.length == 0) {
        res.send('A text must be provided', 500);
        return;
    }

    //<?xml version="1.0" encoding="utf-8"?>
    var body = '<SentimentAddRequest><Text>' + req.body.text + '</Text><Sentiment>' +
        req.body.sentiment.substring(0, 1).toUpperCase() + req.body.sentiment.substring(1).toLowerCase() +
        '</Sentiment></SentimentAddRequest>';

    var postRequest = {
        host: 'www.astuteverbatim.com',
        path: '/nlp/epc/sentiment/add?learnerName=markLearner',
        port: 80,
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml',
            'Content-Length': Buffer.byteLength(body)
        }
    };

    var http_request = http.request( postRequest, function( query_res )    {
        if(query_res.statusCode != 200) {
            res.send(query_res.message, query_res.statusCode);
            return;
        }

        var buffer = '';
        query_res.on( "data", function( data ) {
            buffer = buffer + data;
        } );
        query_res.on( "error", function(data) {
            console.log( 'error!');
            res.send(data, 500);
        });
        query_res.on( "end", function() {
            xml2js(buffer, function(err, xml_data) {
                if(_.isUndefined(xml_data['SentimentAddResponse'])) {
                    res.send('Could not retreive sentiment response', 500);
                    return;
                }

                if(_.isUndefined(xml_data['SentimentAddResponse']['Message']) || xml_data['SentimentAddResponse']['Message'].length == 0) {
                    res.send('Could not retreive message', 500);
                    return;
                }
                winston.debug('Processed NLP training result for ' + req.body.text + ', ' + req.body.sentiment);
                res.send(xml_data['SentimentAddResponse']['Message'][0], 200);
            });
        } );
    });

    http_request.write( body );
    http_request.end();
}

function _containsMedicalTerms(text) {
    var medicalTerms = [
        'throat',
        'diarrhea',
        'breath',
        'itch',
        'hive',
        'rash',
        'bumps',
        'asthma',
        'cramp',
        'nausea',
        'fever',
        'swollen',
        'swelled',
        'bleed',
        'puke',
        'barf',
        'vomit',
        'hurl',
        'spew',
        'choke',
        'infected',
        'infection',
        'break out',
        'broke out',
        'allerg',
        'constipat',
        'pain' // hrm - take this out?
    ];

    // "each medical term does not appear in the text"
    var doesNotAppear = _.every(medicalTerms, function(medicalTerm) {
        return text.indexOf(medicalTerm) == -1;
    });

    return !doesNotAppear;
}