// A google maps wrapper that includes search, directions, etc
//
// http://maps.googleapis.com/maps/api/js?libraries=places&sensor=true&v=3.14
// common-widgets/google-map.js

var product_locator_widget = (function() {

    var widget_template_spec =
        '<div class="messages"></div>' +
        '<div class="options-container">' +
            '<div class="parameters-container">' +
                '<span class="pull-left">' +
                    '<div class="dropdown radius-option">' +
                      '<a class="dropdown-toggle" type="button" data-toggle="dropdown" aria-expanded="true">' +
                        '<span class="text">5 miles</span>' +
                        '<span class="">&nbsp;<i class="glyphicon glyphicon-chevron-down"></i></span>' +
                      '</a>' +
                      '<ul class="dropdown-menu" role="menu">' +
                        '<li role="presentation"><a role="menuitem" tabindex="-1" data-value="5">5 miles</a></li>' +
                        '<li role="presentation"><a role="menuitem" tabindex="-1" data-value="10">10 miles</a></li>' +
                        '<li role="presentation"><a role="menuitem" tabindex="-1" data-value="20">20 miles</a></li>' +
                      '</ul>' +
                    '</div>' +
                '</span>' +
                '<span class="pull-right">' +
                    '<div class="dropdown location-option">' +
                      '<a class="dropdown-toggle" type="button" data-toggle="dropdown" aria-expanded="true">' +
                        '<span class="text">Select Search Type</span>' +
                        '<span class="">&nbsp;<i class="glyphicon glyphicon-chevron-down"></i></span>' +
                      '</a>' +
                      '<ul class="dropdown-menu" role="menu">' +
                        '<li role="presentation" class="location"><a role="menuitem" tabindex="-1" class="current-location">Current Location</a></li>' +
                        '<li role="presentation" class="zip"><a role="menuitem" tabindex="-1" class="zip">ZIP code</a></li>' +
                      '</ul>' +
                    '</div>' +
                '</span>' +
            '</div>' +
            '<div class="clearfix"></div>' +
        '</div>' +
        '<div class="store-listing hidden col-xs-12 col-sm-4" style="overflow-y: auto; max-height: 600px; padding-left: 0; padding-right: 12px;"></div>' +
        '<div class="directions-panel-parent col-xs-12 col-sm-8 pull-right">' +
            '<div class="directions-panel"></div>' +
        '</div>' +
        '<div class="maps-panel-parent col-xs-12 col-sm-8 pull-right hidden" style="height: 600px; padding: 0;">' +
            '<div class="google-map" style="width: 100%; height: 100%">' +
                '<div class="google-maps-container" style="height: 100%;"></div>' +
            '</div>' +
        '</div>' +
        '<div class="clearfix"></div>';

    var wilke_stores_template_spec =
        '{{~it.stores :store:index}}' +
            '<div class="storeDiv">' +
                '<div class="address-parent">' +
                    '<a class="sName" data-index="{{=index}}">{{=store.name}}</a>' +
                    '<div class="separator"></div>' +
                    '<span class="sAddress1">{{=store.address}}</span>' +
                    '<div class="separator"></div>' +
                    '<span class="sAddress2">{{=store.city}}</span>' +
                    '<div class="separator"></div>' +
                    '<span class="sPhone">{{=store.phone}}</span>' +
                    '<div class="separator"></div>' +
                    '<div class="sDist">{{=store.distance}} miles</div>' +
                '</div>' +
                '<div class="directions-parent"><a class="directions" data-latitude="{{=store.latitude}}" data-longitude="{{=store.longitude}}"><i class="glyphicon glyphicon-map-marker"></i></a></div>' +
                '<div class="clearfix"></div>' +
            '</div>' +
        '{{~}}';

    var google_places_template_spec =
        '{{~it.stores :store:index}}' +
            '<div class="storeDiv">' +
                '<div class="address-parent">' +
                    '<a class="sName" data-index="{{=index}}">{{=store.name}}</a>' +
                    '<br>' +
                    '<span class="sAddress1">{{=store.vicinity}}</span>' +
                    '<br><div class="sDist">{{=store.distance.toFixed(1)}} miles</div>' +
                '</div>' +
                '<div class="directions-parent"><a class="directions" data-latitude="{{=store.geometry.location.lat()}}" data-longitude="{{=store.geometry.location.lng()}}"><i class="glyphicon glyphicon-map-marker"></i></a></div>' +
                '<div class="clearfix"></div>' +
            '</div>' +
        '</div>' +
        '{{~}}';

    var map_shown = false;
    var map_inited = false;
    var place_markers = [];
    var outer_container;
    var store_listing_container;
    var maps_parent_container;
    var directions_panel_parent;
    var my_remote_url;
    var my_callbacks;
    var brand;
    var product;
    var zip;
    var radius = 5;
    var mode;

    // to be called when google maps has not yet been loaded
    function init(container, remote_url, callbacks, selected_product, selected_brand) {
        _injectHtml(container);
        google_map.init(container.find('.google-maps-container'), function() {
            map_inited = true;
            _onInited(container, remote_url, callbacks, selected_product, selected_brand);
        });
    }

    // to be called when google maps has already been loaded.  we can dive right into rendering.
    function initLoaded(container, remote_url, callbacks, selected_product, selected_brand) {
        _injectHtml(container);
        google_map.initLoaded(container.find('.google-maps-container'));
        map_inited = true;
        _onInited(container, remote_url, callbacks, selected_product, selected_brand);
    }

    function setMapCenter(lat, lon) {
        google_map.center(new google.maps.LatLng(lat, lon));
    }

    function getMapPosition(onComplete) {

        // if the map isn't inited, try again in 2 seconds
        if(!map_inited) {
            setTimeout(getMapPosition, 2000);
            return;
        }

        my_callbacks.onGettingPosition();
        google_map.getClientPosition(function(position) {
            showMap();
            map_shown = true;

            google_map.createMarker('Current Location', position.lat_lon, 'http://maps.google.com/mapfiles/kml/pal4/icon47.png');
            my_callbacks.onGotPosition(position);
        }, function(error_message) {
            my_callbacks.onError(error_message);
        });
    }

    // shows only the modes allowable
    function setAvailableModes(types) {
        if(types.indexOf('zip') != -1) {
            outer_container.find('.location-option').find('li.zip').removeClass('hidden');
        } else {
            outer_container.find('.location-option').find('li.zip').addClass('hidden');
        }

        if(types.indexOf('location') != -1) {
            outer_container.find('.location-option').find('li.location').removeClass('hidden');
        } else {
            outer_container.find('.location-option').find('li.location').addClass('hidden');
        }
    }

    // effectively, all of the behavior of selecting "zip" from the dropdown
    function setMode(type) {
        mode = type;

        if(type == 'zip') {
            single_input_modal.show('Enter ZIP', 'Specify the zip code to search', 'number', function() {
                searchByZip(single_input_modal.getValue($('body')));
            });
        } else {
            _locateAndSearchNearby(my_callbacks);
        }
    }

    function getMode() {
        return mode;
    }

    function showMap() {
        maps_parent_container.removeClass('hidden');
        google_map.showMap();
    }

    function searchNearby(callback2) {
        _removePlaceMarkers();
        _setDirectionsVisible(true);
        _setStoreListingsVisible(false);

        if(!map_inited) {
            setTimeout(getMapPosition, 2000);
            return;
        }

        _showMessage('');
        store_listing_container.html('');

        if(typeof(product) == 'undefined') {
            callback2('product not loaded for where to buy page');
            return;
        }

        if(typeof(brand) != 'undefined' && typeof(brand.locator) != 'undefined') {
            var position = google_map.getLastPosition();

            var url = my_remote_url + '/product/' + product.ean + '/where-to-buy?' +
                'lat=' + position.coords.latitude +
                '&lon=' + position.coords.longitude +
                '&radius=' + radius;

            console.log('product-locator-widget: searching for nearby locations using third-party locator');

            $.ajax({
                type: 'GET',
                url: url
            }).error(function() { // jqXHR
                _searchNearbyGoogle(callback2);
            }).success(function(result) {
                if(typeof(result['nearbyStores']) == 'undefined' || result['nearbyStores'].length == 0) {
                    _showMessage('No stores were found near you that carry this product');
                    callback2(null, []);
                    return;
                }


                var message = 'This product has been known to have recently been purchased from these locations';

                if(result['nearbyStores'].length > 9) {
                    message += ' (closest ten results shown)';
                }
                /*
                if(!position.is_high_accuracy){
                    message += ' (NOTE: we could not get a strong GPS signal, so a lower-accuracy location has been used)';
                }
                */
                _showMessage(message);
                result['nearbyStores'].forEach(function(store) {
                    _addMarker({
                        name: store.name,
                        geometry: {
                            location: new google.maps.LatLng(store.latitude, store.longitude)
                        }
                    });
                });

                _buildWilkeStoreInfo(result.nearbyStores);
                callback2(null, result);
            });
        } else {
            _searchNearbyGoogle(callback2);
        }
    }

    function searchByZip(zip_code) {
        zip = zip_code;

        _removePlaceMarkers();
        _setDirectionsVisible(false);

        _showMessage('');
        store_listing_container.html('');

        my_callbacks.onLoading();

        _centerOnZip(zip);

        // TODO: is this the best place for this?
        outer_container.find('.location-option').find('.text').html(zip_code);

        var url = my_remote_url + '/product/' + product.ean + '/where-to-buy?' +
            'zip=' + zip_code +
            '&radius=' + radius;

        $.ajax({
            type: 'GET',
            url: url
        }).error(function(xhr) { // jqXHR
            my_callbacks.onError(xhr.responseText);
            //alert_modal.showFromXHR('Error', xhr);
        }).success(function(result) {
            if(typeof(result['nearbyStores']) == 'undefined' || result['nearbyStores'].length == 0) {
                store_listing_container.html('No stores were found near you that carry this product');
                _showMessage('No stores were found near you that carry this product');
                my_callbacks.onResult(null, result);
                return;
            }

            var message = 'This product has been known to have recently been purchased from these locations';
            if(result['nearbyStores'].length > 9) {
                message += ' (closest ten results shown)';
            }
            _showMessage(message);

            var lat_total = 0.0, lon_total = 0.0, lat, lon;

            result['nearbyStores'].forEach(function(store) {
                lat_total += store.latitude;
                lon_total += store.longitude;
            });

            lat = lat_total / result['nearbyStores'].length;
            lon = lon_total / result['nearbyStores'].length;

            var position = {
                lat_lon: new google.maps.LatLng(lat, lon),
                coords: {
                    latitude: lat,
                    longitude: lon
                }
            };

            // if there is no map position, use the center of results
            if(!google_map.getLastPosition()) {
                console.log('product-locator-widget: since no position has been established, setting it to center of mass of results');
                google_map.setUserPosition(position);
            }

            // show the map only if it hasn't already been shown
            showMap();

            // put a marker on the last known map position
            google_map.createMarker('Current Location', google_map.getLastPosition().lat_lon, 'http://maps.google.com/mapfiles/kml/pal4/icon47.png');

            map_shown = true;

            result['nearbyStores'].forEach(function(store) {
                _addMarker({
                    name: store.name,
                    geometry: {
                        location: new google.maps.LatLng(store.latitude, store.longitude)
                    }
                });
            });

            _buildWilkeStoreInfo(result.nearbyStores);
            my_callbacks.onResult(null, result);
        });
    }

    function isMapInited() {
        return map_inited;
    }

    function getDirections(latitude, longitude) {
        console.log('product-locator-widget: getting directions to ' + latitude + ',' + longitude);
        google_map.closeInfoWindow();

        google_map.getDirections('(' + latitude + ',' + longitude + ')', function() {
            _setDirectionsVisible(true);

            google_map.triggerResize();
            google_map.centerOnClientLocation();
        });
    }

    function _injectHtml(container) {
        outer_container = container;
        outer_container.html(doT.template(widget_template_spec)());
        store_listing_container = outer_container.find('.store-listing');
        maps_parent_container = outer_container.find('.maps-panel-parent');
        directions_panel_parent = $('.directions-panel-parent');

        // bootstrap dropdowns on mobile (especially Android) need a little help
        if(typeof(platform_util) != 'undefined' && platform_util.isMobile() && typeof(app_util) != 'undefined') { //  && platform_util.isAndroid()
            app_util.applyBootstrapDropdownFix();
        }
    }

    function _onInited(container, remote_url, callbacks, selected_product, selected_brand) {
        my_remote_url = remote_url;
        my_callbacks = callbacks;

        product = selected_product;
        brand = selected_brand;

        container.find('.location-option').find('ul.dropdown-menu').find('.current-location').click(function() {
            setMode('location');
        });

        container.find('.location-option').find('ul.dropdown-menu').find('.zip').click(function() {
            setMode('zip');
        });

        container.find('.radius-option').find('ul.dropdown-menu').find('a').click(function() {
            radius = parseInt($(this).data('value'));
            container.find('.radius-option').find('.text').html(radius + ' miles');

            if(mode == 'location') {
                _locateAndSearchNearby(callbacks);
            } else {
                searchByZip(zip);
            }
        });

        directions_panel_parent.addClass('hidden');
        google_map.setDirectionsPanel('.directions-panel');

        callbacks.onInited();
    }

    function _removePlaceMarkers() {
        place_markers.forEach(function(marker) {
            google_map.removeMarker(marker);
        });
        place_markers = [];
    }

    function _buildWilkeStoreInfo(stores) {
        var pagefn = doT.template(wilke_stores_template_spec);
        var html_contents = pagefn({
            stores: stores
        });

        store_listing_container.html(html_contents);

        store_listing_container.find('a.directions').click(function() {
            my_callbacks.onDirectionsRequested($(this).data('latitude'), $(this).data('longitude'));
        });

        store_listing_container.find('a.sName').click(function() {
            var marker = place_markers[$(this).data('index')];
            google.maps.event.trigger(marker, 'click');
        });

        _setStoreListingsVisible(true);
    }

    function _showMessage(message) {
        var message_container = outer_container.find('.messages');
        if(message.length > 0) {
            message_container.css('margin-bottom', (message.length > 0 ? '10px' : '0'));
        }
        message_container.html(message);
    }

    function _searchNearbyGoogle(callback2) {
        console.log('product-locator-widget: searching for nearby locations using google places API');
        google_map.searchNearby(3, product.map_search_types, function(places) {
            _onPlacesResults(places);

            callback2(null, places);
        });
    }

    function _onPlacesResults(places) {
        places.forEach(function(place) {
            _addMarker(place);
        });

        var pagefn = doT.template(google_places_template_spec);
        var html_contents = pagefn({
            stores: places
        });

        store_listing_container.html(html_contents);

        store_listing_container.find('a.directions').click(function() {
            my_callbacks.onDirectionsRequested($(this).data('latitude'), $(this).data('longitude'));
        });

        store_listing_container.find('a.sName').click(function() {
            var marker = place_markers[$(this).data('index')];
            google.maps.event.trigger(marker, 'click');
        });

        _setStoreListingsVisible(true);

        //name: result.name,
        //address: result.vicinity,
        //distance: distance,
        //position: result.geometry.location
    }

    function _addMarker(place) {
        var new_marker = google_map.createMarker(place.name, place.geometry.location, undefined, _onMarkerClicked);
        place_markers.push(new_marker);
        return new_marker;
    }

    // the marker has been clicked, and a popup is visible
    function _onMarkerClicked() { // evt_owner
        var directions_link = $('a.get-directions');
        directions_link.unbind('click');
        directions_link.click(function(evt) {
            var latitude = parseFloat(evt.target.dataset.lat);
            var longitude = parseFloat(evt.target.dataset.lon);

            my_callbacks.onDirectionsRequested(latitude, longitude);
        });
    }

    function _locateAndSearchNearby(callbacks) {
        outer_container.find('.location-option').find('.text').html('Current Location');

        if(!google_map.getLastPosition()) {
            my_callbacks.onGettingPosition();
            getMapPosition(function() {
                my_callbacks.onGotPosition();
                searchNearby(callbacks.onResult);
            });
            return;
        }
        searchNearby(callbacks.onResult);
    }

    function _setStoreListingsVisible(visible) {
        if(visible) {
            store_listing_container.removeClass('hidden');
        } else {
            store_listing_container.addClass('hidden');
        }
        _refreshUI();
    }

    function _setDirectionsVisible(visible) {
        if(visible) {
            directions_panel_parent.removeClass('hidden');
        } else {
            directions_panel_parent.addClass('hidden');
            google_map.hideDirections();
        }

        _refreshUI();
    }

    function _refreshUI() {
        // if the store listing is available, make the map/directions panel smaller
        if(store_listing_container.hasClass('hidden')) {
            directions_panel_parent.removeClass('col-lg-8');
            maps_parent_container.removeClass('col-lg-8');
        } else {
            directions_panel_parent.addClass('col-lg-8');
            maps_parent_container.addClass('col-lg-8');
        }
/*
        if(directions_panel_parent.hasClass('hidden')) {
            directions_panel_parent.removeClass('col-lg-8');
            maps_parent_container.removeClass('col-lg-8');
        } else {
            directions_panel_parent.addClass('col-lg-8');
            maps_parent_container.addClass('col-lg-8');
        }
        */
    }

    function _centerOnZip(zip) {
        $.get(my_remote_url + '/reference/postal-code-coord?postal_code=' + zip, function (result) {
            if (result) {
                setMapCenter(result.location.lat, result.location.lng);
            }
            else
            {
                console.log('could not use get postal code lat lng from reference db');
            }
        });
    }

    return {
        init: init,
        initLoaded: initLoaded,
        searchNearby: searchNearby,
        searchByZip: searchByZip,
        showMap: showMap,
        setMode: setMode,
        getMode: getMode,
        setAvailableModes: setAvailableModes,
        getMapPosition: getMapPosition,
        setMapCenter: setMapCenter,
        isMapInited: isMapInited,
        getDirections: getDirections
    }
}());
