var user_opt_ins_page = (function() {

    function init(caller) {
        var container = $('.user-opt-ins-container');
        container.html('');


        _getOptIns(caller._id, function(err_opt, opt_result) {
            if(err_opt) {
                window.alert(err_opt);
                return;
            }
            opt_ins_widget.init({
                user_id: caller._id,
                container: container, // user_id, favorites_result, opt_result
                remote_url: '',
                opt_ins: opt_result,
                onBrandSelected: function(id) {
                    window.location.href = '/brand/' + id + '/view';
                }
            });
        });
    }

    function _getOptIns(user_id, callback2) {
        $.ajax({
            type: 'GET',
            url: '/opt-ins?id=' + user_id
        }).error(function() {
            loading_modal.hide();
            callback2('an error occurred');
        }).done(function(result) {
            loading_modal.hide();
            callback2(null, result);
        });
    }

    return {
        init: init
    }

}());