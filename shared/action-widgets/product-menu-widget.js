var product_menu_widget = (function() {

    var vertical_template_def =
        '<div class="product-menu-widget vertical">' +
            '{{?it.show_info}}' +
                '<a class="btn menu-button product-information">info</a>' +
                '<div class="clearfix"></div>' +
            '{{?}}' +

            '{{?it.show_faq}}' +
                '<a class="btn menu-button product-faq">faq</a>' +
                '<div class="clearfix"></div>' +
            '{{?}}' +

            '{{?it.show_locator}}' +
                '<a class="btn menu-button product-where-to-buy">where to buy</a>' +
                '<div class="clearfix"></div>' +
            '{{?}}' +

            '{{?it.brand && it.brand.crm_email_endpoint}}' +
                '<a class="btn menu-button how-can-we-help">contact us</a>' +
                '<div class="clearfix"></div>' +
            '{{?}}' +
        '</div>';

    var horizontal_template_def =
        '<div class="product-menu-widget horizontal">' +
            '{{?it.show_info}}' +
                '<a class="product-information">info</a>' +
            '{{?}}' +

            '{{?it.show_faq}}' +
                '<a class="product-faq">faq</a>' +
            '{{?}}' +

            '{{?it.show_locator}}' +
                '<a class="product-where-to-buy">where to buy</a>' +
            '{{?}}' +

            '{{?it.brand && it.brand.crm_email_endpoint}}' +
                '<a class="how-can-we-help">contact us</a>' +
            '{{?}}' +
        '</div>';

    var vertical_template = doT.template(vertical_template_def);
    var horizontal_template = doT.template(horizontal_template_def);

    var default_options = {
        horizontal: false,
        show_product_info: true,
        brand: null,
        product: null,
        onProductInfo: function() {},
        onFAQ: function() {},
        onWhereToBuy: function() {},
        onContactUs: function() {}
    };

    function init(options_in) {
        var options = $.extend({}, default_options, options_in);

        if(!options.brand && !options.product) {
            options.container.html('');
            return;
        }

        // figure out what to show
        var show_info = false, show_locator = false, show_faq = false;
        {
            // process where to buy visibility
            if((options.brand && options.brand.locator) ||
                (options.product && options.product.map_search_types)) {
                show_locator = true;
            }

            // process self help visibility
            if(options.product) {
                if(options.product.ingredients ||
                        options.product.instructions ||
                        (options.product.nutrition_labels && options.product.nutrition_labels.length > 0) ||
                        (options.product.promo_videos && options.product.promo_videos.length > 0) ||
                        options.product.brand_message) {
                    show_info = true;
                }
            }
            if((options.brand && options.brand.faq) || (options.product && options.product.faq)) {
                show_faq = true;
            }
        }

        if(options.horizontal) {
            options.container.html(horizontal_template({
                show_locator: show_locator,
                show_info: options.show_product_info && show_info,
                show_faq: show_faq,
                brand: options.brand
            }));
        } else {
            options.container.html(vertical_template({
                show_locator: show_locator,
                show_info: options.show_product_info && show_info,
                show_faq: show_faq,
                brand: options.brand
            }));
        }

        options.container.find('.product-information').click(function() {
            options.onProductInfo();
        });

        options.container.find('.product-faq').click(function() {
            options.onFAQ();
        });

        options.container.find('.product-where-to-buy').click(function() {
            options.onWhereToBuy();
        });

        options.container.find('.how-can-we-help').click(function() {
            options.onContactUs();
        });
    }

    return {
        init: init
    }
}());

