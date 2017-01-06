// requires:
// - doT

var product_summary_widget = (function() {

    var template_def =
        '<div class="well animation-flicker-fix" style="padding-bottom: 20px;">' +
            '<div class="pull-left animated flipInX" style="">' +
                '<h3 class="pull-left">{{=it.product.name}}</h3>' +
                '{{? it.caller}}' +
                    '<div class="favorite-container pull-left" style="display: inline; margin-left: 10px; margin-top: 10px;"></div>' +
                '{{?}}' +
                '<div class="clearfix">' +
                '</div>' +
                '{{?it.product.upc && it.product.upc.length > 0}}<div><h5>UPC: {{=it.product.upc}}</h5></div>{{?}}' +
                '<div><h5>EAN: {{=it.product.ean}}</h5></div>' +

                '{{? it.brand}}' +
                    '<div><strong>Brand</strong>:&nbsp;' +
                        '{{? it.brand.link}}' +
                            '<a data-link="{{=it.brand.link}}" class="brand-link">{{=it.brand.name}}</a>' +
                        '{{??}}' +
                            '{{=it.brand.name}}' +
                        '{{?}}' +
                        '{{? it.caller && typeof(cordova) == "undefined" && (it.caller.role == "admin" || it.caller.role == "brand-manager" || it.caller.role == "action-admin")}}' +
                            '<a href="/brand/view/{{=it.brand._id}}" style="margin-left: 10px;"><i class="glyphicon glyphicon-search"></i></a>' +
                        '{{?}}' +
                        '{{? it.caller}}' +
                            '<div class="opt-container" style="display: inline; margin-left: 10px; margin-top: 10px;"></div>' +
                        '{{?}}' +
                    '</div>' +
                '{{?}}' +
            '</div>' +
            '<div class="pull-right">' +
                '{{? typeof(cordova) == "undefined" && it.brand && (it.brand.can_edit || it.brand.can_delete)}}' +
                    '{{? it.brand.can_edit}}' +
                        '<a class="pull-right btn btn-sm btn-success" style="margin-top: 10px;" href="/product/view/{{=it.product.ean}}?mode=edit">Edit</a>' +
                    '{{?}}' +
                    '<div class="clearfix"></div>' +
                    '{{? it.brand.can_delete}}' +
                        '<a class="pull-right btn btn-sm btn-danger delete-product" style="margin-top: 10px;" data-ean="{{=it.product.ean}}">Delete</a>' +
                    '{{?}}' +
                '{{?}}' +
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

        favorite_toggle_widget.init(remote_url, product, brand, container.find('.favorite-container'), caller);
        opt_toggle_widget.init(remote_url, brand, container.find('.opt-container'), caller);

        container.find('a.brand-link').click(function() {
            var brand_link = $(this).data('link');
            window.open(brand_link, "_system");
        });
    }

    return {
        init: init
    }
}());