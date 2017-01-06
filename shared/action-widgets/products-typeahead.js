var products_typeahead_widget = (function() {

    function init(remote_url, container, onSearch, onSelected, initial_value) {
        var input_box = container.find('input.code-entry');
        input_box.on('keyup', function(e) {
            if (e.which == 13) {
                e.preventDefault();
                input_box.trigger('blur');
                onSearch(getValue(container));
            }
        });

        var limit = 20;

        var products_bloodhound = new Bloodhound({
            datumTokenizer: function(d) {
                return Bloodhound.tokenizers.whitespace(d.name);
            },
            limit: limit,
            queryTokenizer: function(d) {
                var result = Bloodhound.tokenizers.whitespace(d);
                result.forEach(function(result_item, index) {
                    result[index] = encodeURIComponent(result_item);
                });
                return result;
            },
            remote: remote_url + '/products/find?limit=' + limit + '&ean_or_name=%QUERY'
        });

        products_bloodhound.initialize();

        input_box.typeahead(null, {
            name: 'products',
            displayKey: 'name',
            highlight: true,
            templates: {
                suggestion: function(object) {
                    return '<p><strong class="pull-left">' + object.name + '</strong>' +
                        (object.brand_name ? '<div class="pull-right brand-name" style="margin-right: 5px;">' + object.brand_name + '</div>' : '') +
                        '</p>' +
                        '<div class="clearfix"></div>' +
                        '<p style="text-align: right;">' +
                        (typeof(object.upc) != 'undefined' ? object.upc : object.ean) +
                        '</p>';
                }
            },
            source: products_bloodhound.ttAdapter()
        }).on('typeahead:selected', function(evt, suggestion) {
            input_box.trigger('blur');
            onSelected(suggestion);
        });

        container.find('button.search').click(function() {
            onSearch(getValue(container));
        });

        input_box.val(initial_value ? initial_value : '');
    }

    function getValue(container) {
        return container.find('input.tt-input').val();
    }

    return {
        init: init,
        getValue: getValue
    }
}());