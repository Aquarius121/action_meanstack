var message_errors_page = (function() {

    function init() {
        loading_modal.show('Loading...');
        $.ajax({
            type: 'GET',
            url: '/messages/errors'
        }).error(function(e) {
            loading_modal.hide();
            alert_modal.show('Error', e.responseText);
        }).done(function(result) {
            loading_modal.hide();
            error_message_accordion.init($('.message-errors-container'), result, deleteHandler);
        });
    }

    function deleteHandler(message_id) {
        loading_modal.show('Deleting...');
        $.ajax({
            type: 'DELETE',
            url: '/messages/error/' + message_id
        }).error(function(e) {
            loading_modal.hide();
            alert_modal.show('Error', e.responseText);
        }).done(function(result) {
            loading_modal.hide();
            window.location.reload();
        });
    }

    return {
        init: init
    }
}());

$(function() {
    message_errors_page.init();
});
