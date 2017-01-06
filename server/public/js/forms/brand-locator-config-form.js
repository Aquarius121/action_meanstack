var brand_locator_config_form = (function() {
    var g_brand;
    var form_template_def =
        '<form class="form-horizontal">' +
            '<div class="form-group">' +
                '<label class="col-xs-12 col-sm-3 control-label">Source' +
                    '<div class="help-me-widget ui-tooltip" data-placement="bottom" data-original-title="The source from which product locations are found.">' +
                        '<i class="fa fa-question" style="margin-left: -1px;"></i>' +
                    '</div>' +
                '</label>' +
                '<div class="col-xs-12 col-sm-9">'  +
                    '<select class="form-control location-source">' +
                        '<option value="none">None</option>' +
                        '<option value="wilke" {{=(it.brand.locator && it.brand.locator.wilke && it.brand.locator.wilke ? "selected" : "")}}>Wilke Spot</option>' +
                        '<option value="iri" {{=(it.brand.locator && it.brand.locator.iri && it.brand.locator.iri ? "selected" : "")}}>IRI</option>' +
                        '<option value="google" {{=(it.brand.locator && it.brand.locator.google? "selected" : "")}}>Google</option>' +
                    '</select>' +
                '</div>' +
            '</div>' +
            '<div class="form-group">' +
                '<label class="col-xs-12 col-sm-3 control-label">Where-to-Buy Message' +
                    '<div class="help-me-widget ui-tooltip" data-placement="bottom" data-original-title="Where-to-Buy Message.">' +
                        '<i class="fa fa-question" style="margin-left: -1px;"></i>' +
                    '</div>' +
                '</label>' +
                '<div class="col-xs-12 col-sm-9">'  +
                    '<input class="form-control w2b-message" value="{{=(it.brand.locator && it.brand.locator.w2b_message) ? it.brand.locator.w2b_message : ""}}">' +
                '</div>' +
            '</div>'+
        '</form>';
    var message_template_def =
        '<div class="form-group source-group">' +
            '<label class="col-xs-12 col-sm-3 control-label">Message' +
                '<div class="help-me-widget ui-tooltip" data-placement="bottom" data-original-title="The source from which product locations are found.">' +
                    '<i class="fa fa-question" style="margin-left: -1px;"></i>' +
                '</div>' +
            '</label>' +
            '<div class="col-xs-12 col-sm-9">'  +
                '<input class="form-control participating-message" value="{{=(it.brand.locator && it.brand.locator.participating_message)?it.brand.locator.participating_message:""}}"/>'+
            '</div>' +
        '</div>';
    var wilke_template_def =
        '<div class="form-group source-group">' +
            '<label class="col-xs-12 col-sm-3 control-label">Customer ID' +
                '<div class="help-me-widget ui-tooltip" data-placement="bottom" data-original-title="The customer name to use with the Where To Buy service.">' +
                    '<i class="fa fa-question" style="margin-left: -1px;"></i>' +
                '</div>' +
            '</label>' +
            '<div class="col-xs-12 col-sm-9">'  +
                '<input class="form-control wilke-locator-customer" value="{{=(it.brand.locator && it.brand.locator.wilke && it.brand.locator.wilke.customer ? it.brand.locator.wilke.customer : "")}}">' +
            '</div>' +
        '</div>' +
        '<div class="form-group source-group">' +
            '<label class="col-xs-12 col-sm-3 control-label">Master EAN' +
                '<div class="help-me-widget ui-tooltip" data-placement="bottom" data-original-title="The EAN (13-digit) to use for requests to the Where To Buy service.  If supplied, this EAN will be used for all products belonging to this brand.">' +
                    '<i class="fa fa-question" style="margin-left: -1px;"></i>' +
                '</div>' +
            '</label>' +
            '<div class="col-xs-12 col-sm-9">'  +
                '<input class="form-control wilke-locator-ean" value="{{=(it.brand.locator && it.brand.locator.wilke && it.brand.locator.wilke.master_ean ? it.brand.locator.wilke.master_ean : "")}}">' +
            '</div>' +
        '</div>';

    var iri_template_def =
        '<div class="form-group source-group">' +
            '<label class="col-xs-12 col-sm-3 control-label">Client ID' +
                '<div class="help-me-widget ui-tooltip" data-placement="bottom" data-original-title="The customer id to use with the IRI location service.">' +
                    '<i class="fa fa-question" style="margin-left: -1px;"></i>' +
                '</div>' +
            '</label>' +
            '<div class="col-xs-12 col-sm-9">'  +
                '<input class="form-control iri-locator-client" value="{{=(it.brand.locator && it.brand.locator.iri && it.brand.locator.iri.client ? it.brand.locator.iri.client : "")}}">' +
            '</div>' +
        '</div>' +
        '<div class="form-group source-group">' +
            '<label class="col-xs-12 col-sm-3 control-label">Brand Site ID' +
                '<div class="help-me-widget ui-tooltip" data-placement="bottom" data-original-title="The brand id to use with the IRI location service.">' +
                    '<i class="fa fa-question" style="margin-left: -1px;"></i>' +
                '</div>' +
            '</label>' +
            '<div class="col-xs-12 col-sm-9">'  +
                '<input class="form-control iri-locator-brand" value="{{=(it.brand.locator && it.brand.locator.iri && it.brand.locator.iri.brand ? it.brand.locator.iri.brand : "")}}">' +
            '</div>' +
        '</div>';

    var form_template = doT.template(form_template_def);
    var wilke_template = doT.template(wilke_template_def);
    var iri_template = doT.template(iri_template_def);
    var message_template = doT.template(message_template_def);

    function init(container, brand) {
        g_brand = brand;
        container.html(form_template({brand: brand}));
        $( ".ui-tooltip" ).tooltip({});

        _processSelection(container, brand);

        container.find('select.location-source').change(function() {
            _processSelection(container, brand);
        });
    }

    function _processSelection(container, brand) {
        container.find('.source-group').remove();

        var selection = container.find('select.location-source').val();
        if(selection == 'wilke') {
            container.find('.form-horizontal').append(wilke_template({brand: brand}));
        } else if(selection == 'iri') {
            container.find('.form-horizontal').append(iri_template({brand: brand}));
        } else if(selection == 'none' && brand.participating)
        {
            container.find('.form-horizontal').append(message_template({brand: brand}));
        }
        $( ".ui-tooltip" ).tooltip({});
    }

    function getData(container) {
        var form_data = {};
        var selection = container.find('select.location-source').val();
        if(selection == 'wilke') {
            var locator_customer = container.find('input.wilke-locator-customer').val();
            if (locator_customer) {
                form_data.locator = { wilke: { customer: locator_customer } };

                var locator_master = container.find('input.wilke-locator-ean').val();
                if (locator_master && locator_master.length > 0) {
                    form_data.locator.wilke.master_ean = locator_master;
                }
            }
        } else if(selection == 'iri') {
            var locator_client = container.find('input.iri-locator-client').val();
            var locator_brand = container.find('input.iri-locator-brand').val();
            if (locator_client && locator_brand) {
                form_data.locator = {
                    iri: {
                        client: locator_client,
                        brand: locator_brand
                    }
                };
            }
        } else if(selection == 'google') {
            form_data.locator = {
                google : true
            };
        } else if(selection == 'none' && g_brand.participating){
            var message_val = container.find('input.form-control.participating-message').val();
            form_data.locator = {
                participating_message: message_val
            };
        }
        var w2bmessage = container.find('input.form-control.w2b-message').val();
        if(form_data.locator)
            form_data.locator.w2b_message = w2bmessage;
        else {
            form_data.locator = {
                w2b_message: w2bmessage
            };
        }

        return form_data;
    }

    // validates the data produced by getData
    function validateData(form_data) {
        var errors = [];
        return errors;
    }

    return {
        init: init,
        getData: getData,
        validateData: validateData
    }

}());

$(function() {
});