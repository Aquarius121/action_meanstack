var brand_products_page = (function() {

    function init(brand_id) {
        var container = $('.product-results-container'),
            info_container = $('.brand-info-container');

        container.html('');

        brand_summary_widget.init({
            container: info_container,
            brand_id: brand_id,
            remote_url: ''
            //caller: app.caller
        });

        brand_products_widget.init({
            brand_id: brand_id,
            container: container, // user_id, favorites_result, opt_result
            remote_url: '',
            onSelected: function(id) {
                window.location.href = '/product/view/' + id;
            }
        });
    }

    function _getBrandProducts(brand_id,callback)
    {
        $.ajax({
            type: 'GET',
            url: "/products/brand-products?filter[brand]=" + brand_id + "&page=0&pageSize=20"
        }).error(function() {
            loading_modal.hide();
            callback('an error occurred');
        }).done(function(result) {
            loading_modal.hide();
            callback(null, result);
        });
    }

    return {
        init: init
    }

}());