var request = require('request');

var values = require('./test-values');

module.exports = {

    sendRequest: function(url_suffix, method, body, headers, on_response) {
        request({
            method: method,
            url: 'http://localhost:' + values.server_port + url_suffix,
            headers: headers,
            json: body
        }, on_response);
    }

};