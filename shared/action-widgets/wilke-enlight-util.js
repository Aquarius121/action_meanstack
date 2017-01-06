var wilke_enlight_util = (function() {

    function init() {
    }

    function loadCategories(base_url, brand_id, wilke_config, callback2) {
        var url = base_url + '/faq/enlight/' + wilke_config.enlight_tenant + '/categories';

        url += '?'
            + 'view=' + wilke_config.view_id
            + '&doctype=' + wilke_config.doc_type_id
            + '&brand=' + brand_id;

        $.ajax({
            type: 'GET',
            url: url
        }).success(function(data) { // , text, jqXHR
            if(typeof(data.rows) == 'undefined' || data.rows.length == 0) {
                callback2('No FAQ data was found');
                return;
            }
            callback2(null, data.rows);
        }).error(function(data) {
            callback2('Failed to retrieve FAQ data');
        });
    }

    // Alternatively, getCategory("*") should return results for all categories
    function getCategory(base_url, wilke_config, category_code, callback2) {
        var url = base_url + '/faq/enlight/' + wilke_config.enlight_tenant + '/category/' + category_code;

        url += '?'
            + 'view=' + wilke_config.view_id
            + '&doctype=' + wilke_config.doc_type_id
            + '&brand_keyword=' + wilke_config.brand_keyword;

        $.ajax({
            type: 'GET',
            url: url
        }).success(function(data) { // , text, jqXHR
            if(typeof(data.errMsg) != 'undefined' && data.errMsg) {
                callback2(data.errMsg);
                return;
            }

            if(typeof(data.rows) == 'undefined' || !data.rows || data.rows.length == 0) {
                callback2('No category FAQ data was found');
                return;
            }

            callback2(null, data);
        }).error(function(data) {
            callback2('Failed to retrieve FAQ category data');
        });
    }

    return {
        init: init,
        loadCategories: loadCategories,
        getCategory: getCategory
    }
}());