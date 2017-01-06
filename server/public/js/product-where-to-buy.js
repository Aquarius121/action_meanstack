
$(function() {
    $( ".ui-tooltip" ).tooltip({});

    var callbacks = {
        onLoading: function() {
            loading_modal.show('Loading');
        },
        onLoaded: function() {
        },
        onGettingPosition: function() {
            loading_modal.show('Loading');
        },
        onGotPosition: function(position) {
            loading_modal.hide();

            if(brand && brand.locator) {
                if(brand.locator.wilke) {
                    product_locator_widget.setAvailableModes(['location', 'zip'],'wilke');
                    product_locator_widget.setMode('location');
                } else if(brand.locator.iri) {
                    product_locator_widget.setAvailableModes(['zip'],'iri');

                    var lat = position.coords.latitude;
                    var lon = position.coords.longitude;

                    $.ajax({
                        type: 'GET',
                        url: '/reference/postal-code?lat=' + lat + '&lon=' + lon
                    }).error(function() { // e
                        console.log('an error occurred while getting postal code from geodetic coordinates');
                    }).success(function(data) {
                        if(data.length == 0) {
                            product_locator_widget.setMode('zip');
                        } else {
                            product_locator_widget.searchByZip(data[0].postal_code);
                        }
                    });
                } else{
                    product_locator_widget.searchNearby(function(){});
                }
            }
        },
        onResult: function(err, result) { //
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
            product_locator_widget.getMapPosition();
        },
        onError: function() { // error_message
            loading_modal.hide();
        },
        onDirectionsRequested: function(lat, lon) {
            product_locator_widget.getDirections(lat, lon);
        }
    };

    initSurvey($('.rating-container'), '', 'where-to-buy');
    product_locator_widget.init($('#find'), '', callbacks, product, brand);
    product_summary_widget.init('', product, brand, $('.product-result'), caller);
    if(brand && brand.participating && undefined != typeof brand.locator.participating_message && brand.locator.participating_message!=""  && brand.locator.participating_message != null)
    {
        alert_modal.show("Message", brand.locator.participating_message);
    }
    //star_rating_handler.init($('.star-container'), 'where-to-buy', '');
});

function initSurvey(container, remote_url, page) {
    $.ajax({
        type: 'GET',
        url: remote_url + '/survey?type=app-sentiment' + (page ? '&page=' + page : '')
    }).success(function(data) { // , text, jqXHR

        if(typeof(data) == 'undefined' || data.length == 0) {
            return;
        }

        survey_widget.init(container, {
            surveys: data,
            remoteUrl: remote_url,
            onAnswered: function(survey) {
                //alert_modal.show('Survey Complete', survey.submission_response);
            }
        });

    }).error(function(data, text) {
        console.log('failed to get app sentiment survey details: ' + text);
    });
}