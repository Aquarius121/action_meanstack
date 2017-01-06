var brand_form_contents = (function() {

    function init(brand) {
        if(brand.operating_hours) {
            $('.hours-fields').css('display', '');
        }

        CKEDITOR.replace('brand-auto-message');
    }

    function getData() {
        var form_data = {
            link: $('input.brand-link').val(),
            logo_url: $('input.brand-logo').val(),
            crm_email_endpoint: $('input.crm-email-link').val(),
            privacy_policy_url: $('input.privacy-policy-url').val(),
            minimum_age: $('input.minimum-age').val(),
            auto_message: CKEDITOR.instances['brand-auto-message'].getData(),
            participating : $('input.set-participating').is(':checked')
        };

        var setHours = $('.set-hours').prop('checked');
        if(setHours) {
            form_data.operating_hours = {
                monday: {
                    start: $('input.monday_start').val(),
                    end: $('input.monday_end').val()
                },

                tuesday: {
                    start: $('input.tuesday_start').val(),
                    end: $('input.tuesday_end').val()
                },

                wednesday: {
                    start: $('input.wednesday_start').val(),
                    end: $('input.wednesday_end').val()
                },

                thursday: {
                    start: $('input.thursday_start').val(),
                    end: $('input.thursday_end').val()
                },

                friday: {
                    start: $('input.friday_start').val(),
                    end: $('input.friday_end').val()
                },

                saturday: {
                    start: $('input.saturday_start').val(),
                    end: $('input.saturday_end').val()
                },

                sunday: {
                    start: $('input.sunday_start').val(),
                    end: $('input.sunday_end').val()
                }
            };
        }

        var auto_message_expiration = $('.auto-message-expiration');
        if(auto_message_expiration.val().length > 0) {
            form_data.auto_message_expiration = moment(auto_message_expiration.val()).valueOf(); // TODO: UTC
        }

        return form_data;
    }

    function validateBrandLink(link) {
       if(typeof(link) == 'undefined' || link == 'undefined') {
          return true;
       } else if(link.trim() == '' || link.length == 0) {
          return true;
       } else {
          return (/^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(link));
      }
    }


    // validates the data produced by getData
    function validateData(form_data) {
        var errors = [];

        if(!validateBrandLink(form_data.privacy_policy_url))
        {
            errors.push("Please enter valid privacy policy url.");
            $('input.privacy-policy-url').addClass('error-field');
        }else
            $('input.privacy-policy-url').removeClass('error-field');
        return errors;
    }

    return {
        init: init,
        getData: getData,
        validateData: validateData
    }

}());

$(function() {
    $('.bootstrap-timepicker > input').timepicker({
        defaultTime: false
    });
});
