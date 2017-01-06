var brand_transfer_products_page = (function() {

    function init(brand) {
        var table_element = $('table.products-table');
        var submit_button_element = $('.btn-submit');

        var last_result = [];
        var pending_products = [];

        $('.products-table').css('display', '');

        // add a table for the existing products
        products_table_widget.initAdmin(table_element, null, [[0,5]], function(ean) {

            // get the "full" product record for the selected ean
            var matching_product_from_service = last_result.filter(function(product) {
                return product.ean == ean;
            });
            if(matching_product_from_service.length == 0) {
                alert('something went wrong: could not find product from most recent data set');
                return;
            }

            // for each match (should only be one)
            matching_product_from_service.forEach(function(product) {

                // add the product to the pending list, and don't allow duplicates
                var existing_pending_products = pending_products.filter(function(existing_product) {
                    return product.ean == existing_product.ean;
                });
                if(existing_pending_products.length == 0) {
                    pending_products.push(product);
                }
            });

            // redraw the list of products pending transfer
            refreshPendingProductsTable();

            submit_button_element.removeClass('hidden');

        }, function(data) {
            last_result = data;
        });

        function refreshPendingProductsTable() {

            // make a brand new product table for the selected products
            products_table_widget.init({
                selector: $('.importable-products-container'),
                hide_filters: false,
                is_admin: true,
                product_list: pending_products,
                onSelected: function (ean) {
                    pending_products = pending_products.filter(function(product) {
                        return product.ean != ean;
                    });

                    refreshPendingProductsTable();

                    if(pending_products.length == 0) {
                        submit_button_element.addClass('hidden');
                    }
                }
            });
        }

        submit_button_element.click(function() {

            var idList = pending_products.map(function(product) { return product._id; });

            loading_modal.show('Adding...');
            $.ajax({
                type: 'POST',
                url: '/products/' + idList.join(',') + '/brand?brand=' + brand._id
            }).error(function(e) {
                loading_modal.hide();
                alert_modal.show('Error', e.responseText);
            }).done(function(result) {
                loading_modal.hide();
                alert_modal.show('Success', 'Successfully transferred the selected products for this brand', function() {
                    window.location.href = '/brand/view/' + brand._id + '?mode=edit';
                });
            });
        });
    }

    return {
        init: init
    }

}());

$(function() {
    $( ".ui-tooltip" ).tooltip({});
});