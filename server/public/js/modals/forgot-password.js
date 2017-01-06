var forgot_password_modal = (function() {

    var _modalClassName = '.modal-forgot-password';
    function show() {
        var dialog = $(_modalClassName);
        var okButton = dialog.find('button.btn-ok');

        dialog.find('.email-field').val('');
        dialog.find('.username-radio').prop('checked', true);

        // bind onComplete event
        okButton.unbind('click');

        okButton.click(function() {
            var email_value = dialog.find('.email-field').val();
	    var validEmail = general_util.validateEmail(email_value); 
            if(!validEmail) {
                hide();
                alert_modal.show('Error', 'Please enter a valid email');
		processInvalidEmail();
		return;
            } 

            hide();
            loading_modal.show();

            $.ajax({
                url: '/user/lost-password',
                type: 'POST',
                data: {
                    email: email_value
                },
                success: function(data) {
                    loading_modal.hide();
                    alert_modal.show('Success', 'A reset email has been sent.');
                },
                error: function(jqXHR) {
                    loading_modal.hide();
                    alert_modal.showFromXHR('Error', jqXHR);
                }
            });
        });

        dialog.modal({ show : false, keyboard : false, backdrop : 'static' });
        dialog.modal('show');
    }

    function hide() {
        $(_modalClassName).modal('hide');
    }

    function processInvalidEmail() {
	    show();
    }

    return {
        show: show,
        hide: hide
    }
}());
