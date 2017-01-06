var product_jumbotron_widget = (function () {

    // pass in {data:[], categories:[]}
    var widget_template_def =
        '<div class="product-jumbotron-widget">' +
            '<div class="product-image-jumbotron">' +
                '<div class="crop"><div class="overlay"></div></div>' +
                '<div class="circle">' +
                    '<img class="circle" src="">' +
                '</div>' +
            '</div>' +
            '<div class="basic-info"></div>' +
            '<div class="product-action-container">' +
                '<div class="favorite-container"></div>' +
                '<div class="opt-container"></div>' +
            '</div>' +
        '</div>';

    var widget_template = doT.template(widget_template_def);

    var default_options = {
        container: null,
        product: null,
        brand: null,
        remote_url: null,
        caller: null
    };

    function _init(options_in) {
        var options = $.extend({}, default_options, options_in);
        options.container.html(widget_template(options));

        // TODO: remove this hack at some point - it's a crutch for options.brand.opt updating here, and anywhere else it's used in the app
        options.brand = options_in.brand;

        // process favorites visibility
        if(options.product && options.brand) {

            general_util.applyBestProductImage({
                product: options.product,
                brand: options.brand
            }, options.container);
            favorite_toggle_widget.init(options.remote_url, options.product, options.brand, options.container.find('.favorite-container'), options.caller, function() {
                var url = options.remote_url + '/opt-in?id=' + options.caller._id + '&brand=' + options.brand._id;
                var data = {
                    brand: options.brand._id
                };

                $.ajax({
                    type: 'PUT',
                    url: url,
                    data: data
                }).error(function(e) {
                    alert_modal.showFromXHR('Error', e);
                }).done(function() { // result
                    options.brand.opt = true;
                    opt_toggle_widget.init(options.remote_url, options.brand, options.container.find('.opt-container'), options.caller);
                });
            });

            opt_toggle_widget.init(options.remote_url, options.brand, options.container.find('.opt-container'), options.caller);
        }

        product_basic_info_widget.init(options.remote_url, options.product, options.brand, options.container.find('.basic-info'), options.caller);
    }

    return {
        init: _init
    };
}());