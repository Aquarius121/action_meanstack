// requires:
// - doT

var favorite_toggle_widget = (function() {

    var template_def =
        '<div class="toggle-widget">' +
        '{{? it.product}}' +
            '{{? it.product.favorite}}' +
                '<a class="unfavorite">' +
                    '<i class="glyphicon {{=it.active_class}} ui-tooltip" data-placement="bottom" data-original-title="Favorited"></i> favorited' +
                '</a>' +
                '<a class="favorite" style="display: none;">' +
                    '<i class="glyphicon {{=it.inactive_class}} ui-tooltip" data-placement="bottom" data-original-title="Favorite"></i> favorite' +
                '</a>' +
            '{{??}}' +
                '<a class="favorite">' +
                    '<i class="glyphicon {{=it.inactive_class}} ui-tooltip" data-placement="bottom" data-original-title="Favorite"></i> favorite' +
                '</a>' +
                '<a class="unfavorite" style="display: none;">' +
                    '<i class="glyphicon {{=it.active_class}} ui-tooltip" data-placement="bottom" data-original-title="Favorited"></i> favorited' +
                '</a>' +
            '{{?}}' +
        '{{?}}' +
        '</div>';

    var template = doT.template(template_def);

    // expects product.favorite to be set, and possibly brand.opt
    function init(remote_url, product, brand, container, caller, onOpt) {
        container.html(template({
            product: product,
            brand: brand,
            caller: caller,
            active_class: 'glyphicon-heart',
            inactive_class: 'glyphicon-heart-empty'
        }));

        container.find('a.favorite').click(function() {
            var that = $(this), saved = false;

            // if the user is already opted into the brand, don't ask
            if(typeof(brand.opt) != 'undefined') {
                saveFavorite(that, false);
                return;
            }

            confirm_modal.setButtonClasses('btn-success', 'btn-success');
            confirm_modal.setButtonText('No', 'Yes');
            confirm_modal.show('Opt In?', 'Added to favorites.  Would you like to receive special offers from this brand?', function() {
                saved = true;
                saveFavorite(that, true);
            }, function() {
                saved = true;
                saveFavorite(that, false);
            }, function() {
                if(!saved) {
                    saveFavorite(that, false);
                }
            });
        });

        container.find('a.unfavorite').click(function() {
            var that = $(this);
            var url = remote_url + '/favorite?id=' + caller._id + '&product=' + brand._id;

            $.ajax({
                type: 'DELETE',
                url: url,
                data: {
                    product: product._id
                }
            }).error(function(e) {
                alert_modal.showFromXHR('Error', e);
            }).done(function() { // result
                that.css('display', 'none');
                container.find('a.favorite').css('display', '');
            });
        });

        function saveFavorite(widget, opted_in) {
            var url = remote_url + '/favorite?id=' + caller._id + '&product=' + product._id;
            var data = {
                product: product._id
            };

            $.ajax({
                type: 'PUT',
                url: url,
                data: data
            }).error(function(e) {
                alert_modal.showFromXHR('Error', e);
            }).done(function() { // result
                widget.css('display', 'none');
                container.find('a.unfavorite').css('display', '');

                if(opted_in) {
                    onOpt();
                }
            });
        }
    }

    return {
        init: init
    }
}());