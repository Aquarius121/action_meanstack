// requires:
// - doT

var favorites_widget = (function() {

    var default_options = {
        remote_url: null,
        container: null,
        favorites: [],
        opt_ins: [],
        user_id: null,
        onBrandSelected: function(brand_id) {},
        onProductSelected: function(product_id, product_ean) {}
    };

    var favorites_template_def =
        '<div class="favorites-widget">' +
            '{{?!it || it.length == 0}}' +
                '<div class="text-center no-favorites">You have not told us about your favorite products.</div>' +
            '{{??}}' +
                '{{~it :value:index}}' +
                    '<div class="well">' +
                        '<div class="image-container">' +
                            '{{?value.images && value.images.length > 0}}' +
                                '<img src="{{=general_util.safeEncodeURI(value.images[0])}}">' +
                            '{{??value.brand_logo_url}}' +
                                '<img src="{{=general_util.safeEncodeURI(value.brand_logo_url)}}">' +
                            '{{?}}' +
                        '</div>' +
                        '<div class="favorites-info">' +
                            '{{?value.logo_url}}' +
                                '<img class="pull-right" src="{{=value.logo_url}}" style="max-height: 32px; max-width: 80px;">' +
                            '{{?}}' +
                            '<div class="clearfix"></div>' +
                            '<a class="product-link" data-id="{{=value._id}}" data-ean="{{=value.ean}}">{{=value.name}}</a><div class="clearfix"></div>' +

                            '<div class="bottom-line">' +
                                '<div class="brand-link-container">' +
                                    '<a class="brand-link" data-id="{{=value.brand}}">{{=value.brand_name}}</a>' +
                                '</div>' +
                                '<div class="opt-container" data-brand="{{=value.brand}}" ></div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="clearfix"></div>' +
                    '</div>' +
                '{{~}}' +
            '{{?}}' +
        '</div>';

    var favorites_template = doT.template(favorites_template_def);

    function init(options_in) {

        var options = $.extend({}, default_options, options_in);

        var optins = {
            brands: {},
            products: {}
        };

        var favorites = {
            brands: {},
            products: {}
        };

        // index by id, partition into brand/product faves
        options.opt_ins.brands.forEach(function(opt_in) {
            if(typeof(opt_in._id) != 'undefined') {
                optins.brands[opt_in._id] = {};
            }
        });
        options.opt_ins.products.forEach(function(opt_in) {
            if(typeof(opt_in._id) != 'undefined') {
                optins.products[opt_in._id] = {};
            }
        });
        options.favorites.brands.forEach(function(brand_fave) {
            favorites.brands[brand_fave._id] = brand_fave;
        });

        var brands_for_favorites = {};
        options.favorites.products.forEach(function(product_favorite) {
            if(typeof(product_favorite.brand) != 'undefined') {
                brands_for_favorites[product_favorite.brand] = 1;

                // attach a brand_logo_url to the product if able
                var brand = favorites.brands[product_favorite.brand];
                if(typeof(brand) != 'undefined') {
                    product_favorite.brand_logo_url = brand.logo_url;
                }
            }
        });

        console.log(JSON.stringify(options.favorites.products));

        // we only currently show favorite products
        options.container.html(favorites_template(options.favorites.products));

        // for each distinct brand in the favorite products, we need to add opt-in widgets
        Object.keys(brands_for_favorites).forEach(function(product_favorite_brand) {
            _applyOptInWidget(product_favorite_brand);
        });

        options.container.find('a.favorite-link').click(function() {
            window.open($(this).data('link'), "_system");
        });

        options.container.find('input.favorite-opt').change(function() {
            var url = options.remote_url + '/opt-in?brand=' + $(this).data('id') + '&id=' + options.user_id;

            if($(this).prop('checked')) {

                $.ajax({
                    type: 'PUT',
                    url: url
                }).error(function(e) {
                    alert_modal.showFromXHR('Error', e);
                }).success(function() { // result
                    console.log('success');
                });
            } else {

                $.ajax({
                    type: 'DELETE',
                    url: url
                }).error(function(e) {
                    alert_modal.showFromXHR('Error', e);
                }).success(function() { // result

                    _applyOptInWidget($(this).data('id'));
                    console.log('success');
                });
            }
        });

        options.container.find('a.policy-link').click(function() {
            window.open($(this).data('link'), "_system");
        });

        options.container.find('a.brand-link').click(function() {
            options.onBrandSelected($(this).data('id'));
        });

        options.container.find('a.product-link').click(function() {
            options.onProductSelected($(this).data('id'), $(this).data('ean'));
        });

        function _applyOptInWidget(brand_id) {
            var opt_container = options.container.find('.opt-container[data-brand=' + brand_id + ']');

            var faux_caller = {
                _id: options.user_id
            };

            var faux_brand = {
                _id: brand_id
            };
            if(optins.brands[brand_id]) {
                faux_brand.opt = true;
            }

            opt_container.html('');
            opt_toggle_widget.init(options.remote_url, faux_brand, opt_container, faux_caller);
        }
    }

    return {
        init: init
    }

}());