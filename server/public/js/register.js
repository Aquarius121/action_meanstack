
$(function() {
    $( ".ui-tooltip" ).tooltip({});

    var form_container = $('.user-form-contents');

    var profile_form_options = {
        show_email: true,
        password_required: true,
        email_enabled: true,
        show_role: false,
        show_password: true
    };

    var profile_context = profile_form.init(form_container, undefined, profile_form_options);

    $('button.create-button').click(function() {
        var form_data = profile_form.getData(form_container, profile_context);
        var validation_errors = profile_form.validate(form_container, profile_form_options, profile_context);
        if(validation_errors.length > 0) {
            alert_modal.show('Error', validation_errors[0]);
            return;
        }

        form_data.platform = 'web';

        if(!form_data.opt) {
            var opt_in_body = 'Are you sure you don\'t want to opt in to communications from The Action App?';
            confirm_modal.setButtonText('Sign me up!', 'Yes, I decline');
            confirm_modal.show('Opt-in', opt_in_body, function() {
                confirm_modal.setButtonText('Cancel', 'Ok');
                createUser(form_data);
            }, function() {
                form_data.opt = true;
                confirm_modal.setButtonText('Cancel', 'Ok');
                createUser(form_data);
            });
            return false;
        }
        createUser(form_data);
        return false;
    });

    function createUser(form_data) {
        loading_modal.show('Saving...');
        $.ajax({
            type: 'PUT',
            url: '/user',
            data: form_data
        }).error(function(e) {
            loading_modal.hide();
            alert_modal.show('Error', e.responseText);
        }).success(function(result) {
            loading_modal.hide();
            alert_modal.show('Success', 'Welcome to Action!', function() {
                window.location.href = '/products/find/view';
            });
        });
    }
});