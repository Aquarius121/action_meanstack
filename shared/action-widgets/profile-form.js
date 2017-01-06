var profile_form = (function() {

    var roles = [
        {value: 'admin', text: 'admin'},
        {value: 'action-admin', text: 'action-admin'},
        {value: 'brand-manager', text: 'brand-manager'},
        {value: 'user', text: 'user'}
    ];

    function init(container, caller, options) {

        //options.show_email = options.show_email ? options.show_email : 'true';
        //options.password_required = options.password_required ? options.password_required : 'false';
        //options.show_role = options.show_role ? options.show_role : 'true';
        //options.email_enabled = options.email_enabled ? options.email_enabled : 'false';

        var genders = [
            {value: '', text: '&nbsp;gender'},
            {value: '1', text: '&nbsp;male'},
            {value: '2', text: '&nbsp;female'}
        ];


        var countries = [
            {value: 'USA', text: '&nbsp;United States of America'},
            {value: 'CAN', text: '&nbsp;Canada'}
        ];

        var is_role_visible = options.show_role && typeof(caller) != 'undefined' && caller.role == 'admin';
        var password_text = options.password_required ? 'Password *' : 'Password';
        var showProfileFields = typeof(options.is_profile) != 'undefined' && options.is_profile;

        var fields = [
            { label: 'Email *',             property: 'email',      visible: options.show_email, enabled: options.email_enabled, spacing_class: 'col-xs-12 pad-left-icon', field_icon: 'fa fa-envelope'},
            { label: 'First Name *',        property: 'first_name', visible: true, enabled: true, spacing_class: 'col-xs-6' },
            { label: 'Last Name *',         property: 'last_name',  visible: true, enabled: true, spacing_class: 'col-xs-6' },
            { label: 'Birth Date *',        property: 'dob',        visible: true, enabled: true, spacing_class: 'col-xs-8', field_type:'date', field_icon_right: 'fa fa-question-circle', label_onclick: 'profile_form.onDOBHelpClick', watermark: true  },
            { label: 'Gender',              property: 'gender',     visible: true, enabled: true, type: 'select', values: genders, spacing_class: 'col-xs-4'  },
            { label: 'Phone #',             property: 'phone',      visible: showProfileFields, enabled: true, spacing_class: 'col-xs-12 pad-left-icon', field_icon: 'fa fa-phone' },
            { label: 'Street Address',      property: 'street',     visible: showProfileFields, enabled: true, spacing_class: 'col-xs-12' },
            { label: 'City',                property: 'city',       visible: showProfileFields, enabled: true, spacing_class: 'col-xs-8' },
            { label: 'State',               property: 'state',      visible: showProfileFields, enabled: true, spacing_class: 'col-xs-4' },
            { label: 'Country',             property: 'country',    visible: showProfileFields, enabled: true, type: 'select', values: countries, spacing_class: 'col-xs-12'  },
            { label: 'Postal Code *',       property: 'zip',        visible: true, enabled: true, spacing_class: 'col-xs-12'},
            { label: password_text,         property: 'password',   visible: options.show_password, type: 'password', enabled: true, spacing_class: 'col-xs-12'},
            { label: 'Opt In to Action!',   property: 'opt',        visible: true, type: 'check', enabled: true, spacing_class: 'col-xs-6'  },
            { label: 'Terms & Conditions',  property: 'terms',      visible: !showProfileFields, type: 'check', enabled: true, spacing_class: 'col-xs-6', label_link: '#terms-and-conditions', label_onclick: 'profile_form.onTermsClicked'  },
            { label: 'Role',                property: 'role',       visible: is_role_visible, type: 'select', enabled: true, values: roles, spacing_class: 'col-xs-12'}
        ];

        flex_form_widget.init(container, {
            fields: fields,
            caller: caller
        });

        general_util.addPhoneInputHandler(container.find('input.phone-field'));

        return fields;
    }

    function onTermsClicked() {
        app_controller.openInternalPage('#terms-and-conditions', {hide_from_history: false});
    }

    function onDOBHelpClick() {
        alert_modal.show('Why share my birthday with Action!', 'Sharing your birthday with action! helps us comply with age regulations for the companies you want to connect with. <a href="javascript:void(0);" onclick="app_controller.openExternalPage(\'http://www.coppa.org\')">Click Here</a> for more info.');
    }

    function getWidgets(form_container, context) {
        return form_widget.getWidgets(form_container, context);
    }

    function getData(form_container, fields) {
        var widgets = flex_form_widget.getWidgets(form_container, fields);
        var data = {};

        if(widgets.first_name_field.val().trim().length > 0) {
            data.first_name = widgets.first_name_field.val();
        }

        if(widgets.last_name_field.val().trim().length > 0) {
            data.last_name = widgets.last_name_field.val();
        }

        if(widgets.email_field.val().trim().length > 0) {
            data.email = widgets.email_field.val();
        }

        if(widgets.phone_field.length > 0 && widgets.phone_field.val().trim().length > 0) {
            data.phone = widgets.phone_field.val();
        }

        if(widgets.street_field.length > 0 && widgets.street_field.val().trim().length > 0) {
            data.street = widgets.street_field.val();
        }

        if(widgets.city_field.length > 0 && widgets.city_field.val().trim().length > 0) {
            data.city = widgets.city_field.val();
        }

        if(widgets.state_field.length > 0 && widgets.state_field.val().trim().length > 0) {
            data.state = widgets.state_field.val();
        }

        if(widgets.country_field.length > 0 && widgets.country_field.val().trim().length > 0) {
            data.country = widgets.country_field.val();
        }


        if(widgets.zip_field.val().trim().length > 0) {
            data.zip = widgets.zip_field.val();
        }

        if(widgets.password_field.length > 0 && widgets.password_field.val().trim().length > 0) {
            data.password = widgets.password_field.val();
        }

        if(widgets.gender_field.length > 0) {
            data.gender = widgets.gender_field.val();
        }

        if(widgets.role_field.length > 0) {
            data.role = widgets.role_field.val();
        }

        if(widgets.dob_field.length > 0) {
            data.dob = widgets.dob_field.val();
        }

        if(widgets.opt_field.prop('checked')) {
            data.opt = true;
        }



        return data;
    }

    function setValues(form_container, user, fields) {
        var widgets = flex_form_widget.getWidgets(form_container, fields);

        widgets.first_name_field.val(user.first_name);
        widgets.last_name_field.val(user.last_name);
        widgets.email_field.val(user.email);
        widgets.phone_field.val(user.phone);
        widgets.street_field.val(user.address ? user.address.street : '');
        widgets.city_field.val(user.address ? user.address.city : '');
        widgets.state_field.val(user.address ? user.address.state : '');
        widgets.zip_field.val(user.address ? user.address.zip : '');
        widgets.dob_field.val(user.dob);
        widgets.gender_field.val(user.gender);
        widgets.country_field.val(user.address && user.address.country ? user.address.country: 'USA');

        if(!user.dob || user.dob.length == 0) {
            widgets.dob_field.addClass('empty');
        } else {
            widgets.dob_field.removeClass('empty');
        }

        if(widgets.role_field.length > 0) {
            widgets.role_field.val(user.role);
        }

        widgets.opt_field.prop('checked', user.opt);
    }

    function clear(form_container, fields) {
        var widgets = flex_form_widget.getWidgets(form_container, fields);

        // empty all fields
        widgets.first_name_field.val('');
        widgets.last_name_field.val('');
        widgets.email_field.val('');
        widgets.phone_field.val('');
        widgets.street_field.val('');
        widgets.city_field.val('');
        widgets.state_field.val('');
        widgets.country_field.val('USA');
        widgets.zip_field.val('');
        widgets.gender_field.val('');
        widgets.password_field.val('');
        widgets.dob_field.val('');
        widgets.dob_field.addClass('empty');
        widgets.opt_field.prop('checked', false);
    }

    function validate(form_container, options, fields) {
        var widgets = flex_form_widget.getWidgets(form_container, fields);
        var data = getData(form_container, fields);
        var error_strings = [];

        widgets.terms_field.removeClass('checkbox-error');
        Object.keys(widgets).forEach(function(widget_key) {
            widgets[widget_key].removeClass('error-field');
        });

        if(typeof(data.first_name) == 'undefined') {
            widgets.first_name_field.addClass('error-field');
            error_strings.push('first name is required');
        }

        if(typeof(data.last_name) == 'undefined') {
            widgets.last_name_field.addClass('error-field');
            error_strings.push('last name is required');
        }

        if(options.show_email && options.email_enabled) {
            if(typeof(data.email) == 'undefined') {
                widgets.email_field.addClass('error-field');
                error_strings.push('email is required');
            } else {
                if(!general_util.validateEmail(data.email)) {
                    widgets.email_field.addClass('error-field');
                    error_strings.push('invalid email address');
                }
            }
        }

        if(typeof(data.zip) == 'undefined') {
            widgets.zip_field.addClass('error-field');
            error_strings.push('postal code is required');
        } else {
            if(!general_util.validateZip(data.country == "USA", data.country == "CAN", data.zip)) {
                widgets.zip_field.addClass('error-field');

                if(data.country == "USA") {
                    error_strings.push('a valid 5 or 9 digit zip code is required');
                } else if(data.country == "CAN") {
                    error_strings.push('a valid Canadian postal code is required');
                } else {
                    error_strings.push('a valid postal code is required');
                }
            }
        }

        // if a phone is provided for validation
        if(typeof(data.phone) != 'undefined') {

            // if a non-empty, non-valid phone number was provided
            if(data.phone.length > 0 && !general_util.validatePhoneNumber(data.phone)) {
                widgets.phone_field.addClass('error-field');
                error_strings.push('if a phone number is provided, it must be in DDD-DDD-DDDD format');
            }
        }

        // TODO: check for valid date
        if(typeof(data.dob) == 'undefined' || data.dob.trim().length == 0) {
            widgets.dob_field.addClass('error-field');
            error_strings.push('date of birth is required');
        }

        if(widgets.password_field.length > 0 && options.password_required && typeof(data.password) == 'undefined') {
            widgets.password_field.addClass('error-field');
            error_strings.push('password is required');
        }

        if(widgets.terms_field.length > 0 && !widgets.terms_field.prop('checked'))
        {
            widgets.terms_field.parent().addClass('checkbox-error');
            error_strings.push('You must read and agree to the terms and conditions before registering.');
        }

        return error_strings;
    }

    return {
        init: init,
        getWidgets: getWidgets,
        getData: getData,

        validate: validate,
        setValues: setValues,
        clear: clear,

        onTermsClicked: onTermsClicked,
        onDOBHelpClick: onDOBHelpClick

    }
}());
