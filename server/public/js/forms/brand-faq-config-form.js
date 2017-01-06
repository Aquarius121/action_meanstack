var brand_faq_config_form = (function() {

    // provides a list of sources
    var form_template_def =
        '<form class="form-horizontal">' +
            '<div class="form-group">' +
                '<label class="col-xs-12 col-sm-3 control-label">Source' +
                    '<div class="help-me-widget ui-tooltip" data-placement="bottom" data-original-title="The source from which product FAQs are found.">' +
                        '<i class="fa fa-question" style="margin-left: -1px;"></i>' +
                    '</div>' +
                '</label>' +
                '<div class="col-xs-12 col-sm-9">'  +
                    '<select class="form-control faq-source">' +
                        '<option value="none">Action</option>' +
                        '<option value="wilke" {{=(it.brand.faq && it.brand.faq.wilke && it.brand.faq.wilke ? "selected" : "")}}>Wilke Enlight</option>' +
                        '<option value="astute-knowledge5" {{=(it.brand.faq && it.brand.faq.astute_knowledge_5 ? "selected" : "")}}>Astute Knowledge v5</option>' +
                        '<option value="astute-knowledge" {{=(it.brand.faq && it.brand.faq.astute_knowledge ? "selected" : "")}}>Astute Knowledge</option>' +
                    '</select>' +
                '</div>' +
            '</div>' +
        '</form>';

    // provides interesting wilke properties
    var wilke_template_def =
        '<div class="form-group faq-source-group">' +
            '<label class="col-xs-12 col-sm-3 control-label">Wilke Enlight Tenant' +
                '<div class="help-me-widget ui-tooltip" data-placement="bottom" data-original-title="The tenant/customer name to use with Wilke\'s Enlight FAQ service.">' +
                    '<i class="fa fa-question" style="margin-left: -1px;"></i>' +
                '</div>' +
            '</label>' +
            '<div class="col-xs-12 col-sm-9">'  +
                '<input class="form-control enlight-tenant" value="{{=(it.brand.faq && it.brand.faq.wilke && it.brand.faq.wilke.enlight_tenant ? it.brand.faq.wilke.enlight_tenant : "")}}">' +
            '</div>' +
        '</div>' +
        '<div class="form-group faq-source-group">' +
            '<label class="col-xs-12 col-sm-3 control-label">View ID' +
                '<div class="help-me-widget ui-tooltip" data-placement="bottom" data-original-title="The view ID to use with Wilke\'s Enlight FAQ service.">' +
                    '<i class="fa fa-question" style="margin-left: -1px;"></i>' +
                '</div>' +
            '</label>' +
            '<div class="col-xs-12 col-sm-9">'  +
                '<input class="form-control enlight-view-id" value="{{=(it.brand.faq && it.brand.faq.wilke && it.brand.faq.wilke.view_id ? it.brand.faq.wilke.view_id : "")}}">' +
            '</div>' +
        '</div>' +
        '<div class="form-group faq-source-group">' +
            '<label class="col-xs-12 col-sm-3 control-label">Category Doc Type ID' +
                '<div class="help-me-widget ui-tooltip" data-placement="bottom" data-original-title="The doc type ID to use with Wilke\'s Enlight FAQ service.">' +
                    '<i class="fa fa-question" style="margin-left: -1px;"></i>' +
                '</div>' +
            '</label>' +
            '<div class="col-xs-12 col-sm-9">'  +
                '<input class="form-control enlight-doc-type-id" value="{{=(it.brand.faq && it.brand.faq.wilke && it.brand.faq.wilke.doc_type_id ? it.brand.faq.wilke.doc_type_id : "")}}">' +
            '</div>' +
        '</div>' +
        '<div class="form-group faq-source-group">' +
            '<label class="col-xs-12 col-sm-3 control-label">Brand Keyword' +
                '<div class="help-me-widget ui-tooltip" data-placement="bottom" data-original-title="The brand keyword to use with Wilke\'s Enlight FAQ service.">' +
                    '<i class="fa fa-question" style="margin-left: -1px;"></i>' +
                '</div>' +
            '</label>' +
            '<div class="col-xs-12 col-sm-9">'  +
                '<input class="form-control enlight-brand-keyword" value="{{=(it.brand.faq && it.brand.faq.wilke && it.brand.faq.wilke.brand_keyword ? it.brand.faq.wilke.brand_keyword : "")}}">' +
            '</div>' +
        '</div>';


    var astute_knowledge_template_def =
        '<div class="form-group source-group">' +
            '<label class="col-xs-12 col-sm-3 control-label">Knowledge Base' +
                '<div class="help-me-widget ui-tooltip" data-placement="bottom" data-original-title="The knowledge base to use with Astute Knowledge version 6 or newer.">' +
                    '<i class="fa fa-question" style="margin-left: -1px;"></i>' +
                '</div>' +
            '</label>' +
            '<div class="col-xs-12 col-sm-9">'  +
                '<input class="form-control astute-knowledge-knowledge-base" value="{{=(it.brand.faq && it.brand.faq.astute_knowledge && it.brand.faq.astute_knowledge.knowledge_base ? it.brand.faq.astute_knowledge.knowledge_base : "")}}">' +
            '</div>' +
        '</div>' +
        '<div class="form-group source-group">' +
            '<label class="col-xs-12 col-sm-3 control-label">SOAP URI' +
                '<div class="help-me-widget ui-tooltip" data-placement="bottom" data-original-title="The SOAP URI to use with Astute Knowledge version 6 or newer.">' +
                    '<i class="fa fa-question" style="margin-left: -1px;"></i>' +
                '</div>' +
            '</label>' +
            '<div class="col-xs-12 col-sm-9">'  +
                '<input class="form-control astute-knowledge-uri" value="{{=(it.brand.faq && it.brand.faq.astute_knowledge && it.brand.faq.astute_knowledge.uri ? it.brand.faq.astute_knowledge.uri : "")}}">' +
            '</div>' +
        '</div>' +
        '<div class="form-group source-group">' +
            '<label class="col-xs-12 col-sm-3 control-label">Secret Key' +
                '<div class="help-me-widget ui-tooltip" data-placement="bottom" data-original-title="The secret key to use with Astute Knowledge version 6 or newer.">' +
                    '<i class="fa fa-question" style="margin-left: -1px;"></i>' +
                '</div>' +
            '</label>' +
            '<div class="col-xs-12 col-sm-9">'  +
                '<input type="password" class="form-control astute-knowledge-secret-key" value="{{=(it.brand.faq && it.brand.faq.astute_knowledge && it.brand.faq.astute_knowledge.secret_key ? it.brand.faq.astute_knowledge.secret_key : "")}}">' +
            '</div>' +
        '</div>' +
        '<div class="form-group source-group">' +
            '<label class="col-xs-12 col-sm-3 control-label">Default Touchpoint' +
                '<div class="help-me-widget ui-tooltip" data-placement="bottom" data-original-title="The default touchpoint to use with Astute Knowledge version 6 or newer.">' +
                    '<i class="fa fa-question" style="margin-left: -1px;"></i>' +
                '</div>' +
            '</label>' +
            '<div class="col-xs-12 col-sm-9">'  +
                '<input class="form-control astute-knowledge-default-touchpoint" value="{{=(it.brand.faq && it.brand.faq.astute_knowledge && it.brand.faq.astute_knowledge.default_touchpoint ? it.brand.faq.astute_knowledge.default_touchpoint : "")}}">' +
            '</div>' +
        '</div>' +
        '<div class="form-group source-group">' +
            '<label class="col-xs-12 col-sm-3 control-label">Product Touchpoint' +
                '<div class="help-me-widget ui-tooltip" data-placement="bottom" data-original-title="The product touchpoint to use with Astute Knowledge version 6 or newer.">' +
                    '<i class="fa fa-question" style="margin-left: -1px;"></i>' +
                '</div>' +
            '</label>' +
            '<div class="col-xs-12 col-sm-9">'  +
                '<input class="form-control astute-knowledge-product-touchpoint" value="{{=(it.brand.faq && it.brand.faq.astute_knowledge && it.brand.faq.astute_knowledge.product_touchpoint ? it.brand.faq.astute_knowledge.product_touchpoint : "")}}">' +
            '</div>' +
        '</div>' +
        '<div class="form-group source-group">' +
            '<label class="col-xs-12 col-sm-3 control-label">Activation Status' +
                '<div class="help-me-widget ui-tooltip" data-placement="bottom" data-original-title="The activation status to use with Astute Knowledge version 6 or newer.">' +
                    '<i class="fa fa-question" style="margin-left: -1px;"></i>' +
                '</div>' +
            '</label>' +
            '<div class="col-xs-12 col-sm-9">'  +
                '<input class="form-control astute-knowledge-activation-status" value="{{=(it.brand.faq && it.brand.faq.astute_knowledge && it.brand.faq.astute_knowledge.activation_status ? it.brand.faq.astute_knowledge.activation_status : "")}}">' +
            '</div>' +
        '</div>';

    // provides interesting astute knowledge 5 properties
    var astute_knowledge_5_template_def =
        '<div class="form-group faq-source-group">' +
            '<label class="col-xs-12 col-sm-3 control-label">Endpoint URL*' +
                '<div class="help-me-widget ui-tooltip" data-placement="bottom" data-original-title="The url to use with Astute Knowledge version 5 or older.">' +
                    '<i class="fa fa-question" style="margin-left: -1px;"></i>' +
                '</div>' +
            '</label>' +
            '<div class="col-xs-12 col-sm-9">'  +
                '<input class="form-control astute-knowledge5-endpoint" value="{{=(it.brand.faq && it.brand.faq.astute_knowledge_5 && it.brand.faq.astute_knowledge_5.endpoint ? it.brand.faq.astute_knowledge_5.endpoint : "")}}">' +
            '</div>' +
        '</div>' +
        '<div class="form-group faq-source-group">' +
            '<label class="col-xs-12 col-sm-3 control-label">Touchpoint*' +
                '<div class="help-me-widget ui-tooltip" data-placement="bottom" data-original-title="The touchpoint to use with Astute Knowledge version 5 or older.">' +
                    '<i class="fa fa-question" style="margin-left: -1px;"></i>' +
                '</div>' +
            '</label>' +
            '<div class="col-xs-12 col-sm-9">'  +
                '<input class="form-control astute-knowledge5-touchpoint" value="{{=(it.brand.faq && it.brand.faq.astute_knowledge_5 && it.brand.faq.astute_knowledge_5.touchpoint ? it.brand.faq.astute_knowledge_5.touchpoint : "")}}">' +
            '</div>' +
        '</div>' +
        '<div class="form-group faq-source-group">' +
            '<label class="col-xs-12 col-sm-3 control-label">Default Touchpoint' +
                '<div class="help-me-widget ui-tooltip" data-placement="bottom" data-original-title="The default touchpoint to use with Astute Knowledge version 5 or older (optional).">' +
                    '<i class="fa fa-question" style="margin-left: -1px;"></i>' +
                '</div>' +
            '</label>' +
            '<div class="col-xs-12 col-sm-9">'  +
                '<input class="form-control astute-knowledge5-default-touchpoint" value="{{=(it.brand.faq && it.brand.faq.astute_knowledge_5 && it.brand.faq.astute_knowledge_5.default_touchpoint ? it.brand.faq.astute_knowledge_5.default_touchpoint : "")}}">' +
            '</div>' +
        '</div>' +
        '<div class="form-group faq-source-group">' +
            '<label class="col-xs-12 col-sm-3 control-label">Knowledge Base' +
                '<div class="help-me-widget ui-tooltip" data-placement="bottom" data-original-title="The knowledge base to use with Astute Knowledge version 5 or older (optional).">' +
                    '<i class="fa fa-question" style="margin-left: -1px;"></i>' +
                '</div>' +
            '</label>' +
            '<div class="col-xs-12 col-sm-9">'  +
                '<input class="form-control astute-knowledge5-knowledge-base" value="{{=(it.brand.faq && it.brand.faq.astute_knowledge_5 && it.brand.faq.astute_knowledge_5.knowledge_base ? it.brand.faq.astute_knowledge_5.knowledge_base : "")}}">' +
            '</div>' +
        '</div>' +
        '<div class="form-group faq-source-group">' +
            '<label class="col-xs-12 col-sm-3 control-label">Topic Contexts' +
                '<div class="help-me-widget ui-tooltip" data-placement="bottom" data-original-title="The topic contexts to use with Astute Knowledge version 5 or older (optional).">' +
                    '<i class="fa fa-question" style="margin-left: -1px;"></i>' +
                '</div>' +
            '</label>' +
            '<div class="col-xs-12 col-sm-9">'  +
                '<input class="form-control astute-knowledge5-topic-contexts" value="{{=(it.brand.faq && it.brand.faq.astute_knowledge_5 && it.brand.faq.astute_knowledge_5.topic_contexts ? it.brand.faq.astute_knowledge_5.topic_contexts : "")}}">' +
            '</div>' +
        '</div>' +
        '<div class="form-group faq-source-group">' +
            '<label class="col-xs-12 col-sm-3 control-label">Security Key' +
                '<div class="help-me-widget ui-tooltip" data-placement="bottom" data-original-title="The security key to use with Astute Knowledge version 5 or older (optional).">' +
                    '<i class="fa fa-question" style="margin-left: -1px;"></i>' +
                '</div>' +
            '</label>' +
            '<div class="col-xs-12 col-sm-9">'  +
                '<input type="password" class="form-control astute-knowledge5-security-key" value="{{=(it.brand.faq && it.brand.faq.astute_knowledge_5 && it.brand.faq.astute_knowledge_5.security_key ? it.brand.faq.astute_knowledge_5.security_key : "")}}">' +
            '</div>' +
        '</div>';

    var form_template = doT.template(form_template_def);
    var wilke_template = doT.template(wilke_template_def);
    var astute_knowledge_template = doT.template(astute_knowledge_template_def);
    var astute_knowledge_5_template = doT.template(astute_knowledge_5_template_def);

    function init(container, brand) {
        container.html(form_template({brand: brand}));
        $( ".ui-tooltip" ).tooltip({});

        _processSelection(container, brand);

        container.find('select.faq-source').change(function() {
            _processSelection(container, brand);
        });
    }

    function _processSelection(container, brand) {
        container.find('.faq-source-group').remove();
        container.find('.source-group').remove();

        var selection = container.find('select.faq-source').val();
        if(selection == 'wilke') {

            container.find('.form-horizontal').append(wilke_template({brand: brand}));
            $( ".ui-tooltip" ).tooltip({});
            return;
        }
        if(selection == 'astute-knowledge') {
            container.find('.form-horizontal').append(astute_knowledge_template({brand: brand}));
            $( ".ui-tooltip" ).tooltip({});
            return;
        }
        if(selection == 'astute-knowledge5') {
            container.find('.form-horizontal').append(astute_knowledge_5_template({brand: brand}));
            $( ".ui-tooltip" ).tooltip({});
            return;
        }
    }

    function getData(container) {
        var form_data = {};

        var selection = container.find('select.faq-source').val();
        if(selection == 'wilke') {
            var enlight_tenant = container.find('input.enlight-tenant').val();
            var enlight_view_id = container.find('input.enlight-view-id').val();
            var enlight_doc_type_id = container.find('input.enlight-doc-type-id').val();
            var enlight_brand_keyword = container.find('input.enlight-brand-keyword').val();

            form_data.faq = { wilke: { } };
            if(enlight_tenant) {
                form_data.faq.wilke.enlight_tenant = enlight_tenant;
            }
            if(enlight_view_id) {
                form_data.faq.wilke.view_id = enlight_view_id;
            }
            if(enlight_doc_type_id) {
                form_data.faq.wilke.doc_type_id = enlight_doc_type_id;
            }
            if(enlight_brand_keyword) {
                form_data.faq.wilke.brand_keyword = enlight_brand_keyword;
            }
        } else if(selection == 'astute-knowledge') {
            var knowledge_base = container.find('input.astute-knowledge-knowledge-base').val();
            var uri = container.find('input.astute-knowledge-uri').val();
            var secret_key = container.find('input.astute-knowledge-secret-key').val();
            var default_touchpoint = container.find('input.astute-knowledge-default-touchpoint').val();
            var product_touchpoint = container.find('input.astute-knowledge-product-touchpoint').val();
            var activation_status = container.find('input.astute-knowledge-activation-status').val();

            form_data.faq = {astute_knowledge: {}, astute_knowledge_5: {}}; // TODO: undo hack to include ak5

            if(knowledge_base) {
                form_data.faq.astute_knowledge.knowledge_base = knowledge_base;
            }
            if(uri) {
                form_data.faq.astute_knowledge.uri = uri;
                form_data.faq.astute_knowledge_5.endpoint = uri;
            }
            if(secret_key) {
                form_data.faq.astute_knowledge.secret_key = secret_key;
            }
            if(default_touchpoint) {
                form_data.faq.astute_knowledge.default_touchpoint = default_touchpoint;
                form_data.faq.astute_knowledge_5.default_touchpoint = default_touchpoint;
            }
            if(product_touchpoint) {
                form_data.faq.astute_knowledge.product_touchpoint = product_touchpoint;
                form_data.faq.astute_knowledge_5.touchpoint = product_touchpoint;
            }
            if(activation_status) {
                form_data.faq.astute_knowledge.activation_status = activation_status;
            }

        } else if(selection == 'astute-knowledge5') {
            var touchpoint = container.find('input.astute-knowledge5-touchpoint').val();
            var endpoint = container.find('input.astute-knowledge5-endpoint').val();
            var default_touchpoint = container.find('input.astute-knowledge5-default-touchpoint').val();
            var knowledge_base = container.find('input.astute-knowledge5-knowledge-base').val();
            var topic_contexts = container.find('input.astute-knowledge5-topic-contexts').val();
            var security_key = container.find('input.astute-knowledge5-security-key').val();

            form_data.faq = {astute_knowledge_5: {}};

            if(touchpoint) {
                form_data.faq.astute_knowledge_5.touchpoint = touchpoint;
            }
            if(endpoint) {
                form_data.faq.astute_knowledge_5.endpoint = endpoint;
            }
            if(default_touchpoint) {
                form_data.faq.astute_knowledge_5.default_touchpoint = default_touchpoint;
            }
            if(knowledge_base) {
                form_data.faq.astute_knowledge_5.knowledge_base = knowledge_base;
            }
            if(topic_contexts) {
                form_data.faq.astute_knowledge_5.topic_contexts = topic_contexts;
            }
            if(security_key) {
                form_data.faq.astute_knowledge_5.security_key = security_key;
            }
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