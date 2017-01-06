var brand_products_widget = (function () {

    var item_template_def =
        '{{~it.products :product:index}}' +
            '<hr>' +
            '<div class="product-result" data-product="{{=product.ean}}">' +
                '<a data-product="{{=product.ean}}">{{=product.name}}</a>' +
                '<div class="clearfix"></div>' +
                '<div class="pull-left ean-value">EAN: {{=product.ean}}</div>' +
                '{{?product.brand_name}}<div class="pull-right">{{=product.brand_name}}</div>{{?}}' +
                '<div class="clearfix"></div>' +
            '</div>' +
        '{{~}}' +
        '<div style="margin-bottom: 20px;"></div>';

    var item_template = doT.template(item_template_def);

    var default_options = {
        container: null,
        brand_id: null,
        remote_url: null,
        page_size: 15,
        onSelected: function(product) {}
    };

    function _init(options_in) {
        var options = $.extend({}, default_options, options_in);

        options.container.html(
            '<div class="brand-products-widget simple">' +
                '<div class="results-count"></div>' +
                '<div class="results-container"></div>' +
                '<div class="text-center">' +
                    '<button class="btn btn-xs btn-load-more hidden">Load More</button>' +
                '</div>' +
            '</div>'
        );

        loading_modal.show();

        options.container.find('.results-count').html('');
        var start_time = new Date();

        var url = options.remote_url + '/products?filter[brand]=' + options.brand_id + '&page=0&pageSize=' + options.page_size;

        var platform = typeof(platform_util) != 'undefined' ? platform_util.getPlatformString() : 'web';
        url += '&platform=' + platform;

        $.ajax({
            type: 'GET',
            url: url
        }).error(function() {
            loading_modal.hide();
            window.alert('an error occurred');
        }).done(function(result) {
            loading_modal.hide();

            var since_text = ((new Date().getTime() - start_time.getTime()) / 1000).toFixed(3);
            var result_text = result.total_records + ' results found in ' + since_text + ' seconds';
            options.container.find('.results-count').html(result_text);

            product_search_results.append(options.container.find('.results-container'), result.rows, options.onSelected);

            _processMoreButton(options, result);
        });
    }

    function _processMoreButton(options, result_page_one) {
        var loadButton = options.container.find('.btn-load-more');
        if(result_page_one.rows.length > 0 && result_page_one.total_records > options.page_size) {
            loadButton.removeClass('hidden');
        } else {
            loadButton.addClass('hidden');
        }

        var page = 0;
        loadButton.unbind('click');
        loadButton.click(function() {
            page++;

            var url = options.remote_url + '/products?filter[brand]=' + options.brand_id + '&page=' + page + '&pageSize=' + options.page_size;

            var platform = typeof(platform_util) != 'undefined' ? platform_util.getPlatformString() : 'web';
            url += '&platform=' + platform;

            // TODO: app_util.makeRequest?
            $.ajax({
                type: 'GET',
                url: url
            }).error(function() {
                loading_modal.hide();
                window.alert('an error occurred');
            }).done(function(result) {
                if(result.total_records <= options.page_size * (page + 1)) {
                    loadButton.addClass('hidden');
                }
                product_search_results.append(options.container.find('.results-container'), result.rows, options.onSelected);
                loading_modal.hide();
            });
        });
    }

    return {
        init: function(options) {
            _init(options);
        }
    };
}());