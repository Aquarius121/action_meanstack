var report_brand_usage_page = (function() {

    var start_of_timeframe = moment({hour: 0, minute: 0, seconds: 0, milliseconds: 0}).add({'day': -7});
    var end_of_timeframe = moment();
    var brand = undefined;

    function init() {
        init_date_pickers();

        var brand_container = $('.brand-select-widget');

        brand_select.init(brand_container);

        brand_container.change(function() {
            brand = brand_select.getSelection($('.brand-select-widget'));
            refresh_charts();
        });

        refresh_charts();
    }

    function init_date_pickers() {
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
    }

    function refresh_charts() {
        var visible_when_no_brand_only = [
            $('.registrations-platform-percent'),
            $('.registrations-platform-amount'),
            $('.favorites-report')
        ];
        if(typeof(brand) == 'undefined') {
            visible_when_no_brand_only.forEach(function(container_to_show) {
                container_to_show.find('.chart-container').html('');
                //container_to_show.find('.table-container').html('');
                container_to_show.removeClass('hidden');
            });
            registrations_by_platform_chart.init($('.registrations-platform-percent').find('.chart-container'), start_of_timeframe.valueOf(), end_of_timeframe.valueOf(), 'percent');
            registrations_by_platform_chart.init($('.registrations-platform-amount').find('.chart-container'), start_of_timeframe.valueOf(), end_of_timeframe.valueOf());
            report_favorites_table.init($('.favorites-report').find('.table-container'), start_of_timeframe.valueOf(), end_of_timeframe.valueOf());
            return;
        }
        visible_when_no_brand_only.forEach(function(container_to_show) {
            container_to_show.addClass('hidden');
        });
    }

    return {
        init: init
    }

}());

$(function() {
    $( ".ui-tooltip" ).tooltip({});
    report_brand_usage_page.init();
});