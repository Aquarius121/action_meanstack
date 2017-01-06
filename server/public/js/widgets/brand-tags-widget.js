var brand_tags_widget = (function() {

    var brand_results, brand_tag_list;
    function init(selector) {
        var brand_tag_options = {
            readOnly: false,
            beforeAddingTag: function(tag) {
                return false;
            },
            promptText: 'No brands are defined'
        };
        var ids = selector.data('ids');
        if(typeof(ids) != 'undefined' && ids.length > 0) {
            $.ajax({
                type: 'GET',
                url: '/brand/' + ids
            }).error(function(e) {
                alert_modal.show('Error', e.responseText);
            }).success(function(result) {
                brand_results = result;
                var brand_names = [];
                result.forEach(function(brand) {
                    brand_names.push(brand.name);
                });
                brand_tag_options.tagData = brand_names;
                brand_tag_list = selector.tags(brand_tag_options);

                // TODO: set data properties in selector with results
            });
        } else {
            brand_tag_options.tagData = [];
            brand_tag_list = selector.tags(brand_tag_options);
        }
    }

    function getBrandIds(selector) {
        var brands = brand_tag_list.getTags(), brands_remaining = [];

        // TODO: replace brand_results with data attributes on the selector

        // we need to remove any brand whose name does not appear in the list
        brands.forEach(function(brand_name) {
            var from_results = brand_results.filter(function(brand_check) { return brand_check.name == brand_name; });
            if(from_results && from_results.length > 0) {
                brands_remaining.push(from_results[0]._id);
            }
        });

        return brands_remaining;
    }

    function addTag(selector, tag) {
        brand_tag_list.addTag(tag);
    }

    return {
        init: init,
        getBrandIds: getBrandIds,
        addTag: addTag
    }
}());
