// usage: npm install nodeunit -g
// run the app
// nodeunit integration.js

var _ = require('underscore');
var config = require('./test-config');
var emailjs = require("emailjs/email");
var utilities = require('./test-utilities');
var values = require('./test-values');

module.exports = {

    share_simple: function(test) {
        utilities.sendRequest('/message', 'PUT',
            {
                type: 'complaint',
                text: 'test from suite',
                ean: values.product_1_ean
            },
            {
                cookie: values.user_1_cookie
            },
            function (e, r, body) {
                if (e == null) {
                    test.expect(2);
                    test.ok(r.statusCode == 200, "successfully shared feedback");
                    if(body.length > 0 && body[0]._id) {
                        test.ok(true, "an id was returned");
                        values.message_id = body[0]._id;
                    } else {
                        test.ok(false, "an id was not returned");
                    }
                    test.done();
                    return;
                }

                test.ok(false, "failed to share feedback");
                test.done();
            }
        );
    }

    // test outbound email
    , outbound_simple: function(test) {
        var values = config['email']['outbound'];

        var server = emailjs.server.connect({
            host 	    : values.host,
            user 	    : values.user,
            password    : values.password,
            ssl		    : values.ssl,
            tls         : values.tls,
            port        : values.port
        });

        if(!server) {
            test.ok(false, 'could not connect to email server');
            test.done();
            return;
        }

        var text = "\ntest to app\n\n027516602A\n\n";
        text += "Message ID: " + values.message_id + "\nActionID: " + values.user_1_id + "\nEmail: guy@example.com";

        server.send({
            from         : config['email']['outbound'].sender,
            to           : config['email']['inbound'].user,
            subject      : 'Test Response #' + (new Date()).getTime(),
            text         : text
        }, function(err_send, send_result) {

            test.ok(!err_send, "sent outbound mail");
            test.done();
        });
    }
};
