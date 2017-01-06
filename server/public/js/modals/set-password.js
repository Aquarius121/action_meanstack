var set_password_modal = (function() {

    var _modalClassName = '.set-password-modal';

    var dialog;
    var setPasswordAlert;

    function show() {
        dialog = $(_modalClassName);
        setPasswordAlert = dialog.find('.alert');

        var okButton = dialog.find('button.btn-reset');

        dialog.find('#set-password-form').ajaxForm({
            url: '/user/reset-password',
            beforeSubmit : function(formData, jqForm, options) {
                setPasswordAlert.hide();
                return _validate($('#pass-tf').val());
            },
            success	: function(responseText, status, xhr, $form){
                hide();
                alert_modal.show('Success', 'Your password has been reset.');
            },
            error : function(){
                _showAlert("I'm sorry something went wrong, please try again.");
            }
        });

        // bind onComplete event
        okButton.unbind('click');
        okButton.click(function() {
            $('#set-password-form').submit();
            return false;
        });

        dialog.modal({ show : false, keyboard : false, backdrop : 'static' });
        dialog.modal('show');
    }

    function hide() {
        $(_modalClassName).modal('hide');
    }

    function _validate(s) {
        if(s.length >= 6){
            return true;
        } else{
            _showAlert('Password Should Be At Least 6 Characters');
            return false;
        }
    }

    function _showAlert(m) {
        setPasswordAlert.attr('class', 'alert alert-error');
        setPasswordAlert.html(m);
        setPasswordAlert.show();
    }

    function _showSuccess(m) {
        setPasswordAlert.attr('class', 'alert alert-success');
        setPasswordAlert.html(m);
        setPasswordAlert.fadeIn(500);
    }

    return {
        show: show,
        hide: hide
    }
}());