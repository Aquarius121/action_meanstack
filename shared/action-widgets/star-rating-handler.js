// a wrapper for the star rating widget that handles ajax requests and such
var star_rating_handler = (function () {

    function init(container, page, remote_url) {
        $.ajax({
            type: 'GET',
            url: remote_url + '/feedback?type=rating&page=' + page
        }).success(function(data) { // , text, jqXHR

            var value = 0;
            if(data && data.value) {
                value = data.value;
            }

            displayValue(container, page, remote_url, value);

        }).error(function(data, text) {
            console.log('failed to get rating: ' + text);
        });
    }

    function displayValue(container, page, remote_url, value) {
        star_rating_widget.init(container, {
            value: value,
            on_selected: function(value_selected) {

                loading_modal.show();
                $.ajax({
                    type: 'PUT',
                    url: remote_url + '/feedback',
                    data: {
                        type: 'rating',
                        platform: 'web',
                        page: page,
                        value: value_selected
                    }
                }).success(function(data) { // , text, jqXHR
                    loading_modal.hide();
                    init(container, page, remote_url);

                    alert_modal.show('Success', 'Feedback sent!');
                }).error(function(data, text) {
                    loading_modal.hide();
                    window.alert('An error occurred: ' + data.responseText);
                });
            }
        });
    }

    return {
        init: init
    };

}());
