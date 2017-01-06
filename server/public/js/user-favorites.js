var user_favorite_page = (function() {

    function init(caller) {
        var container = $('.user-favorites-container');
        container.html('');

        _getFavorites(caller._id, function(err_fav, favorites_result) {
            if(err_fav) {
                window.alert(err_fav);
                return;
            }
            _getOptIns(caller._id, function(err_opt, opt_result) {
                if(err_opt) {
                    window.alert(err_opt);
                    return;
                }
                favorites_widget.init({
                    remote_url: '',
                    caller: caller,
                    favorites: favorites_result,
                    opt_ins: opt_result,
                    container: container, // user_id, favorites_result, opt_result
                    onBrandSelected: function(id) {
                        window.location.href = '/brand/view/' + id;
                    },
                    onProductSelected: function(id, ean) {
                        window.location.href = '/product/view/' + ean;
                    }
                });
            });
        });
    }

    function _getFavorites(user_id, callback2) {
        $.ajaxSetup({ cache: false });
        $.ajax({
            type: 'GET',
            url: '/favorites?id=' + user_id
        }).error(function() {
            loading_modal.hide();
            callback2('an error occurred');
        }).done(function(result) {
            loading_modal.hide();
            callback2(null, result);
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