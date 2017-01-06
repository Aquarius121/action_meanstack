
$(function() {
    $( ".ui-tooltip" ).tooltip({});

    var form_container = $('form.form-horizontal');

    var profile_form_options = {
        show_email: true,
        password_required: true,
        email_enabled: true,
        show_role: typeof(caller) != 'undefined' && caller.role == 'admin',
        show_password: true
    };
    var form_context = profile_form.init(form_container, caller, profile_form_options);

    $('button.save-button').click(function() {
        var form_data = profile_form.getData(form_container, form_context);
        var validation_errors = profile_form.validate(form_container, profile_form_options, form_context);
        if(validation_errors.length > 0) {
            alert_modal.show('Error', validation_errors[0]);
            return;
        }

        form_data.platform = 'web';

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
            alert_modal.show('Success', 'Creation successful', function() {
                window.location.href = '/user/view/' + result[0]._id;
            });
        });
    });
});