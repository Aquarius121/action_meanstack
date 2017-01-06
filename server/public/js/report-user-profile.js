var report_user_profile_page = (function() {

    var start_of_timeframe = moment({hour: 0, minute: 0, seconds: 0, milliseconds: 0}).add({'day': -7});
    var end_of_timeframe = moment();
    var brand = undefined;
    var brand_name = undefined;
    var managed_brands = undefined;

    // widget and container selectors
    var logins_platform_percent_container;
    var brand_select_selector;
    var drilldown_selector;
    var registration_count_container;
    var favorites_report_container;
    var unique_users_container;

    function init() {
        logins_platform_percent_container = $('.logins-platform-percent');
        brand_select_selector = $('input.brand-select-widget');
        drilldown_selector = $('select.drilldown');
        registration_count_container = $('.registrations-platform-amount');
        favorites_report_container = $('.favorites-report');
        unique_users_container = $('.unique-users-container');

        var managed_brands = $('.managed-brands');
        if(managed_brands.length > 0) {
            managed_brands = managed_brands.data('brands').split(',');
            if(managed_brands.length == 1) {
                $('.brand-filter').addClass('hidden');
            }
        } else {
            managed_brands = undefined;
        }

        date_range_widget.init($('.date-range-container'), {
            orientation: 'vertical'
        });

        drilldown_selector.change(function() {
            refresh_charts();
        });

        brand_select.init(brand_select_selector);
        brand_select_selector.change(function() {
            brand = brand_select.getSelection($('.brand-select-widget'));
            brand_name = brand_select.getSelectionText($('.brand-select-widget'));

            refresh_brand_charts();
        });

        init_date_pickers();

        // if we have exactly one managed brand, get the brand's name and select it
        // otherwise, just go ahead and render everything
        if(typeof(managed_brands) == 'undefined' || managed_brands.length != 1) {
            refresh_charts();
            return;
        }

        $.ajax({
            type: 'GET',
            url: '/brand/' + managed_brands[0]
        }).success(function(data) {
            brand = managed_brands[0];

            if(data.length > 0) {
                brand_name = data[0].name;
            }
            refresh_charts();
        });
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
        var charts = [
            logins_platform_percent_container,
            registration_count_container
        ];
        charts.forEach(function(container_to_show) {
            container_to_show.find('.chart-container').html('');
            container_to_show.removeClass('hidden');
        });

        var from = start_of_timeframe.valueOf(), to = end_of_timeframe.valueOf();

        refresh_logins_charts(from, to);
        refresh_registration_charts(from, to);

        refresh_brand_charts();
        refresh_registration_count(from, to);

        refresh_unique_users_graphs(from, to);
    }

    function refresh_logins_charts(from, to) {
        var logins_by_platform_options = {
            from: from,
            to: to,
            type: 'percent',
            drilldown: drilldown_selector.val()
        };
        logins_by_platform_chart.init(logins_platform_percent_container.find('.chart-container'), logins_by_platform_options);
    }

    function refresh_registration_charts(from, to) {
        var registrations_by_platform_options = {
            from: from,
            to: to,
            drilldown: drilldown_selector.val()
        };
        registrations_by_platform_chart.init(registration_count_container.find('.chart-container'), registrations_by_platform_options);
    }

    function refresh_registration_count(from, to) {
        $('.registration-count').html('');
        $.ajax({
            type: 'GET',
            url: '/report/daily_registrations_report?type=registrations-by-platform&from=' + from + '&to=' + to // 1401336000000, 1401422399999
        }).success(function(data) {
            var sum = 0;
            data.forEach(function(day_data) {
                Object.keys(day_data.values).forEach(function(value) {
                    sum += day_data.values[value];
                });
            });
            $('.registration-count').html(sum + ' registration' + (sum == 1 ? '' : 's') +' occurred during this period');
        });
    }

    function refresh_unique_users_graphs(from, to) {
        var unique_users_options = {
            from: from,
            to: to,
            path: '/report/monthly_unique_users_report',
            report_type: 'unique-users-by-month'
        };
        monthly_unique_users_graph.init(unique_users_container, unique_users_options);

        var weekly_unique_users_options = {
            from: from,
            to: to,
            path: '/report/monthly_unique_users_report',
            report_type: 'unique-users-by-week'
        };
        weekly_unique_users_graph.init($('.unique-users-weekly-container'), weekly_unique_users_options);

    }

    function refresh_brand_charts() {
        var charts = [
            favorites_report_container
        ];
        charts.forEach(function(container_to_show) {
            container_to_show.find('.chart-container').html('');
            container_to_show.removeClass('hidden');
        });

        if(typeof(brand) != 'undefined') {
            $('.favorites-brand-container').removeClass('hidden');
        } else {
            $('.favorites-brand-container').addClass('hidden');
        }

        var from = start_of_timeframe.valueOf(), to = end_of_timeframe.valueOf();

        var report_favorites_table_options = {
            from: from,
            to: to,
            brand: brand,
            brand_name: brand_name
        };
        report_favorites_table.init(favorites_report_container.find('.table-container'), report_favorites_table_options);

        var favorites_by_brand_options = {
            from: from,
            to: to,
            brand: brand,
            brand_name: brand_name
        };
        favorites_by_brand_chart.init($('.favorites-by-factor'), favorites_by_brand_options);

        refresh_opt_ins(from, to);
    }

    function refresh_opt_ins(from, to) {
        opt_ins_table.init($('.opt-ins-table-container'), {
            from: from,
            to: to,
            brand: brand
        });
    }

    return {
        init: init
    }

}());

$(function() {
    $( ".ui-tooltip" ).tooltip({});
    report_user_profile_page.init();
});