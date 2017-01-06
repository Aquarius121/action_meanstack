var general_util = (function() {

    var age_groups = {
        '1': '',
        '2': '12 and under',
        '3': '13-17',
        '4': '18-20',
        '5': '21-34',
        '6': '35-54',
        '7': '55+'
    };

    function validateEmail(email) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }

    function validatePhoneNumber(phone) {
        var regExp = /^[0-9]{3}-[0-9]{3}-[0-9]{4}$/;
        return phone && !!phone.match(regExp);
    }

    function addPhoneInputHandler(input_selector) {
        input_selector.keyup(function() {
            var phone_no_separators = $(this).val().replace(/-/g, "").replace(/\//g, "");
            var massaged_value = phone_no_separators;

            if(phone_no_separators.length > 6) {
                massaged_value = phone_no_separators.substring(0, 3) + '-' +
                    phone_no_separators.substring(3, 6) + '-' +
                    phone_no_separators.substring(6, 10);
            } else if(phone_no_separators.length > 3) {
                massaged_value = phone_no_separators.substring(0, 3) + '-' +
                    phone_no_separators.substring(3, 6);

            }

            input_selector.val(massaged_value);
        });
    }

    function _bytesToSize(bytes) {
        if(bytes == 0) { return '0 bytes'; }
        var sizes = [ 'n/a', 'bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        var i = +Math.floor(Math.log(bytes) / Math.log(1024));
        return  (bytes / Math.pow(1024, i)).toFixed( i ? 1 : 0 ) + ' ' + sizes[ isNaN( bytes ) ? 0 : i+1 ];
    }

    function _getGenderTextFromNumber(number_as_string) {
        if(number_as_string == '1') {
            return 'male';
        }
        if(number_as_string == '2') {
            return 'female';
        }
        return '';
    }

    function _getAgeTextFromGroupNumber(number_as_string) {
        return age_groups[number_as_string];
    }

    function _limitChartSeries(series, max_items, valueGetter) {
        if(series.length <= max_items) {
            return series;
        }

        if(typeof(valueGetter) == 'undefined') {
            valueGetter = function(val) { return val[1]; };
        }

        // limit to top values
        series.sort(function(a, b) {
            return valueGetter(b) - valueGetter(a);
        });
        series = series.slice(0, max_items);

        return series;
    }

    // http://en.wikipedia.org/wiki/Check_digit
    function computeCheckDigit(upc) {
        var i= 0, sum = 0;
        for(;i<upc.length; i+=2) {
            sum += parseInt(upc[i]);
        }
        sum *= 3;
        for(i=1;i<upc.length; i+=2) {
            sum += parseInt(upc[i]);
        }

        return (sum % 10 == 0 ? 0 : 10 - (sum % 10));
    }

    function isValidEAN(ean) {
        if(ean.length != 8 && ean.length != 13) {
            return false;
        }

        // confirm check digit
        var first_last_removed = ean.substring(1, ean.length - 1);
        var last_digit = ean[ean.length - 1];
        return (computeCheckDigit(first_last_removed) == last_digit);
    }

    function validateURL(str) {
        /*
        var pattern = new RegExp('^((http|https)?:\\/\\/)?'+ // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
            '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
*/      var pattern = new RegExp(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig);

        return pattern.test(str);
    }

    function validateZip(us_only, canada_only, str) {
        var canada_regex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
        var us_regex = /^\d{5}(-\d{4})?$/;

        if(canada_only) {
            return canada_regex.test(str);
        } else if(us_only) {
            return us_regex.test(str);
        }

        return canada_regex.test(str) || us_regex.test(str);
    }

    function makeLinksSafe(container) {
        // make sure to swap out <a href="pageUrl"> with window.open(pageUrl, '_system');
        var links = container.find('a[data-toggle!=collapse]');
        for(var i=0; i<links.length; i++) {
            var link = $(links[i]);
            var href = link[0].href;

            if(validateURL(href)) {
                makeLinkSafe(link);
            }
        }
    }

    function makeLinkSafe(link) {
        var href = link[0].href;
        console.log('sanitizing href: ' + href);

        link.removeAttr('href');
        link.removeAttr('target');
        link.click(function() {
            window.open(href, '_system');
        });
    }

    // options:
    // keyGetter: function that gets the key value of interest
    function buildCsvFromReportRecord(data, options) {
        var days = {}, values = {};
        data.forEach(function(record) {
            // record represents one day of data
            record.values.forEach(function(value) {
                var key = options.keyGetter(value);
                if(typeof(values[key]) == 'undefined') {
                    values[key] = {
                        days: {}
                    };
                    values[key].name = value.name;
                    if(typeof(options.nameGetter) != 'undefined') {
                        values[key].name = options.nameGetter(value);
                    }
                }
                days[record.from_time] = 1;
                values[key].days[record.from_time] = value;
            });
        });

        // build meta and title
        var csv_contents = '"Date"';
        var keys = Object.keys(values);
        keys.forEach(function(brand_key) {
            csv_contents += ',"' + (values[brand_key].name ? values[brand_key].name : '?') + '"';
        });
        csv_contents += '\n';

        // fill in contents of each day
        var day_list = Object.keys(days); // TODO: sort?
        day_list.forEach(function(day_start) {
            csv_contents += moment(parseInt(day_start)).format('MM/DD/YYYY');
            keys.forEach(function(report_key, index) {
                csv_contents += ',';

                if(typeof(values[report_key].days[day_start]) != 'undefined') {
                    csv_contents += values[report_key].days[day_start].count;
                } else {
                    csv_contents += '0';
                }
            });
            csv_contents += '\n';
        });

        return csv_contents;
    }

    function buildCsvFromMultiFactorReportRecord(data, options) {

        // build lists of ranges and dates to track
        // meanwhile, tack on a little data to make it easy to process
        var days = {}, ranges = {}, brand_value = {};
        data.forEach(function(record) { // record represents one day of data
            record.values.forEach(function(value) { // by brand
                if(!options.filterFunction(value)) {
                    return;
                }

                if(Object.keys(brand_value).length == 0) {
                    brand_value = {
                        name: options.nameGetter(value),
                        days: {}
                    };
                    //brand_value[options.keyGetter(value)]
                }

                value.counts.forEach(function(count_record) {
                    ranges[options.secondaryKeyGetter(count_record)] = 1;
                });

                days[record.from_time] = 1;
                brand_value.days[record.from_time] = value.counts;
            });
        });

        // build meta and title
        var csv_contents = '"Date"';
        var factor_values = Object.keys(ranges); // TODO: sort?
        factor_values.forEach(function(factor_value) {
            if(typeof(options.secondaryValueGetter) != 'undefined') {
                csv_contents += ',"' + options.secondaryValueGetter(factor_value) + '"';
                return;
            }
            csv_contents += ',"' + factor_value + '"';
        });
        csv_contents += '\n';

        // fill in contents of each day
        var day_list = Object.keys(days); // TODO: sort?
        day_list.forEach(function(day_start) {
            csv_contents += moment(parseInt(day_start)).format('MM/DD/YYYY');

            // each age range gets a column for each day
            factor_values.forEach(function(factor_key, index) {
                csv_contents += ',';

                // if somehow, the brand record doesn't have a record for that day (is it possible?)
                if(typeof(brand_value.days[day_start]) == 'undefined') {
                    csv_contents += '0';
                    return;
                }

                // apply the correct age range total to the proper column
                var found = false;
                brand_value.days[day_start].forEach(function(day_count_record) {
                    if(options.secondaryKeyGetter(day_count_record) == factor_key) {
                        csv_contents += day_count_record.count;
                        found = true;
                    }
                });
                if(!found) {
                    csv_contents += '0';
                }
            });
            csv_contents += '\n';
        });

        return csv_contents;
    }

    function renderLabelTrimCenter(point, lineMaxChars) {
        var s = point.name;
        if(s.length > lineMaxChars) {
            var partLength = Math.floor(lineMaxChars / 2);
            return s.substring(0, partLength) + '..' + s.substring(s.length - partLength, s.length);
        }
        return s;
    }

    function processImageLink(url) {
        return url.replace(/^https:\/\/s3.amazonaws.com/i, 'http://s3.amazonaws.com');
    }

    function applyBestProductImage(product_and_brand, container) {
        var circle_image = container.find('div.circle');
        var zoomed_image = container.find('.crop');

        circle_image.css('background-image', '');
        zoomed_image.css('background-image', '');

        var img_to_use = null, color_to_use = null;

        if(typeof(product_and_brand.product) != 'undefined') {

            if(typeof(product_and_brand.product.image_style) != 'undefined' && !product_and_brand.product.image_style == 'auto') {
                if(product_and_brand.product.image_style == 'product_image') {
                    img_to_use = processImageLink(product_and_brand.product.images[0]);
                } else if(product_and_brand.product.image_style == 'brand_image') {
                    img_to_use = processImageLink(product_and_brand.brand.logo_url);
                } else {
                    color_to_use = product_and_brand.product.image_style;
                }
            } else {
                if(product_and_brand.product.images && product_and_brand.product.images.length > 0) {
                    img_to_use = processImageLink(product_and_brand.product.images[0]);
                } else if(product_and_brand.brand && product_and_brand.brand.logo_url && product_and_brand.brand.logo_url.trim().length > 0) {
                    img_to_use = processImageLink(product_and_brand.brand.logo_url);
                } else {
                    color_to_use = '#fff';
                }
            }
        }

        if(img_to_use != null) {
            circle_image.css('background-image', 'url(' + safeEncodeURI(img_to_use) + ')');

            zoomed_image.css('background-image', 'url(' + safeEncodeURI(img_to_use) + ')');
            zoomed_image.css('display', '');
            circle_image.css('display', '');
        } else if(color_to_use != null) {
            circle_image.css('background-image', 'none');
            zoomed_image.css('background-image', 'none');
            circle_image.css('display', 'none');
            zoomed_image.css('background-color', color_to_use);
        } else {

            circle_image.css('background-image', 'none');
            zoomed_image.css('background-image', 'none');
            circle_image.css('display', 'none');
            zoomed_image.css('display', 'none');
        }
    }

    function getByDotString(obj, prop) {
        var parts = prop.split('.'),
            last = parts.pop(),
            l = parts.length,
            i = 1,
            current = parts[0];

        while((obj = obj[current]) && i < l) {
            current = parts[i];
            i++;
        }

        if(obj) {
            return typeof(obj[last]) != 'undefined' ? obj[last] : null;
        }
    }

    function reportSearch(term) {
        var settings = settings_manager.get();

        // search for this search in the list to ensure uniqueness
        var matching_records = settings.recent_searches.filter(function(item) {
            return item.term == term;
        });

        var record = {
            term: term
        };

        // this search has not been a recent one
        if(matching_records.length == 0) {

            // record the search
            settings.recent_searches.push(record);

            // conform to the limit
            if(settings.recent_searches_limit > settings.recent_searches) {
                settings.recent_searches.pop();
            }

        // this search has been a recent one
        } else {
            // move the item to the front
            settings.recent_searches = settings.recent_searches.filter(function(item) {
                return item.term != term;
            });

            settings.recent_searches.push(record);
        }

        // record the search
        settings.recent_searches.push(record);
        if(settings.recent_searches_limit > settings.recent_searches) {
            settings.recent_searches.shift();
        }
        settings_manager.save(settings);
    }

    function reportProductView(product_info) {
        var settings = settings_manager.get();

        // search for this product in the list to ensure uniqueness
        var matching_records = settings.recent_products.filter(function(item) {
            return item.product.ean == product_info.product.ean;
        });

        var record = JSON.parse(JSON.stringify(product_info));

        // go through every field and enforce a 256 Byte limit
        enforceFieldLimit(record.product, 256);
        if(typeof(product_info.brand) != 'undefined') {
            enforceFieldLimit(record.brand, 256);
        }

        // this ean has not been a recent view
        if(matching_records.length == 0) {

            // record the search
            settings.recent_products.push(record);

            // conform to the limit
            if(settings.recent_products_limit > settings.recent_products) {
                settings.recent_products.shift();
            }

        // this ean has been a recent view
        } else {
            // move the item to the front
            settings.recent_products = settings.recent_products.filter(function(item) {
                return item.product.ean != product_info.product.ean;
            });

            settings.recent_products.push(record);
        }

        settings_manager.save(settings);
    }

    function enforceFieldLimit(object_to_enforce, limit_bytes) {
        var field_value;
        Object.keys(object_to_enforce).forEach(function(key) {
            field_value = object_to_enforce[key];
            if(typeof(field_value) == 'string' && field_value.length > limit_bytes) {
                delete object_to_enforce[key];
            } else if(Array.isArray(field_value)) {
                var final_array = [], field_val_item_string;
                field_value.forEach(function(field_value_item) {
                    field_val_item_string = JSON.stringify(field_value_item);
                    if(field_val_item_string.length <= limit_bytes) {
                        final_array.push(field_value_item);
                    }
                });
                object_to_enforce[key] = final_array;

            } else {
                field_value = JSON.stringify(field_value);
                if(field_value.length > limit_bytes) {
                    delete object_to_enforce[key];
                }
            }
        });
    }

    // prevents double-URI encoding
    function safeEncodeURI(uri) {
        try {
            var decodedURI = decodeURI(uri);
        } catch(ex) {

            // decode could throw exception if not encoded
            return encodeURI(uri);
        }

        // alternatively, it will do nothing if not encoded
        if(decodedURI == uri) {
            return encodeURI(uri);
        }

        return uri;
    }

    return {
        computeCheckDigit: computeCheckDigit,
        isValidEAN: isValidEAN,
        validateEmail: validateEmail,
        validateURL: validateURL,
        validateZip: validateZip,
        bytesToSize: _bytesToSize,
        getAgeTextFromGroupNumber: _getAgeTextFromGroupNumber,
        getGenderTextFromNumber: _getGenderTextFromNumber,
        limitChartSeries: _limitChartSeries,
        makeLinksSafe: makeLinksSafe,
        renderLabelTrimCenter: renderLabelTrimCenter,
        buildCsvFromReportRecord: buildCsvFromReportRecord,
        buildCsvFromMultiFactorReportRecord: buildCsvFromMultiFactorReportRecord,
        processImageLink: processImageLink,
        applyBestProductImage: applyBestProductImage,
        getByDotString: getByDotString,
        reportSearch: reportSearch,
        reportProductView: reportProductView,
        validatePhoneNumber: validatePhoneNumber,
        addPhoneInputHandler: addPhoneInputHandler,
        safeEncodeURI: safeEncodeURI
    }
}());