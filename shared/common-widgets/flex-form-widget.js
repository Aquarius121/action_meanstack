var flex_form_widget = (function() {

    var form_body_template =

        '{{##def.textfield: ' + // input[type=text]
            '<div class="{{=field.spacing_class}} field">' +
                '{{?field.field_icon}}' +
                    '<div class="{{=field.field_icon}} field-icon"></div>' +
                '{{?}}' +
                '{{?field.watermark}}' +
                    '<div class="{{=field.field_icon}} field-watermark"></div>' +
                '{{?}}' +
                '<input {{?!field.enabled}}disabled{{?}} class="form-control {{=field.property}}-field" {{?field.field_type}}type="{{=field.field_type}}"{{?}} data-id="" placeholder="{{=field.label}}">' +
                '{{?field.field_icon_right}}' +
                    '{{?field.label_onclick}}' +
                        '<div class="{{=field.field_icon_right}} field-icon-right" style="cursor: pointer" {{?field.label_onclick}} onclick={{=field.label_onclick}}(){{?}}></div>' +
                    '{{?}}' +
                    '{{?!field.label_onclick}}' +
                        '<div class="{{=field.field_icon_right}} field-icon-right"></div>' +
                    '{{?}}' +
                '{{?}}' +
            '</div>' +
        '#}}' +

        '{{##def.passwordfield: ' + // input[type=password] (TODO:  autocapitalize="none" ?)
            '<div class="{{=field.spacing_class}} field">' +
                '<input type="password" {{?!field.enabled}}disabled{{?}} class="form-control {{=field.property}}-field" data-id="" placeholder="{{=field.label}}">' +
            '</div>' +
        '#}}' +

        '{{##def.selectfield: ' + // select
            '<div class="{{=field.spacing_class}} field">' +
                '<div class="glyphicon glyphicon-chevron-down field-icon-right"></div>' +
                '<select class="form-control {{=field.property}}-field"  placeholder="{{=field.label}}">' +
                    '{{~field.values :option:option_index}}' +
                        '<option value="{{=option.value}}">{{=option.text}}</option>' +
                    '{{~}}' +
                '</select>' +
            '</div>' +
        '#}}' +

        '{{##def.checkfield: ' + // checkbox
            '<div class="{{=field.spacing_class}} field" >' +
                   '<div class="checkbox checkbox-circle">' +
                        '<input id="{{=field.property}}" class="{{=field.property}}-field" type="checkbox">' +
                        '<label for="{{=field.property}}">' +
                            '{{?field.label_onclick}}' +
                                '<a href="javascript:void(0);"{{?field.label_onclick}} onclick={{=field.label_onclick}}(){{?}}>{{=field.label}}</a>' +
                            '{{?}}' +
                            '{{?!field.label_onclick}}{{=field.label}}{{?}}' +
                        '</label>' +
                    '</div>' +
            '</div>' +
        '#}}' +

        '{{##def.customfield: ' + // checkbox
            '<label class="col-xs-4 control-label">{{=field.label}}</label>' +
            '<div class="col-xs-8 form-control-container">' +
                '{{=field.template(field)}}' +
            '</div>' +
        '#}}' +

        '<form role="form" class="form-horizontal flex-form">' + // the form itself
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
        '</form>' +
        '<div class="clearfix"></div>';

    var pagefn = doT.template(form_body_template);

    //options.fields (e.g.):
    // - { label: 'First Name *', property: 'first_name', visible: true, enabled: true }
    // - { label: 'Age Range *', property: 'age_range',  visible: true, enabled: true, type: 'select', values: [{value: 'X', text: 'Y'}] },
    function init(container, options) {
        container.html(pagefn({
            fields: options.fields,
            caller: options.caller
        }));

        container.find('input[type="date"]').change(function() {
            console.log('detected a change on ios to date input');
            if($(this).val().length > 0) {
                $(this).removeClass('empty');
            } else {
                $(this).addClass('empty');
            }
        });
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
