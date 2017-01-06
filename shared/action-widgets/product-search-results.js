var product_search_results = (function () {

    var widget_template_def =
        '<div class="product-search-results-widget simple">' +
            '<div class="results-count"></div>' +
            '<div class="results-container"></div>' +
            '<div class="text-center">' +
                '<button class="btn btn-xs btn-load-more hidden">Load More</button>' +
            '</div>' +
        '</div>';

    var widget_template = doT.template(widget_template_def);

    var item_template_def =
        '{{~it.products :product:index}}' +
            '<hr>' +
            '<div class="product-result flex-wrap" data-product="{{=product.ean}}">' +
                '<div class="left-side">' +
                    '{{? product.images && product.images.length > 0}}' +
                        '<img class="product-thumbnail" src="{{=product.images[0]}}">' +
                    '{{?? product.brand_logo_url }}' +
                        '<img class="product-thumbnail" src="{{=product.brand_logo_url}}">' +
                    '{{??}}' +
                        '<img class="product-thumbnail">' +
                    '{{?}}' +
                '</div>' +
                '<div class="right-side">' +
                    '<div class="product-name">{{=product.name}}</div>' +
                '</div>' +
                '<div class="clearfix"></div>' +
            '</div>' +
        '{{~}}' +
        '<div style="margin-bottom: 20px;"></div>';

    var item_template = doT.template(item_template_def);

    var verbose_item_template_def =
        '{{~it.products :product:index}}' +
            '<hr>' +
            '<div class="product-result" data-product="{{=product.ean}}">' +
                '<div class="left-side">' +
                    '{{? product.images && product.images.length > 0}}' +
                        '<img class="product-thumbnail" src="{{=product.images[0]}}">' +
                    '{{?? product.brand_logo_url }}' +
                        '<img class="product-thumbnail" src="{{=product.brand_logo_url}}">' +
                    '{{??}}' +
                        '<img class="product-thumbnail">' +
                    '{{?}}' +
                '</div>' +
                '<div class="right-side">' +
                    '<a class="product-name" data-product="{{=product.ean}}">{{=product.name}}</a>' +
                    '<div class="ean-value">EAN: {{=product.ean}}</div>' +
                    '{{?product.brand_name}}<div class="brand-name">{{=product.brand_name}}</div>{{?}}' +
                    '<div class="clearfix"></div>' +
                '</div>' +
                '<div class="clearfix"></div>' +
            '</div>' +
        '{{~}}' +
        '<div style="margin-bottom: 20px;"></div>';

    var verbose_item_template = doT.template(item_template_def);

    function _init(remote_url, container, term, limit, onSelected) {
        container.html(
            '<div class="product-search-results-widget simple">' +
                '<div class="results-count"></div>' +
                '<div class="results-container"></div>' +
                '<div class="text-center">' +
                    '<button class="btn btn-xs btn-load-more hidden">Load More</button>' +
                '</div>' +
            '</div>'
        );

        loading_modal.show();

        container.find('.results-count').html('');
        var start_time = new Date();

        var url = remote_url + '/products/find?limit=' + limit +
            '&ean_or_name=' + encodeURIComponent(term) +
            '&count=true';

        general_util.reportSearch(term);

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
            var result_text = result.count + ' results found in ' + since_text + ' seconds';
            container.find('.results-count').html(result_text);

            _append(container.find('.results-container'), result.products, onSelected);

            _processMoreButton(remote_url, container, term, limit, result, onSelected);
        });
    }

    function _initWithStaticData(container, products, onSelected) {
        container.html(widget_template({}));

        container.find('.results-count').html('');

        _append(container.find('.results-container'), products, onSelected);
    }

    function _append(container, products, onSelected) {
        var html = '';
        html += item_template({products: products});

        container.append(html);

        var product_results = container.find('.product-result');
        product_results.unbind('click');
        product_results.click(function() {
            onSelected($(this).data('product'));
        });
    }

    function _processMoreButton(remote_url, container, term, limit, result_page_one, onSelected) {
        var loadButton = container.find('.btn-load-more');
        if(result_page_one.products.length > 0 && result_page_one.count > limit) {
            loadButton.removeClass('hidden');
        } else {
            loadButton.addClass('hidden');
        }

        var page = 0;
        loadButton.unbind('click');
        loadButton.click(function() {
            page++;

            var url = remote_url + '/products/find?limit=' + limit +
                '&ean_or_name=' + encodeURIComponent(term) +
                '&count=true' +
                '&page=' + page +
                '&pageSize=' + limit;

            var platform = typeof(platform_util) != 'undefined' ? platform_util.getPlatformString() : 'web';
            url += '&platform=' + platform;

            $.ajax({
                type: 'GET',
                url: url
            }).error(function() {
                loading_modal.hide();
                window.alert('an error occurred');
            }).done(function(result) {
                if(result.count <= limit * (page + 1)) {
                    loadButton.addClass('hidden');
                }
                product_search_results.append(container.find('.results-container'), result.products, onSelected);
                loading_modal.hide();
            });
        });
    }

    return {
        init: function(remote_url, container, term, limit, onSelected) {
            _init(remote_url, container, term, limit, onSelected);
        },

        initWithStaticData: function(container, product_infos, onSelected) {
            _initWithStaticData(container, product_infos, onSelected);
        },

        append: function(container, products, onSelected) {
            _append(container, products, onSelected);
        }
    };
}());