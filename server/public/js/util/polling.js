var polling_util = (function() {

    function init() {
        setInterval(_pollMessages, 15000);
        _pollMessages();
    }

    function _pollMessages() {
        // TODO: only if logged in!
        $.ajax({
            type: 'GET',
            url: '/messages/unread'
        }).error(function(e) {
            if(e.status == 500) {
                console.log(e.responseText);
            }
        }).success(function(result) {
            var unread_badge = $('.user-menu').find('.unread-messages');
            if(result.length > 0) {
                unread_badge.html(result.length);
                unread_badge.removeClass('hidden');
            } else {
                unread_badge.addClass('hidden');
            }
        });
    }

    return {
        init: init
    }
}());

$(function() {
    polling_util.init();
});