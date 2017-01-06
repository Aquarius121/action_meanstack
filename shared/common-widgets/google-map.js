var google_map = (function () {

    // services
    var directionsService;
    var placesService;

    // jquery containers/selectors
    var container;
    var directions_selector;

    // maps objects
    var directionsDisplay;
    var map = null;
    var infowindow;

    // internal objects
    var user_position;

    // constants
    var METERS_PER_MILE = 1609;

    //https://developers.google.com/places/documentation/supported_types
    var acceptable_place_types = {
        accounting: 'accounting',
        airport: 'airport',
        amusement_park: 'amusement_park',
        aquarium: 'aquarium',
        art_gallery: 'art_gallery',
        atm: 'atm',
        bakery: 'bakery',
        bank: 'bank',
        bar: 'bar',
        beauty_salon: 'beauty_salon',
        bicycle_store: 'bicycle_store',
        book_store: 'book_store',
        bowling_alley: 'bowling_alley',
        bus_station: 'bus_station',
        cafe: 'cafe',
        campground: 'campground',
        car_dealer: 'car_dealer',
        car_rental: 'car_rental',
        car_repair: 'car_repair',
        car_wash: 'car_wash',
        casino: 'casino',
        cemetery: 'cemetery',
        church: 'church',
        city_hall: 'city_hall',
        clothing_store: 'clothing_store',
        convenience_store: 'convenience_store',
        courthouse: 'courthouse',
        dentist: 'dentist',
        department_store: 'department_store',
        doctor: 'doctor',
        electrician: 'electrician',
        electronics_store: 'electronics_store',
        embassy: 'embassy',
        establishment: 'establishment',
        finance: 'finance',
        fire_station: 'fire_station',
        florist: 'florist',
        food: 'food',
        funeral_home: 'funeral_home',
        furniture_store: 'furniture_store',
        gas_station: 'gas_station',
        general_contractor: 'general_contractor',
        grocery_or_supermarket: 'grocery_or_supermarket',
        gym: 'gym',
        hair_care: 'hair_care',
        hardware_store: 'hardware_store',
        health: 'health',
        hindu_temple: 'hindu_temple',
        home_goods_store: 'home_goods_store',
        hospital: 'hospital',
        insurance_agency: 'insurance_agency',
        jewelry_store: 'jewelry_store',
        laundry: 'laundry',
        lawyer: 'lawyer',
        library: 'library',
        liquor_store: 'liquor_store',
        local_government_office: 'local_government_office',
        locksmith: 'locksmith',
        lodging: 'lodging',
        meal_delivery: 'meal_delivery',
        meal_takeaway: 'meal_takeaway',
        mosque: 'mosque',
        movie_rental: 'movie_rental',
        movie_theater: 'movie_theater',
        moving_company: 'moving_company',
        museum: 'museum',
        night_club: 'night_club',
        painter: 'painter',
        park: 'park',
        parking: 'parking',
        pet_store: 'pet_store',
        pharmacy: 'pharmacy',
        physiotherapist: 'physiotherapist',
        place_of_worship: 'place_of_worship',
        plumber: 'plumber',
        police: 'police',
        post_office: 'post_office',
        real_estate_agency: 'real_estate_agency',
        restaurant: 'restaurant',
        roofing_contractor: 'roofing_contractor',
        rv_park: 'rv_park',
        school: 'school',
        shoe_store: 'shoe_store',
        shopping_mall: 'shopping_mall',
        spa: 'spa',
        stadium: 'stadium',
        storage: 'storage',
        store: 'store',
        subway_station: 'subway_station',
        synagogue: 'synagogue',
        taxi_stand: 'taxi_stand',
        train_station: 'train_station',
        travel_agency: 'travel_agency',
        university: 'university',
        veterinary_care: 'veterinary_care',
        zoo: 'zoo'
    };

    var interface_object = {

        init: function(container, onLoaded) {
            google.maps.event.addDomListener(window, 'load', function() {
                google_map.initLoaded(container);
                onLoaded();
            });
        },

        initLoaded: function(outer_container) {
            container = outer_container;
            directionsDisplay = new google.maps.DirectionsRenderer();
            directionsService = new google.maps.DirectionsService();
            infowindow = new google.maps.InfoWindow();
        },

        getClientPosition: function(onPosition, onError) {
            _getPosition(onPosition, onError);
        },

        showMap: function() {
            _showMap();
        },

        // sort of a misleading name. "makeDirty" would be better
        clear: function() {
            map = null;
        },

        searchNearby: function(radius_miles, search_terms, onResults) {
            _searchNearby(radius_miles, search_terms, onResults);
        },

        getDirections: function(destination, onDirections) {
            _getDirections(user_position.coords.latitude + ',' + user_position.coords.longitude, destination, onDirections);
        },

        createMarker: function(name, location, image, onclicked) {
            return _createMarker(name, location, image, onclicked);
        },

        removeMarker: function(marker) {
            _removeMarker(marker);
        },

        getLastPosition: function() {
            return user_position;
        },

        setUserPosition: function(position) {
            user_position = position;
        },

        center: function(lat_lon) {
            _center(lat_lon);
        },

        centerOnClientLocation: function() {
            _center(user_position.lat_lon);
        },

        setDirectionsPanel: function(directionsPanelSelector) {
            // must come after init();

            directions_selector = directionsPanelSelector;
            var directionsPanel = $(directionsPanelSelector);
            directionsDisplay.setPanel(directionsPanel[0]);
        },

        hideDirections: function() {
            directionsDisplay.set('directions', null);
        },

        closeInfoWindow: function() {
            infowindow.close();
        },

        triggerResize: function() {
            google.maps.event.trigger(map, "resize");
        },

        acceptable_place_types: acceptable_place_types
    };

    function _getPosition(onPosition, onError) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                _onGPSSuccess(position, true);

                if(typeof(onPosition) != 'undefined') {
                    onPosition(position);
                }

            },function(err_first_try) {

                navigator.geolocation.getCurrentPosition(function(position) {
                    _onGPSSuccess(position, false);

                    if(typeof(onPosition) != 'undefined') {
                        onPosition(position);
                    }

                },function(err_second_try) {
                    _onGPSError(err_second_try, onError);
                }, { maximumAge:60000, timeout:20000, enableHighAccuracy: false });

            }, { maximumAge:60000, timeout:20000, enableHighAccuracy:true });
        } else {
            container.html('');
            console.log('could not use geolocation API');
            // x.innerHTML="Geolocation is not supported by this browser.";
        }
    }

    function _onGPSSuccess(position, is_high_accuracy) {
        user_position = position;
        user_position.lat_lon = new google.maps.LatLng(user_position.coords.latitude, user_position.coords.longitude);
        user_position.is_high_accuracy = is_high_accuracy;
    }

    function _onGPSError(err, onError) {
        var message = '', error_text = 'Please ensure you have turned on the GPS or Location feature on your phone';

        if(err.code == 1) { // PositionError.PERMISSION_DENIED
            message = '<strong>Please turn on your GPS or Location feature on your phone</strong>';
        } else {
            message = '<strong>Could not get a location</strong>';
            message += '<div>Reason: ' + err.message + '</div>';
        }

        if(typeof(platform_util) != 'undefined') {
            message += '<div>For help with enabling geolocation, see ' +
            (platform_util.isApple() ? '<a href="http://support.apple.com/kb/HT5594" target="_blank">Apple Support</a>' : 'Android Support');
        }

        console.log('could not use get location via geolocations API (code = ' + err.code + ')');
        if(typeof(onError) != 'undefined') {
            onError(error_text);
        }
        container.html(message);
    }

    function _showMap() {
        if(map) {
            return;
        }

        var mapOptions = {};

        if(user_position) {
            mapOptions = {
                center: user_position.lat_lon,
                zoom: 10
            };
        }
        map = new google.maps.Map(container[0], mapOptions);
        directionsDisplay.setMap(map);

        placesService = new google.maps.places.PlacesService(map);
    }

    //https://developers.google.com/maps/documentation/javascript/examples/place-search
    function _searchNearby(radius_miles, terms, onPlaces) {
        var request = {
            location: user_position.lat_lon,
            radius: radius_miles * METERS_PER_MILE,
            types: terms
        };

        placesService.nearbySearch(request, function(results, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                results.forEach(function(result) {

                    // https://developers.google.com/maps/documentation/javascript/geometry
                    result.distance = google.maps.geometry.spherical.computeDistanceBetween(
                        result.geometry.location,
                        new google.maps.LatLng(user_position.coords.latitude, user_position.coords.longitude));

                    // convert to miles
                    result.distance = (!isNaN(result.distance) ? result.distance /= METERS_PER_MILE : NaN);
                });

                if(typeof(onPlaces) == 'function') {
                    onPlaces(results);
                }
            } else {
                if(typeof(onPlaces) == 'function') {
                    onPlaces([]);
                }
            }
            // TODO: SHOW ERRORS
        });
    }

    function _createMarker(name, location, image_path, onclicked) {
        var marker_options = {
            map: map,
            position: location
        };

        if(typeof(image_path) != 'undefined') {
            marker_options.icon = image_path;
        }

        var marker = new google.maps.Marker(marker_options);

        google.maps.event.addListener(marker, 'click', function() {
            infowindow.setContent(name + '<br><a class="get-directions" data-lat="' + location.lat() + '" data-lon="' + location.lng() + '">Directions</a>');
            infowindow.open(map, this);

            if(typeof(onclicked) == 'function') {
                onclicked(this);
            }
        });
        return marker;
    }

    function _removeMarker(marker) {
        marker.setMap(null);
    }

    function _center(location) {
        map.setCenter(location);
    }



    //https://developers.google.com/maps/documentation/javascript/examples/directions-simple
    //https://developers.google.com/maps/documentation/javascript/directions
    function _getDirections(source, destination, onDirections) {
        var request = {
            origin: source,
            destination: destination,
            travelMode: google.maps.TravelMode.DRIVING
        };

        directionsService.route(request, function(response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(response);

                if(typeof(onDirections) == 'function') {
                    onDirections(response);
                }
                //console.log(response);
            }
        });
    }

    return interface_object;

}(google_map));


/*
 Status codes (google.maps.places.PlacesServiceStatus)
 =============
 OK                 indicates that no errors occurred; the place was successfully detected and at least one result was returned.
 UNKNOWN_ERROR      indicates a server-side error; trying again may be successful.
 ZERO_RESULTS       indicates that the reference was valid but no longer refers to a valid result. This may occur if the establishment is no longer in business.
 OVER_QUERY_LIMIT   indicates that you are over your quota.
 REQUEST_DENIED     indicates that your request was denied, generally because of lack of a sensor parameter.
 INVALID_REQUEST    generally indicates that the query (reference) is missing.
 NOT_FOUND          indicates that the referenced location was not found in the Places database.
 */