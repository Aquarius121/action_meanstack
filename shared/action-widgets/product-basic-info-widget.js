// requires:
// - doT

var product_basic_info_widget = (function() {

    var template_def =
        '<div class="text-center product-basic-info-widget animation-flicker-fix">' +
            '<div class="animated flipInX" style="">' +
                '{{? it.brand}}' +
                    '<h4>' +
                        '<a class="brand-link">{{=it.brand.name}}</a>' +
                    '</h4>' +
                '{{?}}' +
                '<h4>{{=it.product.name}}</h4>' +
                '{{?it.product.upc && it.product.upc.length > 0}}<div><h5>UPC: {{=it.product.upc}}</h5></div>{{?}}' +
                //'<div><h5>EAN: {{=it.product.ean}}</h5></div>' +
            '</div>' +
            '<div class="clearfix"></div>' +
        '</div>';

    var template = doT.template(template_def);

    function init(remote_url, product, brand, container, caller) {
        if(caller && caller.role && typeof(brand) != 'undefined') {
            if(caller.role == 'admin' || caller.role == 'action-admin') {
                brand.can_edit = true;
                brand.can_delete = true;
            } else if(caller.role == 'brand-manager' && caller.managed_brands.indexOf(brand._id) != -1) {
                brand.can_edit = true;
                brand.can_delete = false;
            }
        }

        if(typeof(product['name']) != 'undefined') {
            var html = template({
                product: product,
                brand: brand,
                caller: caller
            });
            container.html(html);
        }

        container.find('a.delete-product').click(function() {
            confirm_modal.setButtonClasses('btn-success', 'btn-danger');
            confirm_modal.setButtonText('No', 'Yes');
            confirm_modal.show('Delete Product', 'Are you sure you want to delete this product?', function() {
                loading_modal.show('Saving...');
                $.ajax({
                    type: 'DELETE',
                    url: '/product/' + product._id
                }).error(function(e) {
                    loading_modal.hide();
                    alert_modal.show('Error', e);
                }).done(function() { // result
                    window.location.href = '/products/view';
                });
            });
        });

        container.find('a.brand-link').click(function() {

            if(typeof(cordova) != 'undefined' && typeof(app_controller) != 'undefined') {
                app_controller.getPage('#brand').setBrandId(brand._id);
                app_controller.openInternalPage('#brand');
                return;
            }
            window.location.href = '/brand/view/' + brand._id;
        });
    }

    return {
        init: init
    }
}());