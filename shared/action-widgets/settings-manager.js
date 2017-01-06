var settings_manager = (function() {

    var default_settings = {
        has_entered_basic_info: false,
        show_instructions_once: true,
        has_allowed_directions: false,
        product_auto_messages: {},
        brand_auto_messages: {},
        recent_searches: [],
        recent_searches_limit: 10,
        recent_products: [],
        recent_products_limit: 10
    };

    function init() {
        // TODO: ensure commented out before release
        //clear();

        var settings = window.localStorage.getItem("settings");
        if(typeof(settings) == 'undefined' || settings == null) {
            settings = JSON.stringify(default_settings);
            window.localStorage.setItem('settings', settings);
        }

        return JSON.parse(settings);
    }

    function get() {
        var settings_string = window.localStorage.getItem("settings");
        if(typeof(settings_string) == 'undefined' || settings_string == null) {
            return init();
        }

        // make sure every value in default_settings appears in the result
        // this is important for when we update the app and add a value
        return $.extend({}, default_settings, JSON.parse(settings_string));
    }

    function save(settings) {
        window.localStorage.setItem('settings', JSON.stringify(settings));
    }

    function clear() {
        window.localStorage.removeItem('settings');
    }

    return {
        init: init,
        clear: clear,
        get: get,
        save: save
    }
}());