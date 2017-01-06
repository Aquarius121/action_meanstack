// link(type='text/css', href='/stylesheets/select2/select2.min.css',  rel='stylesheet')
// script(src='/js/tpl/select2.min.js', type='text/javascript')

var product_select = (function () {

    function init(selector, brand, styles, allowClear) {
        selector.html('<input class="product-select-widget" style="' + (typeof(styles) == 'undefined' ? '' : styles) + '">');

        selector.find('input').select2({
            placeholder: "Select a product",
            formatSelection: _formatSelection,
            formatResult: _formatResult,
            allowClear: typeof(allowClear) != 'undefined' ? allowClear : true,
            minimumInputLength: 1,
            ajax: {
                url: "/products" + (typeof(brand) != 'undefined' ? '?filter[brand]=' + brand : ''),
                dataType: 'json',
                data: function (term, page) {
                    return {
                        'filter[name]': term, // search term
                        'sort[name]': 0,
                        limit: 10
                    };
                },
                results: function (data, page) { // parse the results into the format expected by Select2.
                    if(data != null && data.rows.length > 0) {
                        data.rows.forEach(function(item) {
                            item.id = item._id;
                        });
                    }
                    // since we are using custom formatting functions we do not need to alter remote JSON data
                    return {results: data.rows};
                }
            },
            initSelection: function(element, callback) {
                callback({_id: $(element).val(), name: $(element).data('brand-name')});
            }
        });
    }

    function getSelection(selector) {
        var widgets = selector.find('.value-container');
        return widgets.attr('data-id');
    }

    function _formatResult(result) {
        return result.name;
    }
    function _formatSelection(result) {
        return result.name + '<div class="value-container" data-id="' + result._id + '"></div>';
    }

    return {
        init : init,
        getSelection: getSelection
    };
}());