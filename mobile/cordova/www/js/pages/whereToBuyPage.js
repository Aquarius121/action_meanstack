WhereToBuyPage.prototype  = new PageController();
WhereToBuyPage.prototype.constructor = WhereToBuyPage;

var where_to_buy_instance = {};

function WhereToBuyPage() {
    where_to_buy_instance = this;

    if(!this.mapScript) {
        this.mapScript = document.createElement("script");
        this.mapScript.setAttribute("type", "text/javascript");
        this.mapScript.setAttribute("src", "https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&libraries=places&callback=onLoadedGoogleMaps");
        document.getElementsByTagName("head")[0].appendChild(this.mapScript);

        this.mapScript.onload = function() {
            //that.onScriptLoaded();
        };

        this.mapScript.onreadystatechange = function() {
            if (this.readyState == 'complete') {
                //that.onScriptLoaded();
            }
        };
    }
}

WhereToBuyPage.prototype.onPageReady = function() {
    this.pageContainer = $('#where-to-buy');
};

WhereToBuyPage.prototype.onPageBeforeHide = function() {
    app_util.removeCustomStyling();

    google_map.clear();
};

WhereToBuyPage.prototype.onPageBeforeShow = function() {
    this.tryApplyStyling(this.product_info);
    window.scrollTo(80,0);
    this.initEmoticonSurvey(this.pageContainer.find('.rating-container'), app_util.getRemoteUrl(), 'where-to-buy');

    header_widget.update('Where To Buy');
};

WhereToBuyPage.prototype.onMapsLoadedOrPageShown = function() {

    // you should wait until the page is visible before you start re-rendering the map

    // we check if the app has finished initing and this page is visible
    console.log('checking to see if where to buy map can be inited');

    var activePage = app_controller.getActivePage();
    var active_page_matches = typeof(activePage) != 'undefined' &&
        activePage.length > 0 &&
        typeof(where_to_buy_instance.pageContainer) != 'undefined' &&
        where_to_buy_instance.pageContainer.length > 0 &&
        activePage == '#' + where_to_buy_instance.pageContainer[0].id;

    if(!active_page_matches) {
        console.log('product locator init defered because the where to buy page is not the active page');
        return;
    }

    if(!map_inited) {
        console.log('product locator init defered because the map has not finished initing');
        return;
    }

    var product_info_loaded = typeof(where_to_buy_instance.product_info) != 'undefined';

    if(!product_info_loaded) {
        console.log('product locator init defered because the product info has not been loaded');
        return;
    }

    /*
    if(!settings_manager.get().has_allowed_directions) {
        console.log('product locator init defered because the user has not allowed location services');
        return;
    }
    */

    var that = this;

    var callbacks = {
        onLoading: function() {
            loading_modal.show('Loading');
        },
        onLoaded: function() {
            loading_modal.hide();
        },
        onGettingPosition: function() {
            loading_modal.show('Loading');
        },
        onGotPosition: function(position) {
            loading_modal.hide();

            if(that.product_info && that.product_info.brand && that.product_info.brand.locator) {
                if(that.product_info.brand.locator.wilke) {
                    product_locator_widget.setAvailableModes(['location', 'zip'],'wilke');
                    product_locator_widget.setMode('location');
                } else if('undefined' != typeof that.product_info.brand.locator.iri) {
                    product_locator_widget.setAvailableModes(['zip'],'iri');

                    var lat = position.coords.latitude;
                    var lon = position.coords.longitude;

                    app_util.makeRequest('GET', app_util.getRemoteUrl() + '/reference/postal-code?lat=' + lat + '&lon=' + lon, {}, 'Loading',
                        function(data) {
                            if(data.length == 0) {
                                product_locator_widget.setMode('zip');
                            } else {
                                product_locator_widget.searchByZip(data[0].postal_code);
                            }
                        }, function(data) {
                            console.log(data);
                        }
                    );
                } else{
                    product_locator_widget.searchNearby(function(){});
                }
            }
            //product_locator_widget.searchNearby(callbacks.onResult);
        },
        onResult: function(err, result) {
            loading_modal.hide();

            if(result && result.nearbyStores && result.nearbyStores.length > 0) {
                console.log('geo-search complete');
                google_map.triggerResize();

                if(product_locator_widget.getMode() != 'zip') {
                    google_map.centerOnClientLocation();
                }
            }
        },
        onInited: function() {
            if(settings_manager.get().has_allowed_directions) {
                product_locator_widget.getMapPosition();
            } else {
                product_locator_widget.setMode('zip');
            }
        },
        onError: function(error) {
            alert_modal.show('Error', error);
            loading_modal.hide();
        },
        onDirectionsRequested: function(lat, lon) {
            if(platform_util.isApple()) {
                var source = google_map.getLastPosition().coords.latitude + ',' + google_map.getLastPosition().coords.longitude;
                var url = "maps://?daddr=" + lat + ',' + lon;
                window.open(url, '_system');
            } else if(platform_util.isAndroid()) {
                var url = 'geo:' + google_map.getLastPosition().coords.latitude + ',' + google_map.getLastPosition().coords.longitude +
                    '?q=' + lat + ',' + lon;
                window.open(url, '_system');
            } else {
                product_locator_widget.getDirections(lat, lon);
            }
        }
    };
    product_locator_widget.initLoaded(this.pageContainer.find('.map-container'), app_util.getRemoteUrl(), callbacks, where_to_buy_instance.product_info.product, where_to_buy_instance.product_info.brand);
};

WhereToBuyPage.prototype.onPageShow = function() {
    this.onMapsLoadedOrPageShown();
};

WhereToBuyPage.prototype.onProductConfirmed = function(results) {
    where_to_buy_instance.product_info = results;

    where_to_buy_instance.applyProductImages(results, where_to_buy_instance.pageContainer);
};

WhereToBuyPage.prototype.onReplyBegan = function(product_info, reply_id) {
    this.onProductConfirmed(product_info);
};

var map_inited = false;

function onLoadedGoogleMaps() {
    console.log('google maps loaded');
    map_inited = true;
    where_to_buy_instance.onMapsLoadedOrPageShown();
}
