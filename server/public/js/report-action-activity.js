var report_action_activity_page = (function() {

    var start_of_timeframe = moment({hour: 0, minute: 0, seconds: 0, milliseconds: 0}).add({'day': -7});
    var end_of_timeframe = moment();
    var brand = undefined;
    var brand_name = undefined;
    var managed_brands = undefined;

    function init() {

        // snag a list of managed brands, set visibility of brand filter
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

        $('select.drilldown').change(function() {
            refresh_charts();
        });

        brand_select.init($('input.brand-select-widget'));
        $('input.brand-select-widget').change(function() {
            brand = brand_select.getSelection($('.brand-select-widget'));
            brand_name = brand_select.getSelectionText($('.brand-select-widget'));

            refresh_charts();
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
        var from = start_of_timeframe.valueOf(), to = end_of_timeframe.valueOf();

        _refreshContactsByBrand(from, to);
        _refreshContactsByBrandTable(from, to);
        _refreshContactsByProduct(from, to);
        _refreshContactsByBrandAndType(from, to);
    }

    function _refreshContactsByBrand(from, to) {
        var report_messages_by_brand_options = {
            from: from,
            to: to,
            brand: brand,
            brand_name: brand_name,
            drilldown: $('select.drilldown').val()
        };

        var contacts_by_brand_container = $('.contacts-by-brand');
        contacts_by_brand_container.find('.chart-container').html('');

        if(typeof(brand) == 'undefined') {
            contacts_by_brand_container.parent().removeClass('hidden');
            messages_by_brand_chart.init(contacts_by_brand_container, report_messages_by_brand_options);
        } else {
            contacts_by_brand_container.parent().addClass('hidden');
        }
    }

    function _refreshContactsByBrandTable(from, to) {
        var table_options = {
            from: from,
            to: to,
            brand: brand,
            brand_name: brand_name
        };

        var contacts_by_brand_container = $('.contacts-by-brand-summary-container');
        contacts_by_brand_container.html('');

        messages_by_brand_summary_table.init(contacts_by_brand_container, table_options);
    }

    function _refreshContactsByBrandAndType(from, to) {
        var chart_options = {
            from: from,
            to: to,
            brand: brand,
            brand_name: brand_name,
            drilldown: $('select.drilldown').val(),
            apply_drilldown_as: brand
        };

        var chart_container_wrapper = $('.contacts-by-brand-and-type-container');
        chart_container_wrapper.find('.chart-container').html('');

        if(typeof(brand) != 'undefined') {
            chart_container_wrapper.removeClass('hidden');
            messages_by_type_for_brand_chart.init(chart_container_wrapper, chart_options);
        } else {
            chart_container_wrapper.addClass('hidden');
        }
    }

    function _refreshContactsByProduct(from, to) {
        var report_messages_by_product_options = {
            from: from,
            to: to,
            brand: brand,
            brand_name: brand_name,
            drilldown: $('select.drilldown').val()
        };

        var contacts_by_product_container = $('.contacts-by-product');
        contacts_by_product_container.removeClass('hidden');
        contacts_by_product_container.find('.chart-container').html('');

        messages_by_product_chart.init(contacts_by_product_container, report_messages_by_product_options);
    }

    return {
        init: init
    }

}());

$(function() {
    report_action_activity_page.init();
    $( ".ui-tooltip" ).tooltip({});
});