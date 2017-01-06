var report_action_statistics_page = (function() {

    var start_of_timeframe = moment({hour: 0, minute: 0, seconds: 0, milliseconds: 0}).add({'day': -7});
    var end_of_timeframe = moment();

    function init() {
        var from_datepicker = $('.from-date');
        var to_datepicker = $('.to-date');

        $('.datepicker').datepicker({format: 'mm/dd/yyyy', changeYear: true, autoclose: true});
        from_datepicker.datepicker('update', start_of_timeframe.format('MM/DD/YYYY'));
        to_datepicker.datepicker('update', end_of_timeframe.format('MM/DD/YYYY'));

        from_datepicker.on('changeDate', function(ev){
            start_of_timeframe = ev.date;
            refresh_charts();
        });
        to_datepicker.on('changeDate', function(ev){
            end_of_timeframe = moment(ev.date);
            end_of_timeframe.add({'day': 1, 'milliseconds': -1});
            refresh_charts();
        });

        $('a.export-action-statistics').click(function() {
            window.location.href = '/report/daily_action_statistics_report?type=lookup-totals&format=csv&from=' + start_of_timeframe.valueOf() + '&to=' + end_of_timeframe.valueOf();
        });

        refresh_charts();
    }

    function refresh_charts() {
        // will go back 365 days
        $.ajax({
            type: 'GET',
            url: '/report/daily_action_statistics_report?type=lookup-totals&limit=365&from=' + start_of_timeframe.valueOf() + '&to=' + end_of_timeframe.valueOf() // 1401336000000, 1401422399999
        }).success(function(data) {
            // TODO: massage/aggregate data
            var totals_by_id = {};
            data.forEach(function(day_record) {
                Object.keys(day_record.values).forEach(function(value_key) {
                    if(typeof(totals_by_id[value_key]) == 'undefined') {
                        totals_by_id[value_key] = day_record.values[value_key];
                        return;
                    }
                    totals_by_id[value_key].scanned += day_record.values[value_key].scanned;
                    totals_by_id[value_key].searched += day_record.values[value_key].searched;
                });
            });

            // convert to array
            var data_result = [];
            Object.keys(totals_by_id).forEach(function(total_key) {
                var item = totals_by_id[total_key];
                item._id = total_key;
                data_result.push(item);
            });
            report_action_statistics_table_widget.init($('.table-container'), data_result);
        }); // TODO: error

        /*
        page_ratings_chart.init($('.survey-container'), {
            from: start_of_timeframe.valueOf(),
            to: end_of_timeframe.valueOf(),
            path: '/report/daily_page_ratings_report',
            report_type: 'ratings-totals'
        });
        */
        app_sentiment_chart.init($('.survey-container'), {
            from: start_of_timeframe.valueOf(),
            to: end_of_timeframe.valueOf(),
            path: '/report/daily_survey_report',
            report_type: 'app-sentiment-totals'
        });
    }

    return {
        init: init
    }

}());

$(function() {
    $( ".ui-tooltip" ).tooltip({});
    report_action_statistics_page.init();
});