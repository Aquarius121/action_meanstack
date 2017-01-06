var product_query = (function() {

    function query(product_code, redirect_to_web, source, onQueryResult) {
        if(redirect_to_web) {
            window.open(app_util.getRemoteUrl() + '/product/view/' + product_code + '?mode=confirm', '_system');

            //Android
            //navigator.app.loadUrl("http://google.com", {openExternal : true});

            // done so that if the app is brought to the foreground, we are back on the index page
            //app_controller.openInternalPage('#index');
        } else {
            var url = app_util.getRemoteUrl() + '/product/' + product_code + '?source=' + source;

            app_util.makeRequest('GET', url, {}, 'Finding', function(data) { // , text, jqXHR
                    onQueryResult(data);
                }, function(data) {
                    onQueryResult(null);
                }
            );
        }
    }

    return {
        query: query
    }
}());