var brand_select = (function () {

    function init(selector, allowClear) {
        selector.select2({
            placeholder: "Select a brand",
            formatSelection: _formatSelection,
            formatResult: _formatResult,
            allowClear: typeof(allowClear) != 'undefined' ? allowClear : true,
            minimumInputLength: 1,
            ajax: {
                url: "/brand?page=0&pageSize=15",
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

    function getSelectionText(selector) {
        var parent = selector.find('.value-container').parent();
        return parent.length > 0 ? parent[0].innerText : "";
    }

    function _formatResult(result) {
        return result.name;
    }
    function _formatSelection(result) {
        return result.name + '<div class="value-container" data-id="' + result._id + '"></div>';
    }

    return {
        init : init,
        getSelection: getSelection,
        getSelectionText: getSelectionText
    };
}());