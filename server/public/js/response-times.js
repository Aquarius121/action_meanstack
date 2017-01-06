var response_times_page = (function () {

    var long_running_responses_container;
    var longest_running_responses_container;
    var average_chart_container;
    var max_chart_container;
    var response_count_chart_container;

    function init() {
        long_running_responses_container = $('.long-running-responses-container');
        longest_running_responses_container = $('.longest-running-responses-container');
        average_chart_container = $('.avg-chart-container');
        max_chart_container = $('.max-chart-container');
        response_count_chart_container = $('.response-count-chart-container');

        loading_modal.show();

        clock_widget.init({
            container: $('.clock-container'),
            isUTC: true
        });

        $('button.btn-clear-response-times').click(function() {
            loading_modal.show();

            $.ajax({
                type: 'DELETE',
                url: '/system/response-times?times=true'
            }).error(function(jqXHR) {
                loading_modal.hide();
                alert_modal.showFromXHR('Error', jqXHR);
            }).success(function(result) {
                window.location.reload();
            });
        });

        $('button.btn-clear-long-responses').click(function() {
            loading_modal.show();
            $.ajax({
                type: 'DELETE',
                url: '/system/response-times?long-requests=true'
            }).error(function(jqXHR) {
                loading_modal.hide();
                alert_modal.showFromXHR('Error', jqXHR);
            }).success(function(result) {
                window.location.reload();
            });
        });

        $('button.btn-clear-longest-responses').click(function() {
            loading_modal.show();
            $.ajax({
                type: 'DELETE',
                url: '/system/response-times?longest-requests=true'
            }).error(function(jqXHR) {
                loading_modal.hide();
                alert_modal.showFromXHR('Error', jqXHR);
            }).success(function(result) {
                window.location.reload();
            });
        });

        $.ajax({
            type: 'GET',
            url: '/system/response-times'
        }).error(function(jqXHR) {
            loading_modal.hide();
            alert_modal.showFromXHR('Error', jqXHR);
        }).success(function(result) {
            response_times_chart.drawAverages(average_chart_container, result.response_times);
            response_times_chart.drawMaxes(max_chart_container, result.response_times);
            response_times_chart.drawTotals(response_count_chart_container, result.response_times);

            _processLongResponses(result);
            _processLongestResponses(result);

            loading_modal.hide();
        });

        // periodically refresh CPU chart
        setInterval(function() {
            //cpu_data, disk_data, database_data, system_info
            $.ajax({
                type: 'GET',
                url: '/system/response-times'
            }).error(function(jqXHR) {
            }).success(function(result) {
                response_times_chart.drawAverages(average_chart_container, result.response_times);
                response_times_chart.drawMaxes(max_chart_container, result.response_times);
                response_times_chart.drawTotals(response_count_chart_container, result.response_times);

                _processLongResponses(result);
                _processLongestResponses(result);
            });
        }, 18000);
    }

    function _processLongResponses(result) {

        if(typeof(result.long_requests) == 'undefined' || result.long_requests.length == 0) {
            $('.long-running-responses-container').html('No response times have gone over the threshold');
            return;
        }

        var long_response_html = '';
        result.long_requests.forEach(function(long_request, index) {
            //took, path, at
            long_response_html += ((index > 0 ? '<br>' : '') +  moment.utc(long_request.at).format('YYYY/MMM/DD HH:mm:ss') + 'Z ' + long_request.method + ' "' + long_request.path + '" took ' + long_request.took.toFixed(1) + ' ms'
                    + (long_request.user ? ' from user "' + long_request.user + '"' : ''));
        });
        long_running_responses_container.html(long_response_html);
    }

    function _processLongestResponses(result) {

        if(typeof(result.longest_requests) == 'undefined' || result.longest_requests.length == 0) {
            $('.longest-running-responses-container').html('No response times have been logged as the longest');
            return;
        }

        result.longest_requests.sort(function(a, b) {
            return b.took - a.took;
        });

        var longest_response_html = '';
        result.longest_requests.forEach(function(long_request, index) {
            //took, path, at
            longest_response_html += ((index > 0 ? '<br>' : '') +  moment.utc(long_request.at).format('YYYY/MMM/DD HH:mm:ss') + 'Z ' + long_request.method + ' "' + long_request.path + '" took ' + long_request.took.toFixed(1) + ' ms'
            + (long_request.user ? ' from user "' + long_request.user + '"' : ''));
        });
        longest_running_responses_container.html(longest_response_html);
    }

    return {
        init: init
    };
}());

$(function() {
    response_times_page.init();
});