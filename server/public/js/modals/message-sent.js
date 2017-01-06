var message_sent_modal = (function() {

    var _modalClassName = '.modal-message-sent';
    var _defaultMessage = 'Thank you for your message.  You will be contacted by an agent shortly.';

    function show(text) {
        var dialog = $(_modalClassName);
        if(text) {
            dialog.find('.modal-body').html(text);
        } else {
            dialog.find('.modal-body').html(_defaultMessage);
        }
        dialog.modal({ show : false, keyboard : false, backdrop : 'static' });
        dialog.modal('show');
    }

    function hide() {
        $(_modalClassName).modal('hide');
    }

    return {
        show: show,
        hide: hide
    }
}(message_sent_modal));