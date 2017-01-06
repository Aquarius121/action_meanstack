var form_widget = (function() {

    var form_body_template =

        '{{##def.textfield: ' + // input[type=text]
            '<div class="form-group">' +
                '<label class="col-xs-4 control-label">{{=field.label}}</label>' +
                '<div class="col-xs-8">' +
                    '<input {{?!field.enabled}}disabled{{?}} class="form-control {{=field.property}}-field" data-id="">' +
                '</div>' +
            '</div>' +
        '#}}' +

        '{{##def.passwordfield: ' + // input[type=password] (TODO:  autocapitalize="none" ?)
            '<div class="form-group">' +
                '<label class="col-xs-4 control-label">{{=field.label}}</label>' +
                '<div class="col-xs-8">' +
                    '<input type="password" {{?!field.enabled}}disabled{{?}} class="form-control {{=field.property}}-field" data-id="">' +
                '</div>' +
            '</div>' +
        '#}}' +

        '{{##def.selectfield: ' + // select
        '<div class="form-group">' +
            '<label class="col-xs-4 control-label">{{=field.label}}</label>' +
            '<div class="col-xs-8">' +
                '<select class="form-control {{=field.property}}-field">' +
                    '{{~field.values :option:option_index}}' +
                        '<option value="{{=option.value}}">{{=option.text}}</option>' +
                    '{{~}}' +
                '</select>' +
            '</div>' +
        '</div>#}}' +

        '{{##def.checkfield: ' + // checkbox
        '<div class="form-group">' +
            '<label class="col-xs-4 control-label">{{=field.label}}</label>' +
            '<div class="col-xs-8 form-control-container">' +
                '<input type="checkbox" class="{{=field.property}}-field">' +
            '</div>' +
        '</div>#}}' +

        '{{##def.customfield: ' + // checkbox
        '<div class="form-group">' +
            '<label class="col-xs-4 control-label">{{=field.label}}</label>' +
            '<div class="col-xs-8 form-control-container">' +
                '{{=field.template(field)}}' +
            '</div>' +
        '</div>#}}' +

        '<form role="form" class="form-horizontal">' + // the form itself
            '{{~it.fields :field:index}}' +
                '{{?field.visible}}' +
                    '{{?field.break_before}}<hr>{{?}}' +
                    '{{?field.type == "check"}}' +
                        '{{#def.checkfield}}' +
                    '{{??field.type=="select"}}' +
                        '{{#def.selectfield}}' +
                    '{{??field.type=="password"}}' +
                        '{{#def.passwordfield}}' +
                    '{{??field.type=="custom"}}' +
                        '{{#def.customfield}}' +
                    '{{??}}' +
                        '{{#def.textfield}}' +
                    '{{?}}' +
                    '{{?field.break_after}}<hr>{{?}}' +
                '{{?}}' +
            '{{~}}' +
        '</form>';

    var pagefn = doT.template(form_body_template);

    //options.fields (e.g.):
    // - { label: 'First Name *', property: 'first_name', visible: true, enabled: true }
    // - { label: 'Age Range *', property: 'age_range',  visible: true, enabled: true, type: 'select', values: [{value: 'X', text: 'Y'}] },
    function init(container, options) {
        container.html(pagefn({
            fields: options.fields,
            caller: options.caller
        }));
    }

    function getWidgets(form_container, fields) {
        var results = {};
        fields.forEach(function(field) {
            results[field.property + '_field'] = form_container.find('.' + field.property + '-field');
        });

        return results;
    }

    return {
        init: init,
        getWidgets: getWidgets
    }
}());
