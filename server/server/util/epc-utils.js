var request = require('request');
var moment = require('moment');
var winston = require('winston');
var xml_writer = require('xml-writer');

module.exports = {
    getProducts : _getProducts
};

function _getProducts(callback2) {

    //https://www.npmjs.org/package/xml-writer
    var xml_builder = new xml_writer();

    var using_list_request = false;

    if(using_list_request) {
        xml_builder.startDocument();
        xml_builder.startElement('CategoryCodeListGetRequest');
        xml_builder.writeAttribute('Method', 'Browse');
        xml_builder.writeAttribute('Type', 'Get');
        xml_builder.writeAttribute('UserName', 'marbro');
        xml_builder.writeAttribute('Password', 'marbro');
        xml_builder.writeAttribute('company_id', 'SYS');
        xml_builder.startElement('ResponseFormat');
        xml_builder.startElement('CategoryCodeList');
        xml_builder.writeAttribute('UserLanguageID', 'en');
        xml_builder.writeAttribute('Version', '6.1.0');
        xml_builder.startElement('CategoryCode');
        xml_builder.writeAttribute('company_id', 'SYS');
        xml_builder.writeAttribute('category_id', 'C01');
        xml_builder.writeAttribute('active', 'Y');
        xml_builder.writeAttribute('code', 'A100');
        xml_builder.endDocument();
    } else {
        xml_builder.startDocument();
        xml_builder.startElement('CategoryCodeList');
        xml_builder.writeAttribute('UserName', 'marbro');
        xml_builder.writeAttribute('Password', 'marbro');
        xml_builder.writeAttribute('UserLanguageID', 'en');
        xml_builder.writeAttribute('Version', '6.1.0');
        xml_builder.startElement('CategoryCode');
        xml_builder.writeAttribute('company_id', 'SYS');
        xml_builder.writeAttribute('category_id', 'C01');
        xml_builder.writeAttribute('active', 'Y');
        xml_builder.endDocument();
    }

    try {
        var xml_string = xml_builder.toString() + '\n';
        //xml_string = xml_string.substring(xml_string.indexOf('\n') + 1, xml_string.length);
        winston.debug(xml_string);
        var options = {
            method: 'POST',
            url: 'https://demo.myastutesolutions.com/cpg/PCAS/Request.aspx'
        };
        var req = request(options, function(error, response, body) {
            var str = '';
            console.log(body);

            /*
            response.on('data', function (chunk) {
                str += chunk.toString('utf8');
            });

            response.on('error', function (e) {
                console.log(e);
            });

            response.on('end', function () {
                console.log(str);
            });
            */
        });
        req.write(xml_string);
        req.end();
    } catch(ex) {
        console.log(ex.stack);
    }
}

_getProducts(function(err_products, products) {

});