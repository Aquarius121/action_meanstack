var auto_message_utils = function() {
        var historyUrl=null;
        var product;

        function saveHistory(url)
        {
            historyUrl = url;
        }

        function _isFromInnerPage()
        {
            if (historyUrl == null)
                return !1;
            var inner_pages = ['how-can-we-help','faq-page','where-to-buy','product-results','custom-modal'];
            for(var page in inner_pages)
            {
                if(historyUrl.search(inner_pages[page])>-1)
                    return !0;
            }

            return !1;

        }

        function _hasProductInfo(product)
        {
            var info,location,contact;
            (product.product.hasOwnProperty("ingredients") || product.product.hasOwnProperty("instructions") || product.product.hasOwnProperty("nutrition_labels") || product.product.hasOwnProperty("map_search_types")) ? info=!0 : info=!1;
            (product.brand.locator && product.brand.participating || product.brand.locator && product.brand.locator.wilke || product.brand.locator && product.brand.locator.iri || product.brand && product.brand.participating && product.brand.locator && product.brand.locator.participating_message!="") ? location=!0:location=!1;
            (product.brand && product.brand.faq || product.product && product.product.faq || (_isParticipating(product))) ?contact=!0: contact=!1;

            return info || location || contact;
        }

        function _isParticipating(product_info) {

            if(!!product_info.brand && product_info.brand.name == "Bullpen")
                return true;
            else
                return (!!product_info.brand && !!product_info.brand.crm_email_endpoint);
        }

        function tryShowAutoMessage(product_info, onShowMessage) {
            product = product_info;
            var settings = settings_manager.get();
            //settings.auto_message && "undefined" != typeof product_info && (_tryShowProductAutoMessage(product_info, onShowMessage) , _tryShowBrandAutoMessage(product_info, onShowMessage))
            if(!_isFromInnerPage())
                if(("undefined" != typeof product_info))
                    _tryShowBrandAutoMessage(product_info, onShowMessage);
        }

        function _tryShowProductAutoMessage(product_info, onShowMessage) {
            if ("undefined" != typeof product_info.product && "undefined" != typeof product_info.product.auto_message && product_info.product.auto_message && product_info.product.auto_message.trim().length > 0) {
                if ("undefined" != typeof product_info.product.auto_message_expiration) {
                    var expiration_timestamp = moment(product_info.product.auto_message_expiration).utc().valueOf();
                    if (expiration_timestamp <= moment().utc().valueOf()) return !1
                }

                // For products always show auto-message if it is not blank
                if (!is_showing_auto_message_once) return showAutoMessage(product_info.product.auto_message, onShowMessage), !0;
                if ("undefined" == typeof product_info.brand.crm_email_endpoint || product_info.brand.crm_email_endpoint.trim().length == 0) return showAutoMessage(product_info.product.auto_message, onShowMessage), !0;
                var settings = settings_manager.get();
                if ("undefined" == typeof settings.product_auto_messages[product_info.product.ean]) return settings.product_auto_messages[product_info.product.ean] = [product_info.product.auto_message], settings_manager.save(settings), showAutoMessage(product_info.product.auto_message, onShowMessage), !0;
                if (-1 == settings.product_auto_messages[product_info.product.ean].indexOf(product_info.product.auto_message)) return settings.product_auto_messages[product_info.product.ean].push(product_info.product.auto_message), settings_manager.save(settings), showAutoMessage(product_info.product.auto_message, onShowMessage), !0

            }
            return !1
        }

        function _tryShowBrandAutoMessage(product_info, onShowMessage) {
            if ("undefined" != typeof product_info.brand && "undefined" != typeof product_info.brand.auto_message && product_info.brand.auto_message && product_info.brand.auto_message.trim().length > 0) {
                if ("undefined" != typeof product_info.brand.auto_message_expiration) {
                    var expiration_timestamp = moment(product_info.brand.auto_message_expiration).utc().valueOf();
                    if (expiration_timestamp <= moment().utc().valueOf()) return _tryShowProductAutoMessage(product_info,onShowMessage);
                }
                if (!is_showing_auto_message_once) return showAutoMessage(product_info.brand.auto_message, onShowMessage,function(){
                    _tryShowProductAutoMessage(product_info, onShowMessage)
                    //alert_modal.show("message","abc");
                }),!0;//_tryShowProductAutoMessage(product_info,onShowMessage);
                if ("undefined" == typeof product_info.brand.crm_email_endpoint || product_info.brand.crm_email_endpoint.trim().length == 0) return showAutoMessage(product_info.brand.auto_message, onShowMessage,function(){_tryShowProductAutoMessage(product_info,onShowMessage)}),!0;//, _tryShowProductAutoMessage(product_info,onShowMessage);

                /*var settings = settings_manager.get();
                 if ("undefined" == typeof settings.brand_auto_messages[product_info.brand._id]) return settings.brand_auto_messages[product_info.brand._id] = [product_info.brand.auto_message], settings_manager.save(settings), showAutoMessage(product_info.brand.auto_message, onShowMessage), !0;
                 if (-1 == settings.brand_auto_messages[product_info.brand._id].indexOf(product_info.brand.auto_message)) return settings.brand_auto_messages[product_info.brand._id].push(product_info.brand.auto_message), settings_manager.save(settings), showAutoMessage(product_info.brand.auto_message, onShowMessage), !0*/
            }
            else if(!_isParticipating(product_info))
            {
                return showAutoMessage("looks like you need to contact this brand with more traditional methods as they are not yet set up with action!",onShowMessage);

            }
            return _tryShowProductAutoMessage(product_info,onShowMessage)
        }

        function showAutoMessage(message, onShowMessage,showProductMessage) {
            var settings = settings_manager.get();
            settings.auto_message = false;
            settings_manager.save(settings);
            "undefined" == typeof onShowMessage && (alert_modal.show("Message", message, function(){
                if (!_hasProductInfo(product))
                {
                    window.location="#find";
                }
                else
                {
                    if("undefined" != typeof showProductMessage) {
                        //alert_modal.get().hide();
                        setTimeout(function(){ showProductMessage(); }, 100);
                    }
                }
            }), general_util.makeLinksSafe(alert_modal.get()));
        }
        var is_showing_auto_message_once = !1;
        return {
            tryShowAutoMessage: tryShowAutoMessage,
            saveHistory: saveHistory,
        }
    }(),
    brand_products_widget = function() {
        function _init(options_in) {
            var options = $.extend({}, default_options, options_in);
            options.container.html('<div  id="res_container" class="brand-products-widget simple"><div class="results-count"></div><div class="results-container"></div><div class="text-center"><button class="btn btn-xs btn-load-more hidden">Load More</button></div></div>'), loading_modal.show(), options.container.find(".results-count").html("");
            var start_time = new Date,
                url = options.remote_url + "/products/brand-products?filter[brand]=" + options.brand_id + "&filter[feature_weight]=1&page=0&pageSize=" + options.page_size,
                platform = "undefined" != typeof platform_util ? platform_util.getPlatformString() : "web";
            url += "&platform=" + platform, $.ajax({
                type: "GET",
                url: url
            }).error(function() {
                loading_modal.hide();
                if(navigator.connection.type == "none")
                {
                    alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                    return;
                }
                window.alert("an error occurred");
            }).done(function(result) {
                loading_modal.hide();
                var since_text = (((new Date).getTime() - start_time.getTime()) / 1e3).toFixed(3),
                    result_text = result.total_records + " results found in " + since_text + " seconds";
                options.container.find(".results-count").html(result_text), product_search_results.append(options.container.find(".results-container"), result.rows, options.onSelected), _processMoreButton(options, result)
            })
        }

        function _processMoreButton(options, result_page_one) {
            var loadButton = options.container.find(".btn-load-more");
            result_page_one.rows.length > 0 && result_page_one.total_records > options.page_size ? loadButton.removeClass("hidden") : loadButton.addClass("hidden");
            var page = 0;
            loadButton.unbind("click"), loadButton.click(function() {
                page++;
                var url = options.remote_url + "/products/brand-products?filter[brand]=" + options.brand_id + "&filter[feature_weight]=1&page=" + page + "&pageSize=" + options.page_size,
                    platform = "undefined" != typeof platform_util ? platform_util.getPlatformString() : "web";
                url += "&platform=" + platform, $.ajax({
                    type: "GET",
                    url: url
                }).error(function() {
                    loading_modal.hide();
                    if(navigator.connection.type == "none")
                    {
                        alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                        return;
                    }
                    window.alert("an error occurred");
                }).done(function(result) {
                    result.total_records <= options.page_size * (page + 1) && loadButton.addClass("hidden"), product_search_results.append(options.container.find(".results-container"), result.rows, options.onSelected), loading_modal.hide()
                    if(device.version == "4.3" || device.version == "4.2.2" || device.version == "4.4.4")
                    {
                        //$("#brand").css({positin:"absolute"});

                        $("#brand").hide().show(0);
                        //$("#brand").scrollTop(0);
                        //$("#brand").first().offset({top:-1000,left:0});
                        //$("#brand").first().height(5000);
                        //$("#brand").position({top:60,left:0});
                        //$("#brand").css({"min-height":"5000px"});
                    }
                })
            })
        }
        var item_template_def = '{{~it.products :product:index}}<hr><div class="product-result" data-product="{{=product.ean}}"><a data-product="{{=product.ean}}">{{=product.name}}</a><div class="clearfix"></div><div class="pull-left ean-value">EAN: {{=product.ean}}</div>{{?product.brand_name}}<div class="pull-right">{{=product.brand_name}}</div>{{?}}<div class="clearfix"></div></div>{{~}}<div style="margin-bottom: 20px;"></div>',
            default_options = (doT.template(item_template_def), {
                container: null,
                brand_id: null,
                remote_url: null,
                page_size: 15,
                onSelected: function() {}
            });
        return {
            init: function(options) {
                _init(options)
            }
        }
    }(),
    brand_summary_widget = function() {
        function init(options_in) {
            var options = $.extend({}, default_options, options_in),
                url = options.remote_url + "/brand/" + options.brand_id;
            $.ajax({
                type: "GET",
                url: url
            }).error(function() {
                loading_modal.hide();
                if(navigator.connection.type == "none")
                {
                    alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                    return;
                }
                window.alert("an error occurred");
            }).done(function(result) {
                if (result.length > 0) {
                    var html = template({
                        brand: result[0],
                        caller: options.caller
                    });
                    options.container.html(html)
                }
            })
        }
        var template_def = '<div class="brand-summary-widget animation-flicker-fix" style="padding-bottom: 20px;"><div class="pull-left animated flipInX" style=""><div><h3>{{=it.brand.name}}</h3></div>{{?it.brand.logo_url}}<img src="{{=it.brand.logo_url}}">{{?}}{{? it.brand.facebook_link}}{{?}}</div><div class="clearfix"></div></div>',
            template = doT.template(template_def),
            default_options = {
                caller: null,
                remote_url: null,
                brand_id: null
            };
        return {
            init: init
        }
    }(),
    favorite_toggle_widget = function() {
        function init(remote_url, product, brand, container, caller, onOpt) {
            function saveFavorite(widget, opted_in) {
                var url = remote_url + "/favorite?id=" + caller._id + "&product=" + product._id,
                    data = {
                        product: product._id
                    };
                $.ajax({
                    type: "PUT",
                    url: url,
                    data: data
                }).error(function(e) {
                    if(navigator.connection.type == "none")
                    {
                        alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                        return;
                    }
                    alert_modal.showFromXHR("Error", e)
                }).done(function() {
                    widget.css("display", "none"), container.find("a.unfavorite").css("display", ""), opted_in && onOpt()
                })
            }
            container.html(template({
                product: product,
                brand: brand,
                caller: caller,
                active_class: "glyphicon-heart",
                inactive_class: "glyphicon-heart-empty"
            })), container.find("a.favorite").click(function() {
                var that = $(this),
                    saved = !1;
                return "undefined" != typeof brand.opt ? void saveFavorite(that, !1) : (confirm_modal.setButtonClasses("btn-success", "btn-success"), confirm_modal.setButtonText("No", "Yes"), void confirm_modal.show("Opt In?", "Added to favorites.  Would you like to receive special offers from this brand?", function() {
                    saved = !0, saveFavorite(that, !0)
                }, function() {
                    saved = !0, saveFavorite(that, !1)
                }, function() {
                    saved || saveFavorite(that, !1)
                }))
            }), container.find("a.unfavorite").click(function() {
                var that = $(this),
                    url = remote_url + "/favorite?id=" + caller._id + "&product=" + brand._id;
                $.ajax({
                    type: "DELETE",
                    url: url,
                    data: {
                        product: product._id
                    }
                }).error(function(e) {
                    if(navigator.connection.type == "none")
                    {
                        alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                        return;
                    }
                    alert_modal.showFromXHR("Error", e)
                }).done(function() {
                    that.css("display", "none"), container.find("a.favorite").css("display", "")
                })
            })
        }
        var template_def = '<div class="toggle-widget">{{? it.product}}{{? it.product.favorite}}<a class="unfavorite"><i class="glyphicon {{=it.active_class}} ui-tooltip" data-placement="bottom" data-original-title="Favorited"></i> favorited</a><a class="favorite" style="display: none;"><i class="glyphicon {{=it.inactive_class}} ui-tooltip" data-placement="bottom" data-original-title="Favorite"></i> favorite</a>{{??}}<a class="favorite"><i class="glyphicon {{=it.inactive_class}} ui-tooltip" data-placement="bottom" data-original-title="Favorite"></i> favorite</a><a class="unfavorite" style="display: none;"><i class="glyphicon {{=it.active_class}} ui-tooltip" data-placement="bottom" data-original-title="Favorited"></i> favorited</a>{{?}}{{?}}</div>',
            template = doT.template(template_def);
        return {
            init: init
        }
    }(),
    favorites_widget = function() {
        function init(options_in) {
            function _applyOptInWidget(brand_id) {
                var opt_container = options.container.find(".opt-container[data-brand=" + brand_id + "]"),
                    faux_caller = {
                        _id: options.user_id
                    },
                    faux_brand = {
                        _id: brand_id
                    };
                optins.brands[brand_id] && (faux_brand.opt = !0), opt_container.html(""), opt_toggle_widget.init(options.remote_url, faux_brand, opt_container, faux_caller)
            }
            var options = $.extend({}, default_options, options_in),
                optins = {
                    brands: {},
                    products: {}
                },
                favorites = {
                    brands: {},
                    products: {}
                };
            options.opt_ins.brands.forEach(function(opt_in) {
                "undefined" != typeof opt_in._id && (optins.brands[opt_in._id] = {})
            }), options.opt_ins.products.forEach(function(opt_in) {
                "undefined" != typeof opt_in._id && (optins.products[opt_in._id] = {})
            }), options.favorites.brands.forEach(function(brand_fave) {
                favorites.brands[brand_fave._id] = brand_fave
            });
            var brands_for_favorites = {};
            options.favorites.products.forEach(function(product_favorite) {
                if ("undefined" != typeof product_favorite.brand) {
                    brands_for_favorites[product_favorite.brand] = 1;
                    var brand = favorites.brands[product_favorite.brand];
                    "undefined" != typeof brand && (product_favorite.brand_logo_url = brand.logo_url)
                }
            }), console.log(JSON.stringify(options.favorites.products)), options.container.html(favorites_template(options.favorites.products)), Object.keys(brands_for_favorites).forEach(function(product_favorite_brand) {
                _applyOptInWidget(product_favorite_brand)
            }), options.container.find("a.favorite-link").click(function() {
                window.open($(this).data("link"), "_system")
            }), options.container.find("input.favorite-opt").change(function() {
                var url = options.remote_url + "/opt-in?brand=" + $(this).data("id") + "&id=" + options.user_id;
                $(this).prop("checked") ? $.ajax({
                    type: "PUT",
                    url: url
                }).error(function(e) {
                    if(navigator.connection.type == "none")
                    {
                        alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                        return;
                    }
                    alert_modal.showFromXHR("Error", e)
                }).success(function() {
                    console.log("success")
                }) : $.ajax({
                    type: "DELETE",
                    url: url
                }).error(function(e) {
                    if(navigator.connection.type == "none")
                    {
                        alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                        return;
                    }
                    alert_modal.showFromXHR("Error", e)
                }).success(function() {
                    _applyOptInWidget($(this).data("id")), console.log("success")
                })
            }), options.container.find("a.policy-link").click(function() {
                window.open($(this).data("link"), "_system")
            }), options.container.find("a.brand-link").click(function() {
                options.onBrandSelected($(this).data("id"))
            }), options.container.find("a.product-link").click(function() {
                options.onProductSelected($(this).data("id"), $(this).data("ean"))
            })
        }
        var default_options = {
                remote_url: null,
                container: null,
                favorites: [],
                opt_ins: [],
                user_id: null,
                onBrandSelected: function() {},
                onProductSelected: function() {}
            },
            favorites_template_def = '<div class="favorites-widget">{{?!it || it.length == 0}}<div class="text-center no-favorites">You have not told us about your favorite products.</div>{{??}}{{~it :value:index}}<div class="well"><div class="image-container">{{?value.images && value.images.length > 0}}<img src="{{=general_util.safeEncodeURI(value.images[0])}}">{{??value.brand_logo_url}}<img src="{{=general_util.safeEncodeURI(value.brand_logo_url)}}">{{?}}</div><div class="favorites-info">{{?value.logo_url}}<img class="pull-right" src="{{=value.logo_url}}" style="max-height: 32px; max-width: 80px;">{{?}}<div class="clearfix"></div><a class="product-link" data-id="{{=value._id}}" data-ean="{{=value.ean}}">{{=value.name}}</a><div class="clearfix"></div><div class="bottom-line"><div class="brand-link-container"><a class="brand-link" data-id="{{=value.brand}}">{{=value.brand_name}}</a></div><div class="opt-container" data-brand="{{=value.brand}}" ></div></div></div><div class="clearfix"></div></div>{{~}}{{?}}</div>',
            favorites_template = doT.template(favorites_template_def);
        return {
            init: init
        }
    }(),
    general_util = function() {
        function validateEmail(email) {
            var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email)
        }

        function validatePhoneNumber(phone) {
            var regExp = /^[0-9]{3}-[0-9]{3}-[0-9]{4}$/;
            return phone && !!phone.match(regExp)
        }


        /*
         **  Returns the caret (cursor) position of the specified text field.
         **  Return value range is 0-oField.length.
         */
        function doGetCaretPosition (oField) {

            // Initialize
            var iCaretPos = 0;

            // IE Support
            if (document.selection) {

                // Set focus on the element
                oField.focus ();

                // To get cursor position, get empty selection range
                var oSel = document.selection.createRange ();

                // Move selection start to 0 position
                oSel.moveStart ('character', -oField.value.length);

                // The caret position is selection length
                iCaretPos = oSel.text.length;
            }

            // Firefox support
            else if (oField.selectionStart || oField.selectionStart == '0')
                iCaretPos = oField.selectionStart;

            // Return results
            return (iCaretPos);
        }


        /*
         **  Sets the caret (cursor) position of the specified text field.
         **  Valid positions are 0-oField.length.
         */
        function doSetCaretPosition (oField, iCaretPos) {

            // IE Support
            if (document.selection) {

                // Set focus on the element
                oField.focus ();

                // Create empty selection range
                var oSel = document.selection.createRange ();

                // Move selection start and end to 0 position
                oSel.moveStart ('character', -oField.value.length);

                // Move selection start and end to desired position
                oSel.moveStart ('character', iCaretPos);
                oSel.moveEnd ('character', 0);
                oSel.select ();
            }

            // Firefox support
            else if (oField.selectionStart || oField.selectionStart == '0') {
                oField.selectionStart = iCaretPos;
                oField.selectionEnd = iCaretPos;
                oField.focus ();
            }
        }

        function addPhoneInputHandler(input_selector) {
            var allow = false;
            input_selector.keydown(function(event){
                allow = false;
                if(event.keyCode > 47 && event.keyCode < 58)
                    allow = true
            })
            input_selector.keyup(function(e) {
                if(!allow) return;
                var phone_no_separators = $(this).val().replace(/-/g, "").replace(/\//g, ""),
                    massaged_value = phone_no_separators,
                    caretPos = doGetCaretPosition(input_selector[0]);
                console.log(caretPos);
                console.log(input_selector.selectionStart);
                console.log(input_selector.selectionEnd);
                //if((caretPos == 4 || caretPos == 8) && e.keyCode > 95 && e.keyCode < 106)
                //    caretPos++;
                phone_no_separators.length > 6 ? massaged_value = phone_no_separators.substring(0, 3) + "-" + phone_no_separators.substring(3, 6) + "-" + phone_no_separators.substring(6, 10) : phone_no_separators.length > 3 && (massaged_value = phone_no_separators.substring(0, 3) + "-" + phone_no_separators.substring(3, 6)), input_selector.val(massaged_value);
                //doSetCaretPosition(input_selector[0],caretPos)

            })
        }

        function _bytesToSize(bytes) {
            if (0 == bytes) return "0 bytes";
            var sizes = ["n/a", "bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
                i = +Math.floor(Math.log(bytes) / Math.log(1024));
            return (bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0) + " " + sizes[isNaN(bytes) ? 0 : i + 1]
        }

        function _getGenderTextFromNumber(number_as_string) {
            return "1" == number_as_string ? "male" : "2" == number_as_string ? "female" : ""
        }

        function _getAgeTextFromGroupNumber(number_as_string) {
            return age_groups[number_as_string]
        }

        function _limitChartSeries(series, max_items, valueGetter) {
            return series.length <= max_items ? series : ("undefined" == typeof valueGetter && (valueGetter = function(val) {
                return val[1]
            }), series.sort(function(a, b) {
                return valueGetter(b) - valueGetter(a)
            }), series = series.slice(0, max_items))
        }

        function computeCheckDigit(upc) {
            for (var i = 0, sum = 0; i < upc.length; i += 2) sum += parseInt(upc[i]);
            for (sum *= 3, i = 1; i < upc.length; i += 2) sum += parseInt(upc[i]);
            return sum % 10 == 0 ? 0 : 10 - sum % 10
        }

        function isValidEAN(ean) {
            if (8 != ean.length && 13 != ean.length) return !1;
            var first_last_removed = ean.substring(1, ean.length - 1),
                last_digit = ean[ean.length - 1];
            return computeCheckDigit(first_last_removed) == last_digit
        }

        function validateURL(str) {
            var pattern = new RegExp(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi);
            return pattern.test(str)
        }

        function validateZip(us_only, canada_only, str) {
            var canada_regex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
                us_regex = /^\d{5}(-\d{4})?$/;
            return canada_only ? canada_regex.test(str) : us_only ? us_regex.test(str) : canada_regex.test(str) || us_regex.test(str)
        }

        function makeLinksSafe(container) {
            for (var links = container.find("a[data-toggle!=collapse]"), i = 0; i < links.length; i++) {
                var link = $(links[i]),
                    href = link[0].href;
                validateURL(href) && makeLinkSafe(link)
            }
        }

        function makeLinkSafe(link) {
            var href = link[0].href;
            console.log("sanitizing href: " + href), link.removeAttr("href"), link.removeAttr("target"), link.click(function() {
                window.open(href, "_system")
            })
        }

        function buildCsvFromReportRecord(data, options) {
            var days = {},
                values = {};
            data.forEach(function(record) {
                record.values.forEach(function(value) {
                    var key = options.keyGetter(value);
                    "undefined" == typeof values[key] && (values[key] = {
                        days: {}
                    }, values[key].name = value.name, "undefined" != typeof options.nameGetter && (values[key].name = options.nameGetter(value))), days[record.from_time] = 1, values[key].days[record.from_time] = value
                })
            });
            var csv_contents = '"Date"',
                keys = Object.keys(values);
            keys.forEach(function(brand_key) {
                csv_contents += ',"' + (values[brand_key].name ? values[brand_key].name : "?") + '"'
            }), csv_contents += "\n";
            var day_list = Object.keys(days);
            return day_list.forEach(function(day_start) {
                csv_contents += moment(parseInt(day_start)).format("MM/DD/YYYY"), keys.forEach(function(report_key) {
                    csv_contents += ",", csv_contents += "undefined" != typeof values[report_key].days[day_start] ? values[report_key].days[day_start].count : "0"
                }), csv_contents += "\n"
            }), csv_contents
        }

        function buildCsvFromMultiFactorReportRecord(data, options) {
            var days = {},
                ranges = {},
                brand_value = {};
            data.forEach(function(record) {
                record.values.forEach(function(value) {
                    options.filterFunction(value) && (0 == Object.keys(brand_value).length && (brand_value = {
                        name: options.nameGetter(value),
                        days: {}
                    }), value.counts.forEach(function(count_record) {
                        ranges[options.secondaryKeyGetter(count_record)] = 1
                    }), days[record.from_time] = 1, brand_value.days[record.from_time] = value.counts)
                })
            });
            var csv_contents = '"Date"',
                factor_values = Object.keys(ranges);
            factor_values.forEach(function(factor_value) {
                return "undefined" != typeof options.secondaryValueGetter ? void(csv_contents += ',"' + options.secondaryValueGetter(factor_value) + '"') : void(csv_contents += ',"' + factor_value + '"')
            }), csv_contents += "\n";
            var day_list = Object.keys(days);
            return day_list.forEach(function(day_start) {
                csv_contents += moment(parseInt(day_start)).format("MM/DD/YYYY"), factor_values.forEach(function(factor_key) {
                    if (csv_contents += ",", "undefined" == typeof brand_value.days[day_start]) return void(csv_contents += "0");
                    var found = !1;
                    brand_value.days[day_start].forEach(function(day_count_record) {
                        options.secondaryKeyGetter(day_count_record) == factor_key && (csv_contents += day_count_record.count, found = !0)
                    }), found || (csv_contents += "0")
                }), csv_contents += "\n"
            }), csv_contents
        }

        function renderLabelTrimCenter(point, lineMaxChars) {
            var s = point.name;
            if (s.length > lineMaxChars) {
                var partLength = Math.floor(lineMaxChars / 2);
                return s.substring(0, partLength) + ".." + s.substring(s.length - partLength, s.length)
            }
            return s
        }

        function processImageLink(url) {
            url = url.replace(/\\/gi,'\\\\');
            return url.replace(/^https:\/\/s3.amazonaws.com/i, "http://s3.amazonaws.com")
        }

        function applyBestProductImage(product_and_brand, container) {
            var circle_image = container.find("div.circle"),
                zoomed_image = container.find(".crop");
            circle_image.css("background-image", ""), zoomed_image.css("background-image", "");
            var img_to_use = null,
                color_to_use = null,
                bg_to_use = null;
            /*
            "undefined" != typeof product_and_brand.product && ("undefined" != typeof product_and_brand.product.image_style && "auto" == !product_and_brand.product.image_style ? "product_image" == product_and_brand.product.image_style ? img_to_use = processImageLink(product_and_brand.product.images[0]) : "brand_image" == product_and_brand.product.image_style ? img_to_use = processImageLink(product_and_brand.brand.logo_url) : color_to_use = product_and_brand.product.image_style : product_and_brand.product.images && product_and_brand.product.images.length > 0 ? img_to_use = processImageLink(product_and_brand.product.images[0]) : product_and_brand.brand && product_and_brand.brand.logo_url && product_and_brand.brand.logo_url.trim().length > 0 ? img_to_use = processImageLink(product_and_brand.brand.logo_url) : color_to_use = "#fff"), null != img_to_use ? (circle_image.css("background-image", "url(\"" + safeEncodeURI(img_to_use) + "\")"), zoomed_image.css("background-image", "url(\"" + safeEncodeURI(img_to_use) + "\")"), zoomed_image.css("display", ""), circle_image.css("display", "")) : null != color_to_use ? (circle_image.css("background-image", "none"), zoomed_image.css("background-image", "none"), circle_image.css("display", "none"), zoomed_image.css("background-color", color_to_use)) : (circle_image.css("background-image", "none"), zoomed_image.css("background-image", "none"), circle_image.css("display", "none"), zoomed_image.css("display", "none"))*/
            "undefined" != typeof product_and_brand.product && ("undefined" != typeof product_and_brand.product.image_style && "auto" != product_and_brand.product.image_style ? "undefined" != typeof product_and_brand.product.images && product_and_brand.product.images.length > 0 && "product_image" == product_and_brand.product.image_style ? bg_to_use = processImageLink(product_and_brand.product.images[0]) : "brand_image" == product_and_brand.product.image_style ? bg_to_use = processImageLink(product_and_brand.brand.logo_url) : color_to_use = product_and_brand.product.image_style : product_and_brand.product.images && product_and_brand.product.images.length > 0 ? bg_to_use = processImageLink(product_and_brand.product.images[0]) : product_and_brand.brand && product_and_brand.brand.logo_url && product_and_brand.brand.logo_url.trim().length > 0 ? bg_to_use = processImageLink(product_and_brand.brand.logo_url) : color_to_use = "#fff"), product_and_brand.product.images && product_and_brand.product.images.length > 0 ? img_to_use = processImageLink(product_and_brand.product.images[0]) : product_and_brand.brand && product_and_brand.brand.logo_url && product_and_brand.brand.logo_url.trim().length > 0 ? img_to_use = processImageLink(product_and_brand.brand.logo_url):img_to_use = null ,null != img_to_use ? (circle_image.css("background-image", "url(\"" + img_to_use + "\")"),circle_image.css("display", "")) :(circle_image.css("background-image", "none"),circle_image.css("display", "none")) , null != bg_to_use ? (zoomed_image.css("background-image", "url(\"" + bg_to_use + "\")"), zoomed_image.css("display", "")) : null != color_to_use ? (zoomed_image.css("background-image", "none"),zoomed_image.css("background-color", color_to_use)) : (zoomed_image.css("background-image", "none"),zoomed_image.css("display", "none"))


        }

        function getByDotString(obj, prop) {
            for (var parts = prop.split("."), last = parts.pop(), l = parts.length, i = 1, current = parts[0];
                 (obj = obj[current]) && l > i;) current = parts[i], i++;
            return obj ? "undefined" != typeof obj[last] ? obj[last] : null : void 0
        }

        function reportSearch(term) {
            var settings = settings_manager.get(),
                matching_records = settings.recent_searches.filter(function(item) {
                    return item.term == term
                }),
                record = {
                    term: term
                };
            0 == matching_records.length ? (settings.recent_searches.push(record), settings.recent_searches_limit > settings.recent_searches && settings.recent_searches.pop()) : (settings.recent_searches = settings.recent_searches.filter(function(item) {
                return item.term != term
            }), settings.recent_searches.push(record)), settings.recent_searches.push(record), settings.recent_searches_limit > settings.recent_searches && settings.recent_searches.shift(), settings_manager.save(settings)
        }

        function reportProductView(product_info) {
            var settings = settings_manager.get(),
                matching_records = settings.recent_products.filter(function(item) {
                    return item.product.ean == product_info.product.ean
                }),
                record = JSON.parse(JSON.stringify(product_info));
            enforceFieldLimit(record.product, 256), "undefined" != typeof product_info.brand && enforceFieldLimit(record.brand, 256), 0 == matching_records.length ? (settings.recent_products.push(record), settings.recent_products_limit > settings.recent_products && settings.recent_products.shift()) : (settings.recent_products = settings.recent_products.filter(function(item) {
                return item.product.ean != product_info.product.ean
            }), settings.recent_products.push(record)), settings_manager.save(settings)
        }

        function enforceFieldLimit(object_to_enforce, limit_bytes) {
            var field_value;
            Object.keys(object_to_enforce).forEach(function(key) {
                if (field_value = object_to_enforce[key], "string" == typeof field_value && field_value.length > limit_bytes) delete object_to_enforce[key];
                else if (Array.isArray(field_value)) {
                    var field_val_item_string, final_array = [];
                    field_value.forEach(function(field_value_item) {
                        field_val_item_string = JSON.stringify(field_value_item), field_val_item_string.length <= limit_bytes && final_array.push(field_value_item)
                    }), object_to_enforce[key] = final_array
                } else field_value = JSON.stringify(field_value), field_value.length > limit_bytes && delete object_to_enforce[key]
            })
        }

        function safeEncodeURI(uri) {
            if(uri!=undefined)
                uri = uri.replace(/%2F/gi,"/");
            try {
                var decodedURI = decodeURI(uri)
            } catch (ex) {
                return encodeURI(uri)
            }
            return decodedURI == uri ? encodeURI(uri) : uri
        }
        var age_groups = {
            1: "",
            2: "12 and under",
            3: "13-17",
            4: "18-20",
            5: "21-34",
            6: "35-54",
            7: "55+"
        };
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
    }(),
    inbox_widget2 = function() {
        function init(root_url, container, user_id, allow_mark_as_read, callbacks) {
            server_root_url = root_url, $.ajax({
                type: "GET",
                url: root_url + "messages?id=" + user_id
            }).error(function() {
                if(navigator.connection.type == "none")
                {
                    alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                    return;
                }
                "undefined" != typeof alert_modal && alert_modal.show("Error", "Could not get user history")
            }).success(function(result) {
                _onMessages(root_url, container, result, allow_mark_as_read, callbacks)
            })
        }

        function _onMessages(root_url, container, messages, allow_mark_as_read, callbacks) {
            $.ajax({
                type: "GET",
                url: root_url + "messages/unread"
            }).error(function() {
                if(navigator.connection.type == "none")
                {
                    alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                    return;
                }
                "undefined" != typeof alert_modal && alert_modal.show("Error", "Could not get unread messages")
            }).success(function(result) {
                _onUnread(root_url, container, messages, allow_mark_as_read, result, callbacks)
            })
        }

        function _onUnread(root_url, container, messages, allow_mark_as_read, result, callbacks) {
            var pagefn = doT.template(inbox_template_def),
                unread = result.map(function(value) {
                    return value._id
                }),
                inbox_items_map = {};
            messages.sort(function(a, b) {
                return a.last_update < b.last_update ? 1 : a.last_update > b.last_update ? -1 : 0;
                /*var counta = a.responses_count,
                    countb = b.responses_count;
                if("undefined" == typeof counta)
                    counta = 0;
                if("undefined" == typeof countb)
                    countb = 0;

                if((counta > 0 && countb > 0) || (counta == countb)) {

                    console.log(a.readstate + ":" + b.readstate);
                    if(a.readstate == b.readstate)
                        return a.last_update < b.last_update ? 1 : a.last_update > b.last_update ? -1 : 0;
                    else if(a.readstate == "unread")
                        return -1;
                    else
                        return 1;
                }
                if(counta > countb)
                    return -1;
                else
                    return 1;*/
            });
            var root_messages = messages.filter(function(message) {
                    return "reply" != message.type
                }),
                reply_messages = messages.filter(function(message) {
                    return "reply" == message.type
                });
            reply_messages.forEach(function(reply) {
                var root_message = root_messages.filter(function(message) {
                    return message._id == reply.root_message
                });
                root_message.length > 0 && root_message[0].responses.push(reply), inbox_items_map[reply._id] = reply
            }), root_messages.forEach(function(message) {
                inbox_items_map[message._id] = message, message.responses && (message.responses.forEach(function(response) {
                    inbox_items_map[response._id] = response, -1 != unread.indexOf(response.id) && (response.unread = !0, message.contains_unread = !0)
                }), message.responses.sort(function(a, b) {
                    return a.created > b.created ? 1 : a.created < b.created ? -1 : 0
                }))
            });
            try {
                container.html(pagefn({
                    messages: messages,
                    unread: unread
                }))
            } catch (ex) {
                console.log("an exception occurred: " + ex)
            }
            container.find(".attachments-view").click(function() {
                var inbox_item = inbox_items_map[$(this).data("id")];
                if ("undefined" != typeof inbox_item) {
                    var modal_instance = generic_modal.init({
                        container: $("body"),
                        headerHtml: "Message attachments",
                        showFooter: !1
                    });
                    view_attachments_widget.init({
                        container: modal_instance.getBody(),
                        files: inbox_item.files
                    })
                }
            }), container.find(".message-header").click(function(e) {
                if(e.target.className == "del_btn")
                    return;
                selectTab(container, $(this).data("id"), callbacks), $("#default-footer") && $("#default-footer").addClass("hidden")
            }), container.find(".back-icon").click(function() {
                clearSelectedTab(container, callbacks), $("#default-footer") && $("#default-footer").removeClass("hidden")
            }), container.find(".mark-unread").click(function() {
                var thisFromEvent = $(this),
                    id = $(this).data("id");
                $.ajax({
                    type: "POST",
                    url: root_url + "messages/responses?state=unread&idList=" + id
                }).error(function() {
                    if(navigator.connection.type == "none")
                    {
                        alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                        return;
                    }
                    alert_modal.show("Error", "Could not mark message as unread")
                }).success(function() {
                    _markAsUnreadInGUI(container, thisFromEvent.data("parent-id"), id)
                })
            }), container.find(".delete-message").click(function() {

                var id = $(this).data("id");
                confirm_modal.setButtonClasses("btn-success", "btn-success"), confirm_modal.setButtonText("No", "Yes"), void confirm_modal.show("Delete Message?", "Are you sure you want to delete?", function() {

                    $.ajax({
                        type: "POST",
                        url: root_url + "message/" + id + "?state=archived"
                    }).error(function() {
                        if(navigator.connection.type == "none")
                        {
                            alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                            return;
                        }
                        alert_modal.show("Error", "Could not delete message")
                    }).success(function() {
                        container.find(".message_" + id).remove(), alert_modal.show("Success", "Message deleted", function(){
                            window.location.href = "#";
                            window.location.href = "#history-page";
                        })
                    })
                }, function() {

                }, function() {

                })
            }), container.find(".reply-to-crm").click(function() {
                var id = $(this).data("parent-id");
                "undefined" != typeof callbacks && messages.forEach(function(message) {
                    if (message._id == id) {
                        if ("undefined" == typeof message.responses || 0 == message.responses.length) return;
                        for (var responding_to, i = message.responses.length - 1; i >= 0; i--)
                            if (responding_to = message.responses[i], (!responding_to.type || "reply" != responding_to.type) && "undefined" != typeof callbacks) return void callbacks.onReply(responding_to.id, message.ean)
                    }
                })
            }), container.find("button.resolved").click(function() {
                var id = $(this).data("id");
                $.ajax({
                    type: "POST",
                    url: root_url + "message/" + id + "?resolved=true"
                }).error(function() {
                    if(navigator.connection.type == "none")
                    {
                        alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                        return;
                    }
                    alert_modal.show("Error", "Could not resolve message")
                }).success(function() {
                    container.find(".message_" + id).remove(), alert_modal.show("Thank you", "Thank you for contacting us")
                })
            }), container.find("button.unresolved").click(function() {
                var id = $(this).data("id");
                messages.forEach(function(message) {
                    if (message._id != id);
                    else {
                        if ("undefined" == typeof message.responses || 0 == message.responses.length) return;
                        for (var responding_to, i = message.responses.length - 1; i >= 0; i--)
                            if (responding_to = message.responses[i], (!responding_to.type || "reply" != responding_to.type) && "undefined" != typeof callbacks) return void callbacks.onReply(responding_to.id, message.ean)
                    }
                })
            }), container.find(".deleted-indicator").find("a").click(function() {
                var id = $(this).data("id");
                $.ajax({
                    type: "POST",
                    url: root_url + "message/" + id + "?state=sent"
                }).error(function() {
                    if(navigator.connection.type == "none")
                    {
                        alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                        return;
                    }
                    alert_modal.show("Error", "Could not un-delete message")
                }).success(function() {
                    container.find(".message_" + id).remove(), alert_modal.show("Success", "Message un-deleted")
                })

            })
        }

        function clearSelectedTab(container, callbacks) {
            container.find(".message").removeClass("hidden");
            var selected_message_container = container.find("#" + selectedMessage);
            selected_message_container.removeClass("active"), selected_message_container.removeClass("bounceInRight"), selected_message_container.addClass("animated bounceOutRight"), selected_message_container.addClass("hidden"), selectedMessage = "", callbacks && callbacks.onBack && callbacks.onBack()
        }

        function selectTab(container, name, callbacks) {
            container.find(".message").addClass("hidden");
            var selected_tab_container = container.find("#" + name);
            selected_tab_container.removeClass("hidden"), selected_tab_container.removeClass("animated bounceOutRight"), selected_tab_container.addClass("animated bounceInRight"), selectedMessage = name, selected_tab_container.addClass("active"), callbacks && callbacks.onViewMessage && callbacks.onViewMessage(name);
            var unread_responses = selected_tab_container.find(".unread");
            if (unread_responses.length > 0) {
                for (var unread_response_id_list = [], i = 0; i < unread_responses.length; i++) unread_response_id_list.push($(unread_responses[i]).data("id"));
                $.ajax({
                    type: "POST",
                    url: server_root_url + "messages/responses?state=read&idList=" + unread_response_id_list
                }).error(function(e) {
                    if(navigator.connection.type == "none")
                    {
                        alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                        return;
                    }
                    console.log("an error occurred while marking messages as read: " + e)
                }).success(function() {
                    setTimeout(function() {
                        _markAsReadInGUI(container, id)
                    }, 2e3)
                })
            }
        }

        function _markAsUnreadInGUI(container, message_id, response_id) {
            container.find(".response[data-id=" + response_id + "]").addClass("unread");
            //window.location = window.location;
        }

        function _markAsReadInGUI(container) {
            container.find(".unread").removeClass("unread");
            //window.location = window.location;
        }
        var unread_indicator_def = '<div class="unread-indicator animated swing animated-infinite" style="margin-left: 5px;"><i class="glyphicon glyphicon-bell icon icon-bell" style="color: red;"></i></div>',
            deleted_indicator_def = '<div class="deleted-indicator pull-left animated pulse animated-infinite" style="margin-left: 5px;" title="deleted"><a data-id="{{=value._id}}"><i class="glyphicon glyphicon-remove icon icon-remove" style="color: red;"></i></a></div>',
            message_header_time_template_def = "{{time_to_use = (value.last_update ? value.last_update : value.created);}}{{?moment({hour: 0, minute: 0, seconds: 0, milliseconds: 0}).diff(moment(time_to_use)) < 0}}{{=moment(time_to_use).fromNow()}}{{??}}{{=moment(time_to_use).fromNow()}}{{?}}",
            message_header_template_def = '<div class="message message-header" data-id="{{=value._id}}" ><div class="brand-img-container"><img {{?value.brand_logo_url}}src="{{=value.brand_logo_url}}" {{?}}class="circle" /></div><div class="message-summary"><div class="product-name">{{?value.contains_unread}}' + unread_indicator_def + '{{?}}{{? value.responses && value.responses.length > 0}}<strong>{{=value.product_name + \' (\' + (value.responses.length + 1) + \')\'}}</strong>{{??}}<strong>{{=value.product_name}}</strong>{{?}}</div><div class="message-text">{{?value.text}}{{=value.text}}{{?}}{{?value.user_id}}<span style="margin-left: 20px;">{{=value.email}}</span>{{?}}</div></div><div class="message-time">' + message_header_time_template_def + '{{?value.state == "archived"}}<div class="animation-flicker-fix">' + deleted_indicator_def + '</div>{{?}}</div><div class="msg_del_btn delete-message" data-id="{{=value._id}}"><img src="img/cancel1.png" style="width:20px;" class="del_btn"></div></div>',
            message_template_def = '<div id="{{=value._id}}" class="tab-content hidden message-detail-view" class="tab-pane" style="background-color: white; padding-bottom:40px"><div><div class="product-image-header"><div class="crop" style="background-image: url({{=general_util.safeEncodeURI(value.brand_logo_url)}})"><div class="overlay"></div></div><div class="circle" style="background-image: url({{=general_util.safeEncodeURI(value.brand_logo_url)}})"></div><div class="back-icon"><a href="#" class="fa fa-arrow-left" style="color:white"></a></div></div><div class="message-thread"><div class="brand-image-container">{{?app.caller.image_url}}<img src="{{=app.caller.image_url}}"  class="circle" />{{??}}<div class="circle no-user-image">{{= app.caller.first_name.substring(0,1).toUpperCase() + app.caller.last_name.substring(0,1).toUpperCase() }}</div>{{?}}</div><div class="message-container"><div class="message-text">{{? value.text }}{{=value.text}}{{?}}</div><div class="message-time">{{? value.files && value.files.length > 0}}<div class="inbox-attachment-count"><a class="attachments-view" data-id="{{=value._id}}"><i class="icon icon-paperclip glyphicon glyphicon-paperclip"></i>{{=value.files.length}} attachment{{?value.files.length != 1}}s{{?}}</a></div>{{?}}{{?value.created}}{{=moment(value.created).fromNow()}}{{?}}</div></div>{{? value.responses && value.responses.length > 0 }}{{~ value.responses :response_value:response_index}}{{?!response_value.type}}<div class="message-thread col-sm-12{{?response_value.unread}} unread{{?}}" data-id={{=response_value.id}}><div class="message-user-container"><div class="blob">{{?response_value.subject}}<div class="" style="font-weight: bold">{{=response_value.subject}}</div>{{??}}<div class="">Response {{?response_value.case_id}}to Case {{=response_value.case_id}}{{?}}</div>{{?}}{{=response_value.body}}</div><div class="message-time"><a role="menuitem" tabindex="-1" class="mark-unread" data-id={{=response_value.id}} data-parent-id={{=value._id}}>mark unread</a>   |   <a role="menuitem" tabindex="-1" class="reply-to-crm" data-id={{=response_value.id}} data-parent-id={{=value._id}}>reply</a>   {{?value.created}}{{=moment(response_value.created).fromNow()}}{{?}}</div></div></div>{{??}}<div class="message-thread"><div class="brand-image-container">{{?app.caller.image_url}}<img src="{{=app.caller.image_url}}"  class="circle" />{{??}}<div class="circle no-user-image">{{= app.caller.first_name.substring(0,1).toUpperCase() + app.caller.last_name.substring(0,1).toUpperCase() }}</div>{{?}}</div><div class="message-container"><div class="message-text">{{=response_value.text}}</div><div class="message-time">{{? response_value.files && response_value.files.length > 0}}<div class="inbox-attachment-count"><a class="attachments-view" data-id="{{=response_value._id}}"><i class="icon icon-paperclip glyphicon glyphicon-paperclip"></i>{{=response_value.files.length}} attachment{{?value.files.length != 1}}s{{?}}</a></div>{{?}}{{?response_value.created}}{{=moment(response_value.created).fromNow()}}{{?}}</div></div></div>{{?}}<div class="clearfix"></div>{{~}}{{?!value.resolved}}<div class="text-center">Have we resolved this issue?<div class="clearfix"></div><button class="btn btn-success button-black unresolved btn-xs" data-id={{=value._id}}>No, I\'d like to reply</button><button class="btn btn-success button-black resolved btn-xs" data-id={{=value._id}}>Yes, this is resolved</button></div><br/>{{?}}{{?}}</div></div></div>',
            inbox_template_def = '{{?it.messages.length == 0}}<div class="no-messages-text">You have not sent or received messages.</div>{{??}}{{~it.messages :value:index}}{{?value.type != "reply"}}' + message_header_template_def + '{{?}}{{~}}{{~it.messages :value:index}}{{?value.type != "reply"}}' + message_template_def + "{{?}}{{~}}{{?}}",
            server_root_url = "",
            selectedMessage = "";
        return {
            init: init
        }
    }(),
    inbox_widget = function() {
        function init(root_url, container, user_id, is_mark_read, callbacks) {
            $.ajax({
                type: "GET",
                url: root_url + "messages?id=" + user_id
            }).error(function() {
                if(navigator.connection.type == "none")
                {
                    alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                    return;
                }
                "undefined" != typeof alert_modal && alert_modal.show("Error", "Could not get user history")
            }).success(function(result) {
                _onMessages(root_url, container, result, is_mark_read, callbacks)
            })
        }

        function _onMessages(root_url, container, messages, is_mark_read, callbacks) {
            $.ajax({
                type: "GET",
                url: root_url + "messages/unread"
            }).error(function() {
                if(navigator.connection.type == "none")
                {
                    alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                    return;
                }
                "undefined" != typeof alert_modal && alert_modal.show("Error", "Could not get unread messages")
            }).success(function(result) {
                _onUnread(root_url, container, messages, is_mark_read, result, callbacks)
            })
        }

        function _onUnread(root_url, container, messages, is_mark_read, result, callbacks) {
            var pagefn = doT.template(inbox_template_def),
                unread = result.map(function(value) {
                    return value._id
                });
            messages.sort(function(a, b) {

                return a.last_update < b.last_update ? 1 : a.last_update > b.last_update ? -1 : 0;

                /*var counta = a.responses_count,
                    countb = b.responses_count;
                if("undefined" == typeof counta)
                    counta = 0;
                if("undefined" == typeof countb)
                    countb = 0;

                if((counta > 0 && countb > 0) || (counta == countb)) {

                    console.log(a.readstate + ":" + b.readstate);
                    if(a.readstate == b.readstate)
                        return a.last_update < b.last_update ? 1 : a.last_update > b.last_update ? -1 : 0;
                    else if(a.readstate == "unread")
                        return -1;
                    else
                        return 1;
                }
                if(counta > countb)
                    return -1;
                else
                    return 1;*/
            });
            var root_messages = messages.filter(function(message) {
                    return "reply" != message.type
                }),
                reply_messages = messages.filter(function(message) {
                    return "reply" == message.type
                });
            reply_messages.forEach(function(reply) {
                var root_message = root_messages.filter(function(message) {
                    return message._id == reply.root_message
                });
                root_message.length > 0 && root_message[0].responses.push(reply)
            }), root_messages.forEach(function(message) {
                message.responses && (message.responses.forEach(function(response) {
                    -1 != unread.indexOf(response.id) && (response.unread = !0, message.contains_unread = !0)
                }), message.responses.sort(function(a, b) {
                    return a.created > b.created ? 1 : a.created < b.created ? -1 : 0
                }))
            });
            try {
                container.html(pagefn({
                    messages: messages,
                    unread: unread
                }))
            } catch (ex) {}
            is_mark_read && container.find('[data-toggle="collapse"]').click(function() {
                var id = $(this).data("id"),
                    panel_body = container.find(".panel-body[data-id=" + id + "]:visible");
                if (!(panel_body.length > 0)) {
                    panel_body = container.find(".panel-body[data-id=" + id + "]");
                    var unread_responses = panel_body.find(".unread");
                    if (unread_responses.length > 0) {
                        for (var unread_response_id_list = [], i = 0; i < unread_responses.length; i++) unread_response_id_list.push($(unread_responses[i]).data("id"));
                        $.ajax({
                            type: "POST",
                            url: root_url + "messages/responses?state=read&idList=" + unread_response_id_list
                        }).error(function(e) {
                            console.log("an error occurred while marking messages as read: " + e)
                        }).success(function() {
                            setTimeout(function() {
                                _markAsReadInGUI(container, id)
                            }, 2e3)
                        })
                    }
                }
            }), container.find(".mark-unread").click(function() {
                var thisFromEvent = $(this),
                    id = $(this).data("id");
                $.ajax({
                    type: "POST",
                    url: root_url + "messages/responses?state=unread&idList=" + id
                }).error(function() {
                    if(navigator.connection.type == "none")
                    {
                        alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                        return;
                    }
                    alert_modal.show("Error", "Could not mark message as unread")
                }).success(function() {
                    _markAsUnreadInGUI(container, thisFromEvent.data("parent-id"), id)
                })
            }), container.find(".delete-message").click(function() {
                var id = $(this).data("id");
                $.ajax({
                    type: "POST",
                    url: root_url + "message/" + id + "?state=archived"
                }).error(function() {
                    if(navigator.connection.type == "none")
                    {
                        alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                        return;
                    }
                    alert_modal.show("Error", "Could not delete message")
                }).success(function() {
                    container.find(".message_" + id).remove(), alert_modal.show("Success", "Message deleted")
                })
            }), container.find(".reply-to-crm").click(function() {
                var id = $(this).data("id");
                "undefined" != typeof callbacks && callbacks.onReply(id)
            }), container.find("button.resolved").click(function() {
                var id = $(this).data("id");
                $.ajax({
                    type: "POST",
                    url: root_url + "message/" + id + "?resolved=true"
                }).error(function() {
                    if(navigator.connection.type == "none")
                    {
                        alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                        return;
                    }
                    alert_modal.show("Error", "Could not resolve message")
                }).success(function() {
                    container.find(".message_" + id).remove(), alert_modal.show("Thank you", "Thank you for contacting us")
                })
            }), container.find("button.unresolved").click(function() {
                var id = $(this).data("id");
                messages.forEach(function(message) {
                    if (message._id != id);
                    else {
                        if (0 == message.responses.length) return;
                        for (var responding_to, i = message.responses.length - 1; i >= 0; i--)
                            if (responding_to = message.responses[i], (!responding_to.type || "reply" != responding_to.type) && "undefined" != typeof callbacks) return void callbacks.onReply(responding_to.id)
                    }
                })
            }), container.find(".deleted-indicator").find("a").click(function() {
                var id = $(this).data("id");
                $.ajax({
                    type: "POST",
                    url: root_url + "message/" + id + "?state=sent"
                }).error(function() {
                    if(navigator.connection.type == "none")
                    {
                        alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                        return;
                    }
                    alert_modal.show("Error", "Could not un-delete message")
                }).success(function() {
                    container.find(".message_" + id).remove(), alert_modal.show("Success", "Message un-deleted")
                })
            })
        }

        function _markAsUnreadInGUI(container, message_id, response_id) {
            container.find(".panel-heading").find(".unread-container[data-message-id=" + message_id + "]").html(unread_indicator_def), container.find(".unread-container[data-response-id=" + response_id + "]").html(unread_indicator_def), container.find(".response[data-id=" + response_id + "]").addClass("unread");
            //window.location = window.location;
        }

        function _markAsReadInGUI(container, message_id) {
            container.find(".unread-container[data-message-id=" + message_id + "]").html(""), container.find(".panel-body[data-id=" + message_id + "]").find(".unread").removeClass("unread");
            //window.location = window.location;
        }
        var unread_indicator_def = '<div class="unread-indicator pull-left animated swing animated-infinite" style="margin-left: 5px;"><i class="glyphicon glyphicon-bell icon icon-bell" style="color: red;"></i></div>',
            deleted_indicator_def = '<div class="deleted-indicator pull-left animated pulse animated-infinite" style="margin-left: 5px;" title="deleted"><a data-id="{{=value._id}}"><i class="glyphicon glyphicon-remove icon icon-remove" style="color: red;"></i></a></div>',
            message_header_time_template_def = '{{time_to_use = (value.last_update ? value.last_update : value.created);}}{{?moment({hour: 0, minute: 0, seconds: 0, milliseconds: 0}).diff(moment(time_to_use)) < 0}}{{=moment(time_to_use).format("h:mm:ss a") + " (" + moment(time_to_use).fromNow()+ ")"}}{{??}}{{=moment(time_to_use).format("MMMM Do") + " (" + moment(time_to_use).fromNow()+ ")"}}{{?}}',
            message_header_template_def = '<div class="panel-heading message_{{=value._id}}"><div data-toggle="collapse" data-parent="#inbox_accordion" data-id={{=value._id}} href="#collapse_{{=value._id}}"><div class="message-panel-title pull-left">{{? value.responses && value.responses.length > 0}}<strong>{{=value.product_name + \' (\' + (value.responses.length + 1) + \')\'}}</strong>{{??}}<strong>{{=value.product_name}}</strong>{{?}}{{?value.user_id}}<span style="margin-left: 20px;">{{=value.email}}</span>{{?}}</div><span class="unread-container animation-flicker-fix" data-message-id={{=value._id}}>{{?value.contains_unread}}' + unread_indicator_def + '{{?}}</span>{{?value.state == "archived"}}<div class="animation-flicker-fix">' + deleted_indicator_def + '</div>{{?}}<div class="pull-right" style="margin-left: 10px;"><div class="dropdown"><button class="btn dropdown-toggle btn-xs" type="button" id="dropdown_{{=value._id}}" data-toggle="dropdown"><i class="glyphicon glyphicon-cog icon icon-cog"></i><span class="caret"></span></button><ul class="dropdown-menu" role="menu" aria-labelledby="dropdown_{{=value._id}}"><li role="presentation"><a role="menuitem" tabindex="-1" class="delete-message" data-id={{=value._id}}>Delete</a></li></ul></div></div><div class="pull-right">' + message_header_time_template_def + '</div><div class="clearfix"></div></div></div>',
            crm_message_template_def = '<div class="well response{{?response_value.unread}} crm unread{{?}} col-xs-11 col-xs-offset-1 col-md-8 col-md-offset-4" data-id={{=response_value.id}}>{{?response_value.subject}}<div class="pull-left">{{=response_value.subject}}</div>{{??}}<div class="pull-left">Response {{?response_value.case_id}}to Case {{=response_value.case_id}}{{?}}</div>{{?}}<div class="pull-right">{{?response_value.created}}{{=moment(response_value.created).format("MMMM Do, h:mm:ss a") + " (" + moment(response_value.created).fromNow() + ")"}}{{?}}</div><span class="unread-container animation-flicker-fix" data-message-id={{=value._id}} data-response-id="{{=response_value.id}}">{{?response_value.unread}}' + unread_indicator_def + '{{?}}</span><div class="pull-right" style="margin-right: 10px;"><div class="dropdown" data-id={{=response_value.id}}><button class="btn dropdown-toggle btn-xs" type="button" id="dropdown_{{=response_value.id}}" data-toggle="dropdown"><i class="glyphicon glyphicon-cog icon icon-cog"></i><span class="caret"></span></button><ul class="dropdown-menu" role="menu" aria-labelledby="dropdown_{{=response_value.id}}"><li role="presentation"><a role="menuitem" tabindex="-1" class="mark-unread" data-id={{=response_value.id}} data-parent-id={{=value._id}}>Mark unread</a></li><li role="presentation"><a role="menuitem" tabindex="-1" class="reply-to-crm" data-id={{=response_value.id}} data-parent-id={{=value._id}}>Reply</a></li></ul></div></div><div class="clearfix"></div><hr>Agent responded:<div class="clearfix"></div><div class="clearfix"></div><div class="response-body" style="word-wrap: break-word;">{{=response_value.body}}</div></div>',
            reply_template_def = '<div class="well reply {{?response_value.unread}} unread{{?}} col-xs-11 col-md-8" style="word-wrap: break-word;" data-id={{=response_value._id}}>{{?response_value.subject}}<div class="pull-left">RE: {{=response_value.subject}}</div>{{??}}<div class="pull-left">Reply {{?response_value.case_id}}to Case {{=response_value.case_id}}{{?}}</div>{{?}}<div class="pull-right">{{?response_value.created}}{{=moment(response_value.created).format("MMMM Do, h:mm:ss a") + " (" + moment(response_value.created).fromNow() + ")"}}{{?}}</div><div class="clearfix"></div><hr>You replied:<div class="clearfix"></div><div style="word-wrap: break-word;">{{=response_value.text}}</div></div>',
            message_template_def = '<div class="well"><div class="pull-right">{{?value.created}}{{=moment(value.created).format("MMMM Do, h:mm:ss a") + " (" + moment(value.created).fromNow() + ")"}}{{?}}</div><div class="clearfix"></div><hr>You said:<div class="clearfix"></div><div class="clearfix"></div><div style="margin-bottom: 10px; word-wrap: break-word;" class="message-body pull-left">{{=value.text}}</div><div class="clearfix"></div>{{? value.files && value.files.length > 0}}<div class="inbox-attachment-count"><i class="icon icon-paperclip glyphicon glyphicon-paperclip"></i>{{=value.files.length}} attachment(s)</div>{{?}}</div>{{? value.responses && value.responses.length > 0 }}{{~ value.responses :response_value:response_index}}{{?!response_value.type}}' + crm_message_template_def + "{{??}}" + reply_template_def + '{{?}}<div class="clearfix"></div>{{~}}{{?!value.resolved}}<div class="text-center">Have we resolved this issue?<div class="clearfix"></div><button class="btn btn-xs btn-info unresolved" data-id={{=value._id}}>No, I\'d like to reply</button><button class="btn btn-xs btn-info resolved" data-id={{=value._id}}>Yes, this is resolved</button></div>{{?}}{{?}}',
            collapse_template_def = '<div id="collapse_{{=value._id}}" class="message_{{=value._id}} panel-collapse collapse {{=value.state == "unread" ? "in" : ""}}"><div class="panel-body" data-id={{=value._id}}>' + message_template_def + "</div></div>",
            inbox_template_def = '{{?it.messages.length == 0}}<div class="no-messages-text">You have not sent or received messages.</div>{{??}}<div class="panel-group" id="inbox_accordion"><div class="panel panel-default" style="overflow: visible;">{{~it.messages :value:index}}{{?value.type != "reply"}}' + message_header_template_def + collapse_template_def + "{{?}}{{~}}</div></div>{{?}}";
        return {
            init: init
        }
    }(),
    opt_ins_widget = function() {
        function init(options_in) {
            var options = $.extend({}, default_options, options_in);
            options.container.html(opt_ins_template(options.opt_ins.brands)), options.container.find("a.favorite-link").click(function() {
                window.open($(this).data("link"), "_system")
            }), options.container.find("a.remove-opt").click(function() {
                var brand_id = $(this).data("id"),
                    url = options.remote_url + "/opt-in?brand=" + brand_id + "&id=" + options.user_id;
                $.ajax({
                    type: "DELETE",
                    url: url
                }).error(function(e) {
                    if(navigator.connection.type == "none")
                    {
                        alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                        return;
                    }
                    alert_modal.showFromXHR("Error", e)
                }).success(function() {
                    options.opt_ins.brands = options.opt_ins.brands.filter(function(optin) {
                        return optin._id != brand_id
                    }), init(options)
                })
            }), options.container.find("a.policy-link").click(function() {
                window.open($(this).data("link"), "_system")
            }), options.container.find("a.brand-link").click(function() {
                options.onBrandSelected($(this).data("id"))
            })
        }
        var default_options = {
                remote_url: null,
                container: null,
                opt_ins: [],
                user_id: null,
                onBrandSelected: function() {}
            },
            opt_ins_template_def = '<div class="opt-ins-widget">{{?!it || it.length == 0}}<div class="text-center no-favorites">You have not opted into any brand communications.</div>{{??}}{{~it :value:index}}<div class="well opt-in-widget" data-brand="{{=value._id}}"><div class="image-container">{{?value.logo_url}}<img src="{{=value.logo_url}}">{{?}}</div><div class="opt-ins-info"><a class="brand-link" data-id="{{=value._id}}">{{=value.name}}</a><a class="remove-opt pull-right" data-id="{{=value._id}}"><i class="glyphicon glyphicon-remove-circle"></i></a><div class="clearfix"></div>{{?value.link}}<a class="favorite-link pull-left" data-link="{{=value.link}}">{{=value.link}}</a>{{?}}{{?value.privacy_policy_url}}<a class="policy-link" data-link="{{=value.privacy_policy_url}}">privacy policy</a>{{?}}</div></div>{{~}}{{?}}</div>',
            opt_ins_template = doT.template(opt_ins_template_def);
        return {
            init: init
        }
    }(),
    opt_toggle_widget = function() {
        function init(remote_url, brand, container, caller) {
            function saveOpt() {
                var url = remote_url + "/opt-in?id=" + caller._id + "&brand=" + brand._id,
                    data = {
                        brand: brand._id
                    };
                $.ajax({
                    type: "PUT",
                    url: url,
                    data: data
                }).error(function(e) {
                    if(navigator.connection.type == "none")
                    {
                        alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                        return;
                    }
                    alert_modal.showFromXHR("Error", e)
                }).done(function() {
                    brand.opt = !0, opt_ins.css("display", "none"), opt_outs.css("display", "")
                })
            }
            container.html(template({
                brand: brand,
                caller: caller,
                active_class: "fa fa-check-square-o",
                inactive_class: "fa fa-square-o"
            }));
            var opt_ins = container.find("a.optin"),
                opt_outs = container.find("a.optout");
            opt_ins.click(function() {
                var that = $(this);
                saveOpt(that)
            }), opt_outs.click(function() {
                var url = ($(this), remote_url + "/opt-in?id=" + caller._id + "&brand=" + brand._id);
                $.ajax({
                    type: "DELETE",
                    url: url,
                    data: {
                        brand: brand._id
                    }
                }).error(function(e) {
                    if(navigator.connection.type == "none")
                    {
                        alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                        return;
                    }
                    alert_modal.showFromXHR("Error", e)
                }).done(function() {
                    delete brand.opt, opt_outs.css("display", "none"), opt_ins.css("display", "")
                })
            })
        }
        var template_def = '<div class="toggle-widget">{{? it.brand}}{{? it.brand.opt}}<a class="optout"><i class="glyphicon {{=it.active_class}} ui-tooltip" data-placement="bottom" data-original-title="Opted In"></i> opted in</a><a class="optin" style="display: none;"><i class="glyphicon {{=it.inactive_class}} ui-tooltip" data-placement="bottom" data-original-title="Favorite"></i> opt in</a>{{??}}<a class="optin"><i class="glyphicon {{=it.inactive_class}} ui-tooltip" data-placement="bottom" data-original-title="Favorite"></i> opt in</a><a class="optout" style="display: none;"><i class="glyphicon {{=it.active_class}} ui-tooltip" data-placement="bottom" data-original-title="Opted In"></i> opted in</a>{{?}}{{?}}</div>',
            template = doT.template(template_def);
        return {
            init: init
        }
    }(),
    product_accordion_widget = function() {
        function init(product, brand, container) {
            var template = doT.template(template_def),
                html = template(product);
            container.html(html), _initAccordion(product, brand, container)
        }

        function _initAccordion(product, brand, container) {

            var attribute_count = 0,
                accordion = container;
            if ("undefined" != typeof product.nutrition_labels && product.nutrition_labels.length > 0) {
                accordion.find("#nutrition_labels > .contents").html(product.nutrition_labels);
            }
            if ("undefined" != typeof product.ingredients && product.ingredients.length > 0 && (attribute_count++, accordion.find("#ingredients > .contents").html(general_util.validateURL(product.ingredients) ? '<img src="' + product.ingredients + '">' : product.ingredients)), "undefined" != typeof product.instructions && product.instructions.length > 0 && (attribute_count++, accordion.find("#instructions > .contents").html(product.instructions))) {
                attribute_count++;
            }

            //if ("undefined" != typeof product.ingredients && product.ingredients.length > 0 && (attribute_count++, accordion.find("#ingredients > .contents").html(general_util.validateURL(product.ingredients) ? '<img src="' + product.ingredients + '">' : product.ingredients)), "undefined" != typeof product.instructions && product.instructions.length > 0 && (attribute_count++, accordion.find("#instructions > .contents").html(product.instructions)), "undefined" != typeof product.nutrition_labels && product.nutrition_labels.length > 0) {
            //    attribute_count++;
            //    var nutrition_contents = "";
            //    product.nutrition_labels.forEach(function(label_or_html) {
            //        var as_url = encodeURI(label_or_html);
            //        nutrition_contents += general_util.validateURL(as_url) ? '<img style="max-width: 100%;" src="' + label_or_html + '">' : label_or_html
            //    }), accordion.find("#nutrition_labels > .contents").html(nutrition_contents), general_util.makeLinksSafe(accordion.find("#nutrition_labels > .contents"))
            //}
            
            if ("undefined" != typeof product.promo_videos && product.promo_videos.length > 0) {
                attribute_count++;
                var video_contents = "";
                product.promo_videos.forEach(function(video_link) {
                    video_contents += '<iframe width="420" height="315" src="' + video_link + '" frameborder="0" allowfullscreen></iframe>'
                }), accordion.find("#video").html(video_contents)
            }
            return container.find("a.brand-messaging").click(function() {
                "undefined" == typeof app ? window.location.href = "/product/brand-message/view/" + product.ean : app_controller.openInternalPage("#brand-messaging")
            }), container.find("a[data-toggle=collapse]").click(function() {
                $(this).toggleClass("plus")
            }), attribute_count
        }
        var ingredient_group_def = '{{? it.ingredients}}<div class="accordion-group"><div class="accordion-heading"><a data-toggle="collapse" href="#ingredientsCollapse" data-parent="#product-accordion" class="accordion-toggle plus">Ingredients</a></div><div id="ingredientsCollapse" class="accordion-body collapse"><div class="accordion-inner"><div id="ingredients"><div class="contents" style="white-space: pre-wrap;"></div></div></div></div></div>{{?}}',
            instruction_group_def = '{{? it.instructions}}<div class="accordion-group"><div class="accordion-heading"><a data-toggle="collapse" href="#instructionsCollapse" data-parent="#product-accordion" class="accordion-toggle plus">Instructions</a></div><div id="instructionsCollapse" class="accordion-body collapse"><div class="accordion-inner"><div id="instructions"><div class="contents" style="white-space: pre-wrap;"></div></div></div></div></div>{{?}}',
            nutrition_group_def = '{{? it.nutrition_labels}}<div class="accordion-group"><div class="accordion-heading"><a data-toggle="collapse" href="#nutritionCollapse" data-parent="#product-accordion" class="accordion-toggle plus">Product Label</a></div><div id="nutritionCollapse" class="accordion-body collapse"><div class="accordion-inner"><div id="nutrition_labels"><div class="contents"></div></div></div></div></div>{{?}}',
            promo_group_def = '{{? it.promo_images}}<div class="accordion-group"><div class="accordion-heading"><a data-toggle="collapse" href="#promoCollapse" data-parent="#product-accordion" class="accordion-toggle plus">Promos</a></div><div id="promoCollapse" class="accordion-body collapse"><div class="accordion-inner"><img src="{{=it.promo_images[0]}}"></div></div></div>{{?}}',
            brand_group_def = '{{? it.promo_videos || it.brand_message}}<div class="accordion-group"><div class="accordion-heading"><a data-parent="#product-accordion" class="accordion-toggle plus brand-messaging">Brand Message</a></div></div>{{?}}',
            template_def = '<div id="product-accordion" class="product-accordion accordion">' + ingredient_group_def + instruction_group_def + nutrition_group_def + brand_group_def + promo_group_def + "</div>";
        return {
            init: init
        }
    }(),
    product_basic_info_widget = function() {
        function init(remote_url, product, brand, container, caller) {
            if (caller && caller.role && "undefined" != typeof brand && ("admin" == caller.role || "action-admin" == caller.role ? (brand.can_edit = !0, brand.can_delete = !0) : "brand-manager" == caller.role && -1 != caller.managed_brands.indexOf(brand._id) && (brand.can_edit = !0, brand.can_delete = !1)), "undefined" != typeof product.name) {
                var html = template({
                    product: product,
                    brand: brand,
                    caller: caller
                });
                container.html(html)
            }
            container.find("a.delete-product").click(function() {
                confirm_modal.setButtonClasses("btn-success", "btn-danger"), confirm_modal.setButtonText("No", "Yes"), confirm_modal.show("Delete Product", "Are you sure you want to delete this product?", function() {
                    loading_modal.show("Saving..."), $.ajax({
                        type: "DELETE",
                        url: "/product/" + product._id
                    }).error(function(e) {
                        loading_modal.hide();
                        if(navigator.connection.type == "none")
                        {
                            alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                            return;
                        }
                        alert_modal.show("Error", e)
                    }).done(function() {
                        window.location.href = "/products/view"
                    })
                })
            }), container.find("a.brand-link").click(function() {
                return "undefined" != typeof cordova && "undefined" != typeof app_controller ? (app_controller.getPage("#brand").setBrandId(brand._id), void app_controller.openInternalPage("#brand")) : void(window.location.href = "/brand/view/" + brand._id)
            })
        }
        var template_def = '<div class="text-center product-basic-info-widget animation-flicker-fix"><div class="animated flipInX" style="">{{? it.brand}}<h4><a class="brand-link">{{=it.brand.name}}</a></h4>{{?}}<h4>{{=it.product.name}}</h4>{{?it.product.upc && it.product.upc.length > 0}}<div><h5>UPC: {{=it.product.upc}}</h5></div>{{?}}</div><div class="clearfix"></div></div>',
            template = doT.template(template_def);
        return {
            init: init
        }
    }(),
    product_faq_widget = function() {
        function _init(container, base_url, product, brand) {
            if(device.version=="4.3" || device.version == "4.2.2" || device.version == "4.4.4")
                $("#faq-page").height(10000);
            if (brand && brand.faq) {
                if (brand.faq.wilke) return brand.faq.wilke.enlight_tenant ? void _initWilke(container, base_url, brand) : void container.html("No tenant was configured for this brand");
                if (brand.faq.astute_knowledge_5) return brand.faq.astute_knowledge_5.touchpoint ? brand.faq.astute_knowledge_5.endpoint ? void _initAstuteKnowledge5(container, base_url, product, brand) : void container.html("No endpoint was configured for this brand") : void container.html("No touchpoint was configured for this brand")
            }
            return product.faq ? (container.html(product.faq), void general_util.makeLinksSafe(container)) : void container.html("No FAQ data was found")
        }

        function _initWilke(container, base_url, brand) {
            function _renderWilkeCategory(container, category_code, data, categories) {
                var html_contents = wilke_template({
                    data: data,
                    categories: categories,
                    category_code: category_code
                });
                container.html(html_contents), container.find("select.category-select").change(function() {
                    var code = $(this).val();
                    wilke_enlight_util.getCategory(base_url, brand.faq.wilke, code, function(err_cat, category) {
                        return err_cat ? void container.html("An error occurred: " + err_cat) : void _renderWilkeCategory(container, code, category, categories)
                    })
                }), container.find("a.faq-link").click(function() {
                    var container = $(this).parent(),
                        current_answer = container.find(".answer");
                    if (current_answer.length > 0) return void container.find(".answer").remove();
                    var code = $(this).data("code"),
                        url = base_url + "/faq/enlight/" + brand.faq.wilke.enlight_tenant + "/document/" + code;
                    return url += "?view=" + brand.faq.wilke.view_id, $.ajax({
                        type: "GET",
                        url: url
                    }).success(function(data) {
                        container.find(".answer").remove(), container.append('<div class="answer">' + data.fields.answer + "</div>")
                    }).error(function(data) {
                        console.log(data)
                    }), !1
                })
            }
            wilke_enlight_util.loadCategories(base_url, brand._id, brand.faq.wilke, function(err, categories) {
                return "undefined" != typeof err && null != err ? void console.log("an error occurred") : void wilke_enlight_util.getCategory(base_url, brand.faq.wilke, categories[0].code, function(err_cat, category) {
                    return err_cat ? void container.html("An error occurred: " + err_cat) : void _renderWilkeCategory(container, categories[0].code, category, categories)
                })
            })
        }

        function _initAstuteKnowledge5(container, base_url, product, brand) {
            var init_url = base_url + "/faq/astute-knowledge/5/session?ean=" + product.ean,
                get_response_url = base_url + "/faq/astute-knowledge/5/dialog?ean=" + product.ean;
            container.html('<div class="text-center">loading...</div>'), $.ajax({
                type: "GET",
                url: init_url
            }).success(function(data) {
                function onAskButtonClicked() {
                    function onTopicClicked() {
                        var question_id = $(this).data("question-id");
                        return $.ajax({
                            type: "GET",
                            url: get_response_url + "&utterance=" + utterance + "&question-id=" + question_id
                        }).success(function(data) {
                            container.find(".results").html(astute_knowledge_5_results_template({
                                data: data,
                                product: product,
                                brand: brand
                            })), container.find("a.topic").click(onTopicClicked), general_util.makeLinksSafe(container.find(".utterance-container"))
                        }).error(function() {}), !1
                    }
                    var input_box = container.find("input.ak5-question"),
                        utterance = input_box.val();
                    return input_box.trigger("blur"), $.ajax({
                        type: "GET",
                        url: get_response_url + "&utterance=" + utterance
                    }).success(function(data) {
                        container.find(".results").html(astute_knowledge_5_results_template({
                            data: data,
                            product: product,
                            brand: brand
                        })), container.find("a.topic").click(onTopicClicked), general_util.makeLinksSafe(container.find(".utterance-container"))
                    }).error(function() {}), !1
                }
                get_response_url += "&session-id=" + data, _getAstuteKnowledge5History(base_url, product, data, function(err, result) {
                    var html_contents = astute_knowledge_5_template({
                        dialog_history: result
                    });
                    container.html(html_contents), container.find("button.ask").click(onAskButtonClicked)
                })
            }).error(function(data) {
                if(navigator.connection.type == "none")
                {
                    alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                    return;
                }
                container.html('<div class="text-center">' + data.statusText + '</div>');
            })
        }

        function _getAstuteKnowledge5History(base_url, product, session_id, callback2) {
            var get_dialog_history_url = base_url + "/faq/astute-knowledge/5/dialog-history?ean=" + product.ean;
            get_dialog_history_url += "&session-id=" + session_id, $.ajax({
                type: "GET",
                url: get_dialog_history_url
            }).success(function(data) {
                callback2(null, data)
            }).error(function(error) {
                callback2(error)
            })
        }
        var wilke_template_def = '<div class="category-select-container"><select class="category-select">{{~it.categories :category:index}}<option value="{{=category.code}}" {{=(it.category_code == category.code ? "selected" : "")}}>{{=category.docTitle}}</option>{{~}}</select></div>{{~it.data.rows :question:index}}<div class="question"><a class="faq-link" data-code="{{=question.code}}">{{=question.docTitle}}</a></div>{{~}}<div style="margin-bottom: 20px;"></div>',
            astute_knowledge_5_template_def = '<div class="ak5-container"><form class="form-horizontal"><div class="form-group"><input type="text" class="form-control astute-knowledge5-endpoint ak5-question" value=""><button class="ask btn btn-primary btn-sm">ask</button></div></form></div><div class="results">{{?it.dialog_history && it.dialog_history.length > 0}}<hr>{{=it.dialog_history[0]}}{{?}}</div>',
            astute_knowledge_5_results_template_def = '<hr><div class="utterance-container">{{~it.data.Utterance :utterance:utterance_index}}{{=utterance}}{{~}}</div><div class="suggestion-container">{{~it.data.SuggestedTopics :topic_group:topic_group_index}}{{~topic_group.SuggestedTopic :topic:topic_index}}<a class="topic" data-question-id={{=topic.QuestionID}}>{{=topic.Text}}</a><div class="clearfix"></div>{{~}}{{~}}</div>',
            wilke_template = doT.template(wilke_template_def),
            astute_knowledge_5_template = doT.template(astute_knowledge_5_template_def),
            astute_knowledge_5_results_template = doT.template(astute_knowledge_5_results_template_def);
        return {
            init: _init
        }
    }(),
    product_jumbotron_widget = function() {
        function _init(options_in) {
            var options = $.extend({}, default_options, options_in);
            options.container.html(widget_template(options)), options.brand = options_in.brand, options.product && options.brand && (general_util.applyBestProductImage({
                product: options.product,
                brand: options.brand
            }, options.container), favorite_toggle_widget.init(options.remote_url, options.product, options.brand, options.container.find(".favorite-container"), options.caller, function() {
                var url = options.remote_url + "/opt-in?id=" + options.caller._id + "&brand=" + options.brand._id,
                    data = {
                        brand: options.brand._id
                    };
                $.ajax({
                    type: "PUT",
                    url: url,
                    data: data
                }).error(function(e) {
                    if(navigator.connection.type == "none")
                    {
                        alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                        return;
                    }
                    alert_modal.showFromXHR("Error", e)
                }).done(function() {
                    options.brand.opt = !0, opt_toggle_widget.init(options.remote_url, options.brand, options.container.find(".opt-container"), options.caller)
                })
            }), opt_toggle_widget.init(options.remote_url, options.brand, options.container.find(".opt-container"), options.caller)), product_basic_info_widget.init(options.remote_url, options.product, options.brand, options.container.find(".basic-info"), options.caller)
        }
        var widget_template_def = '<div class="product-jumbotron-widget"><div class="product-image-jumbotron"><div class="crop"><div class="overlay"></div></div><div class="circle"><img class="circle" src=""></div></div><div class="basic-info"></div><div class="product-action-container"><div class="favorite-container"></div><div class="opt-container"></div></div></div>',
            widget_template = doT.template(widget_template_def),
            default_options = {
                container: null,
                product: null,
                brand: null,
                remote_url: null,
                caller: null
            };
        return {
            init: _init
        }
    }(),
    product_locator_widget = function() {
        function init(container, remote_url, callbacks, selected_product, selected_brand) {
            if (selected_brand.locator.hasOwnProperty('iri') || selected_brand.locator.hasOwnProperty('wilke') || selected_brand.locator.hasOwnProperty('google'))
                _injectHtml(container), google_map.init(container.find(".google-maps-container"), function() {
                    map_inited = !0, _onInited(container, remote_url, callbacks, selected_product, selected_brand)
                })
            else
                _injectHtml(container), _onInited(container, remote_url, callbacks, selected_product, selected_brand)
        }

        function initLoaded(container, remote_url, callbacks, selected_product, selected_brand) {
            if (selected_brand.locator.hasOwnProperty('iri') || selected_brand.locator.hasOwnProperty('wilke') || selected_brand.locator.hasOwnProperty('google'))
                _injectHtml(container), google_map.initLoaded(container.find(".google-maps-container")), map_inited = !0, _onInited(container, remote_url, callbacks, selected_product, selected_brand)
            else
                _injectHtml(container), _onInited(container, remote_url, callbacks, selected_product, selected_brand)
        }

        function setMapCenter(lat, lon) {
            google_map.center(new google.maps.LatLng(lat, lon))
        }

        function getMapPosition() {
            return map_inited ? (my_callbacks.onGettingPosition(), void google_map.getClientPosition(function(position) {
                showMap(), map_shown = !0, google_map.createMarker("Current Location", position.lat_lon, "http://maps.google.com/mapfiles/kml/pal4/icon47.png"), my_callbacks.onGotPosition(position)
            }, function(error_message) {
                my_callbacks.onError(error_message)
            })) : void setTimeout(getMapPosition, 2e3)
        }

        function setAvailableModes(types,provider) {
            locator = provider;
            -1 != types.indexOf("zip") ? outer_container.find(".location-option").find("li.zip").removeClass("hidden") : outer_container.find(".location-option").find("li.zip").addClass("hidden"), -1 != types.indexOf("location") ? outer_container.find(".location-option").find("li.location").removeClass("hidden") : outer_container.find(".location-option").find("li.location").addClass("hidden")
        }

        function setMode(type) {
            mode = type, "zip" == type ? single_input_modal.show("Enter ZIP", "Specify the zip code to search", "number", function() {

                var zipCode = single_input_modal.getValue($("body"));
                if(general_util.validateZip(true,false,zipCode))
                    searchByZip(single_input_modal.getValue($("body")))
                else
                {
                    alert_modal.show("Error", "Input valid zipcode!")
                }
            }) : _locateAndSearchNearby(my_callbacks)
        }

        function getMode() {
            return mode
        }

        function showMap() {
            maps_parent_container.removeClass("hidden"), google_map.showMap()
        }

        function searchNearby(callback2) {
            if (_removePlaceMarkers(), _setDirectionsVisible(!0), _setStoreListingsVisible(!1), !map_inited) return void setTimeout(getMapPosition, 2e3);
            if (_showMessage(""), store_listing_container.html(""), "undefined" == typeof product) return void callback2("product not loaded for where to buy page");

            if (brand.locator && brand.locator.google){
                _searchNearbyGoogle(callback2);
            } else if ("undefined" != typeof brand && "undefined" != typeof brand.locator) {
                var position = google_map.getLastPosition(),
                    radius = parseInt($('.radius-option').find('.text').html());
                    url = my_remote_url + "/product/" + product.ean + "/where-to-buy?lat=" + position.coords.latitude + "&lon=" + position.coords.longitude + "&radius=" + radius;
                console.log("product-locator-widget: searching for nearby locations using third-party locator"), $.ajax({
                    type: "GET",
                    url: url
                }).error(function() {
                    _searchNearbyGoogle(callback2)
                }).success(function(result) {
                    if (locator == "iri") {
                        if ("undefined" == typeof result || "undefined" == typeof result.nearbyStores || 0 == result.nearbyStores.length) return _showMessage("No store were found near you that carry this product"), void callback2(null, []);
                    }
                    else if(locator == "wilke") {
                        //if ("undefined" == typeof result || "undefined" == typeof result.nearbyStores || 0 == result.nearbyStores.length) return _showMessage("No store were found near you that carry this product"), void callback2(null, []);
                        if("undefined" != typeof result && result.none_found.search('No stores were found.') >= 0)
                            return _showMessage("No store were found near you that carry this product"), void callback2(null, []);
                        else if ("undefined" != typeof result && result.none_found.search('not found in database') >= 0) return _showMessage("No data found."), void callback2(null, []);
                    }
                    var message = "This product has been known to have recently been purchased from these locations";
                    result.nearbyStores.length > 9 && (message += " (closest ten results shown)"), _showMessage(message), result.nearbyStores.forEach(function(store) {
                        _addMarker({
                            name: store.name,
                            geometry: {
                                location: new google.maps.LatLng(store.latitude, store.longitude)
                            }
                        })
                    }), _buildWilkeStoreInfo(result.nearbyStores), callback2(null, result)
                })
            } else _searchNearbyGoogle(callback2)
        }

        function searchByZip(zip_code) {
            zip = zip_code, _removePlaceMarkers(), _setDirectionsVisible(!1), _showMessage(""), store_listing_container.html(""), my_callbacks.onLoading(), _centerOnZip(zip), outer_container.find(".location-option").find(".text").html(zip_code);
            radius = parseInt($('.radius-option').find('.text').html());
            var url = my_remote_url + "/product/" + product.ean + "/where-to-buy?zip=" + zip_code + "&radius=" + radius;
            $.ajax({
                type: "GET",
                url: url
            }).error(function(xhr) {
                if(navigator.connection.type == "none")
                {
                    alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                    my_callbacks.onError("Unable to communicate with the server. Please check your data connection.");
                    return;
                }else if(xhr.status == 500)
                {
                    alert_modal.show("Error","No data found.");
                    my_callbacks.onError("No data found.");
                    return;
                }
                alert_modal.show("Error",xhr.responseText);
                my_callbacks.onError(xhr.responseText);

            }).success(function(result) {
                if (locator == "iri") {
                    if ("undefined" == typeof result || "undefined" == typeof result.nearbyStores)
                        return _showMessage("No data found."), void my_callbacks.onResult(null, result);
                    else if("undefined" != typeof result && "undefined" != typeof result.nearbyStores && 0 == result.nearbyStores.length) return _showMessage("No store were found near you that carry this product"), void my_callbacks.onResult(null, result);
                }
                else if(locator == "wilke") {
                    if("undefined" != typeof result && result.none_found.search('No stores were found.') >= 0)
                        return _showMessage("No store were found near you that carry this product"), void my_callbacks.onResult(null, result);
                    else if ("undefined" != typeof result && result.none_found.search('not found in database') >= 0) return _showMessage("No data found."), void my_callbacks.onResult(null, result);
                }
                var message = "This product has been known to have recently been purchased from these locations";
                result.nearbyStores.length > 9 && (message += " (closest ten results shown)"), _showMessage(message);
                var lat, lon, lat_total = 0,
                    lon_total = 0;
                result.nearbyStores.forEach(function(store) {
                    lat_total += store.latitude, lon_total += store.longitude
                }), lat = lat_total / result.nearbyStores.length, lon = lon_total / result.nearbyStores.length;
                var position = {
                    lat_lon: new google.maps.LatLng(lat, lon),
                    coords: {
                        latitude: lat,
                        longitude: lon
                    }
                };
                google_map.getLastPosition() || (console.log("product-locator-widget: since no position has been established, setting it to center of mass of results"), google_map.setUserPosition(position)), showMap(), google_map.createMarker("Current Location", google_map.getLastPosition().lat_lon, "http://maps.google.com/mapfiles/kml/pal4/icon47.png"), map_shown = !0, result.nearbyStores.forEach(function(store) {
                    _addMarker({
                        name: store.name,
                        geometry: {
                            location: new google.maps.LatLng(store.latitude, store.longitude)
                        }
                    })
                }), _buildWilkeStoreInfo(result.nearbyStores), my_callbacks.onResult(null, result)
            })
        }

        function isMapInited() {
            return map_inited
        }

        function getDirections(latitude, longitude) {
            console.log("product-locator-widget: getting directions to " + latitude + "," + longitude), google_map.closeInfoWindow(), google_map.getDirections("(" + latitude + "," + longitude + ")", function() {
                _setDirectionsVisible(!0), google_map.triggerResize(), google_map.centerOnClientLocation()
            })
        }

        function _injectHtml(container) {
            outer_container = container, outer_container.html(doT.template(widget_template_spec)()), store_listing_container = outer_container.find(".store-listing"), maps_parent_container = outer_container.find(".maps-panel-parent"), directions_panel_parent = $(".directions-panel-parent"), "undefined" != typeof platform_util && platform_util.isMobile() && "undefined" != typeof app_util && app_util.applyBootstrapDropdownFix()
        }

        function _onInited(container, remote_url, callbacks, selected_product, selected_brand) {
            if(selected_brand.locator && selected_brand.locator.w2b_message && selected_brand.locator.w2b_message!="")
                container.find(".w2b-message").html(selected_brand.locator.w2b_message);

            if (selected_brand.locator.hasOwnProperty('iri') || selected_brand.locator.hasOwnProperty('wilke') || selected_brand.locator.hasOwnProperty('google'))
            {
                my_remote_url = remote_url, my_callbacks = callbacks, product = selected_product, brand = selected_brand, container.find(".location-option").find("ul.dropdown-menu").find(".current-location").click(function() {
                    setMode("location")
                }), container.find(".location-option").find("ul.dropdown-menu").find(".zip").click(function() {
                    setMode("zip")
                }), container.find(".radius-option").find("ul.dropdown-menu").find("a").click(function() {
                    radius = parseInt($(this).data("value")), container.find(".radius-option").find(".text").html(radius + " miles"), "location" == mode ? _locateAndSearchNearby(callbacks) : searchByZip(zip)
                }), directions_panel_parent.addClass("hidden"), google_map.setDirectionsPanel(".directions-panel")
            }
            callbacks.onInited()
        }

        function _removePlaceMarkers() {
            place_markers.forEach(function(marker) {
                google_map.removeMarker(marker)
            }), place_markers = []
        }

        function _buildWilkeStoreInfo(stores) {
            var pagefn = doT.template(wilke_stores_template_spec),
                html_contents = pagefn({
                    stores: stores
                });
            store_listing_container.html(html_contents), store_listing_container.find("a.directions").click(function() {
                my_callbacks.onDirectionsRequested($(this).data("latitude"), $(this).data("longitude"))
            }), store_listing_container.find("a.sName").click(function() {
                var marker = place_markers[$(this).data("index")];
                google.maps.event.trigger(marker, "click")
            }), _setStoreListingsVisible(!0)
        }

        function _showMessage(message) {
            var message_container = outer_container.find(".messages");
            message.length > 0 && message_container.css("margin-bottom", message.length > 0 ? "10px" : "0"), message_container.html(message)
        }

        function _searchNearbyGoogle(callback2) {
            console.log("product-locator-widget: searching for nearby locations using google places API"), google_map.searchNearby(3, product.map_search_types, function(places) {
                _onPlacesResults(places), callback2(null, places)
            })
        }

        function _onPlacesResults(places) {
            if(places.length == 0)
                alert_modal.show("No places found","No stores were found near you that carry this product")
            places.forEach(function(place) {
                _addMarker(place)
            });
            var pagefn = doT.template(google_places_template_spec),
                html_contents = pagefn({
                    stores: places
                });
            store_listing_container.html(html_contents), store_listing_container.find("a.directions").click(function() {
                my_callbacks.onDirectionsRequested($(this).data("latitude"), $(this).data("longitude"))
            }), store_listing_container.find("a.sName").click(function() {
                var marker = place_markers[$(this).data("index")];
                google.maps.event.trigger(marker, "click")
            }), _setStoreListingsVisible(!0)
        }

        function _addMarker(place) {
            var new_marker = google_map.createMarker(place.name, place.geometry.location, void 0, _onMarkerClicked);
            return place_markers.push(new_marker), new_marker
        }

        function _onMarkerClicked() {
            var directions_link = $("a.get-directions");
            directions_link.unbind("click"), directions_link.click(function(evt) {
                var latitude = parseFloat(evt.target.dataset.lat),
                    longitude = parseFloat(evt.target.dataset.lon);
                my_callbacks.onDirectionsRequested(latitude, longitude)
            })
        }

        function _locateAndSearchNearby(callbacks) {
            return outer_container.find(".location-option").find(".text").html("Current Location"), google_map.getLastPosition() ? void searchNearby(callbacks.onResult) : (my_callbacks.onGettingPosition(), void getMapPosition(function() {
                my_callbacks.onGotPosition(), searchNearby(callbacks.onResult)
            }))
        }

        function _setStoreListingsVisible(visible) {
            visible ? store_listing_container.removeClass("hidden") : store_listing_container.addClass("hidden"), _refreshUI()
        }

        function _setDirectionsVisible(visible) {
            visible ? directions_panel_parent.removeClass("hidden") : (directions_panel_parent.addClass("hidden"), google_map.hideDirections()), _refreshUI()
        }

        function _refreshUI() {
            store_listing_container.hasClass("hidden") ? (directions_panel_parent.removeClass("col-lg-8"), maps_parent_container.removeClass("col-lg-8")) : (directions_panel_parent.addClass("col-lg-8"), maps_parent_container.addClass("col-lg-8"))
        }

        function _centerOnZip(zip) {
            $.get(my_remote_url + "/reference/postal-code-coord?postal_code=" + zip, function(result) {
                result ? setMapCenter(result.location.lat, result.location.lng) : console.log("could not use get postal code lat lng from reference db")
            })
        }
        var outer_container, store_listing_container, maps_parent_container, directions_panel_parent, my_remote_url, my_callbacks, brand, product, zip, mode, widget_template_spec = '<div class="w2b-message"></div><div class="messages"></div><div class="options-container"><div class="parameters-container"><span class="pull-left"><div class="dropdown radius-option"><a class="dropdown-toggle" type="button" data-toggle="dropdown" aria-expanded="true"><span class="text">5 miles</span><span class="">&nbsp;<i class="glyphicon glyphicon-chevron-down"></i></span></a><ul class="dropdown-menu" role="menu"><li role="presentation"><a role="menuitem" tabindex="-1" data-value="5">5 miles</a></li><li role="presentation"><a role="menuitem" tabindex="-1" data-value="10">10 miles</a></li><li role="presentation"><a role="menuitem" tabindex="-1" data-value="20">20 miles</a></li></ul></div></span><span class="pull-right"><div class="dropdown location-option"><a class="dropdown-toggle" type="button" data-toggle="dropdown" aria-expanded="true"><span class="text">Select Search Type</span><span class="">&nbsp;<i class="glyphicon glyphicon-chevron-down"></i></span></a><ul class="dropdown-menu" role="menu"><li role="presentation" class="location"><a role="menuitem" tabindex="-1" class="current-location">Current Location</a></li><li role="presentation" class="zip"><a role="menuitem" tabindex="-1" class="zip">ZIP code</a></li></ul></div></span></div><div class="clearfix"></div></div><div class="store-listing hidden col-xs-12 col-sm-4" style="overflow-y: auto; max-height: 600px; padding-left: 0; padding-right: 12px;"></div><div class="directions-panel-parent col-xs-12 col-sm-8 pull-right"><div class="directions-panel"></div></div><div class="maps-panel-parent col-xs-12 col-sm-8 pull-right hidden" style="height: 600px; padding: 0;"><div class="google-map" style="width: 100%; height: 100%"><div class="google-maps-container" style="height: 100%;"></div></div></div><div class="clearfix"></div>',
            wilke_stores_template_spec = '<div class="w2b-message"></div>{{~it.stores :store:index}}<div class="storeDiv"><div class="address-parent"><a class="sName" data-index="{{=index}}">{{=store.name}}</a><div class="separator"></div><span class="sAddress1">{{=store.address}}</span><div class="separator"></div><span class="sAddress2">{{=store.city}}</span><div class="separator"></div><span class="sPhone">{{=store.phone}}</span><div class="separator"></div><div class="sDist">{{=store.distance}} miles</div></div><div class="directions-parent"><a class="directions" data-latitude="{{=store.latitude}}" data-longitude="{{=store.longitude}}"><i class="glyphicon glyphicon-map-marker"></i></a></div><div class="clearfix"></div></div>{{~}}',
            google_places_template_spec = '<div class="w2b-message"></div>{{~it.stores :store:index}}<div class="storeDiv"><div class="address-parent"><a class="sName" data-index="{{=index}}">{{=store.name}}</a><br><span class="sAddress1">{{=store.vicinity}}</span><br><div class="sDist">{{=store.distance.toFixed(1)}} miles</div></div><div class="directions-parent"><a class="directions" data-latitude="{{=store.geometry.location.lat()}}" data-longitude="{{=store.geometry.location.lng()}}"><i class="glyphicon glyphicon-map-marker"></i></a></div><div class="clearfix"></div></div></div>{{~}}',
            map_shown = !1,
            map_inited = !1,
            place_markers = [],
            radius = 5,
            locator;
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
    }(),
    product_menu_widget = function() {
        function init(options_in) {
            var options = $.extend({}, default_options, options_in);
            if (!options.brand && !options.product) return void options.container.html("");
            var show_info = !1,
                show_locator = !1,
                show_faq = !1;
            (options.brand.locator && options.brand.locator.wilke || options.brand.locator && options.brand.locator.iri || options.brand && options.brand.participating && options.brand.locator && options.brand.locator.participating_message!="" || options.brand && options.brand.participating && options.brand.locator && options.brand.locator.w2b_message !="" || options.product && options.product.map_search_types) && (show_locator = !0), options.product && (options.product.ingredients || options.product.instructions || options.product.nutrition_labels && options.product.nutrition_labels.length > 0 || options.product.promo_videos && options.product.promo_videos.length > 0 || options.product.brand_message) && (show_info = !0), (options.brand && options.brand.faq || options.product && options.product.faq) && (show_faq = !0), options.container.html(options.horizontal ? horizontal_template({
                show_locator: show_locator,
                show_info: options.show_product_info && show_info,
                show_faq: show_faq,
                brand: options.brand
            }) : vertical_template({
                show_locator: show_locator,
                show_info: options.show_product_info && show_info,
                show_faq: show_faq,
                brand: options.brand
            })), options.container.find(".product-information").click(function() {
                options.onProductInfo()
            }), options.container.find(".product-faq").click(function() {
                options.onFAQ()
            }), options.container.find(".product-where-to-buy").click(function() {
                options.onWhereToBuy()
            }), options.container.find(".how-can-we-help").click(function() {
                options.onContactUs()
            })
        }
        var vertical_template_def = '<div class="product-menu-widget vertical">{{?it.show_info}}<a class="btn menu-button product-information">info</a><div class="clearfix"></div>{{?}}{{?it.show_faq}}<a class="btn menu-button product-faq">faq</a><div class="clearfix"></div>{{?}}{{?it.show_locator}}<a class="btn menu-button product-where-to-buy">where to buy</a><div class="clearfix"></div>{{?}}{{?it.brand && it.brand.crm_email_endpoint}}<a class="btn menu-button how-can-we-help">contact us</a><div class="clearfix"></div>{{?}}</div>',
            horizontal_template_def = '<div class="product-menu-widget horizontal">{{?it.show_info}}<a class="product-information">info</a>{{?}}{{?it.show_faq}}<a class="product-faq">faq</a>{{?}}{{?it.show_locator}}<a class="product-where-to-buy">where to buy</a>{{?}}{{?it.brand && it.brand.crm_email_endpoint}}<a class="how-can-we-help">contact us</a>{{?}}</div>',
            vertical_template = doT.template(vertical_template_def),
            horizontal_template = doT.template(horizontal_template_def),
            default_options = {
                horizontal: !1,
                show_product_info: !0,
                brand: null,
                product: null,
                onProductInfo: function() {},
                onFAQ: function() {},
                onWhereToBuy: function() {},
                onContactUs: function() {}
            };
        return {
            init: init
        }
    }(),
    product_search_results = function() {
        function _init(remote_url, container, term, limit, onSelected) {
            container.html('<div class="product-search-results-widget simple"><div class="results-count"></div><div class="results-container"></div><div class="text-center"><button class="btn btn-xs btn-load-more hidden">Load More</button></div></div>'), loading_modal.show(), container.find(".results-count").html("");
            var start_time = new Date,
                url = remote_url + "/products/find?limit=" + limit + "&ean_or_name=" + encodeURIComponent(term) + "&count=true";
            general_util.reportSearch(term);
            var platform = "undefined" != typeof platform_util ? platform_util.getPlatformString() : "web";
            url += "&platform=" + platform, $.ajax({
                type: "GET",
                url: url
            }).error(function() {
                loading_modal.hide();
                if(navigator.connection.type == "none")
                {
                    alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                    return;
                }
                window.alert("an error occurred");
            }).done(function(result) {
                loading_modal.hide();

                var settings = settings_manager.get();
                settings.back_term = term;
                settings.back_products = result;
                settings_manager.save(settings);

                var since_text = (((new Date).getTime() - start_time.getTime()) / 1e3).toFixed(3),
                    result_text = result.count + " results found in " + since_text + " seconds";
                container.find(".results-count").html(result_text), _append(container.find(".results-container"), result.products, onSelected), _processMoreButton(remote_url, container, term, limit, result, onSelected)
            })
        }

        function _initWithStaticData(container, products, onSelected) {
            container.html(widget_template({})), container.find(".results-count").html(""), _append(container.find(".results-container"), products, onSelected)
        }

        function _append(container, products, onSelected) {
            var html = "";
            html += item_template({
                products: products
            }), container.append(html);
            var product_results = container.find(".product-result");
            product_results.unbind("click"), product_results.click(function() {
                onSelected($(this).data("product"))
            })
        }

        function _processMoreButton(remote_url, container, term, limit, result_page_one, onSelected) {
            var loadButton = container.find(".btn-load-more");
            result_page_one.products.length > 0 && result_page_one.count > limit ? loadButton.removeClass("hidden") : loadButton.addClass("hidden");
            var page = 0;
            loadButton.unbind("click"), loadButton.click(function() {
                page++;
                var url = remote_url + "/products/find?limit=" + limit + "&ean_or_name=" + encodeURIComponent(term) + "&count=true&page=" + page + "&pageSize=" + limit,
                    platform = "undefined" != typeof platform_util ? platform_util.getPlatformString() : "web";
                url += "&platform=" + platform, $.ajax({
                    type: "GET",
                    url: url
                }).error(function() {
                    loading_modal.hide();
                    if(navigator.connection.type == "none")
                    {
                        alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                        return;
                    }
                    window.alert("an error occurred");
                }).done(function(result) {
                    var settings = settings_manager.get();
                    settings.back_products = result;
                    settings_manager.save(settings);

                    result.count <= limit * (page + 1) && loadButton.addClass("hidden"), product_search_results.append(container.find(".results-container"), result.products, onSelected), loading_modal.hide()
                    if(device.version == "4.3" || device.version == "4.2.2" || device.version == "4.4.4")
                    {
                        $("#find").hide().show(0);
                        //$("#brand").css({"min-height":"5000px"});
                    }

                })
            })
        } {
            var widget_template_def = '<div class="product-search-results-widget simple"><div class="results-count"></div><div class="results-container"></div><div class="text-center"><button class="btn btn-xs btn-load-more hidden">Load More</button></div></div>',
                widget_template = doT.template(widget_template_def),
                item_template_def = '{{~it.products :product:index}}<hr><div class="product-result flex-wrap" data-product="{{=product.ean}}"><div class="left-side">{{? product.images && product.images.length > 0}}<img class="product-thumbnail" src="{{=product.images[0]}}">{{?? product.brand_logo_url }}<img class="product-thumbnail" src="{{=product.brand_logo_url}}">{{??}}<img class="product-thumbnail">{{?}}</div><div class="right-side"><div class="product-name">{{=product.name}}</div></div><div class="clearfix"></div></div>{{~}}<div style="margin-bottom: 20px;"></div>',
                item_template = doT.template(item_template_def);
            doT.template(item_template_def)
        }

        function _preserveSearch(remote_url, container, term, limit, onSelected) {
            ////////hans
            container.html('<div class="product-search-results-widget simple"><div class="results-count"></div><div class="results-container"></div><div class="text-center"><button class="btn btn-xs btn-load-more hidden">Load More</button></div></div>'), container.find(".results-count").html("");
            var start_time = new Date
            var settings = settings_manager.get();
            settings.back_product_flag = true;
            result = settings.back_products;

            var since_text = (((new Date).getTime() - start_time.getTime()) / 1e3).toFixed(3),
                result_text = result.count + " results found in " + since_text + " seconds";
            container.find(".results-count").html(result_text), _append(container.find(".results-container"), result.products, onSelected), _processMoreButton(remote_url, container, term, limit, result, onSelected)
        }
        return {
            init: function(remote_url, container, term, limit, onSelected) {
                _init(remote_url, container, term, limit, onSelected)
            },
            initWithStaticData: function(container, product_infos, onSelected) {
                _initWithStaticData(container, product_infos, onSelected)
            },
            append: function(container, products, onSelected) {
                _append(container, products, onSelected)
            },
            preserveSearch: function(remote_url, container, term, limit, onSelected) {
                _preserveSearch(remote_url, container, term, limit, onSelected)
            }
        }
    }(),
    product_summary_widget = function() {
        function init(remote_url, product, brand, container, caller) {
            if (caller && caller.role && "undefined" != typeof brand && ("admin" == caller.role || "action-admin" == caller.role ? (brand.can_edit = !0, brand.can_delete = !0) : "brand-manager" == caller.role && -1 != caller.managed_brands.indexOf(brand._id) && (brand.can_edit = !0, brand.can_delete = !1)), "undefined" != typeof product.name) {
                var html = template({
                    product: product,
                    brand: brand,
                    caller: caller
                });
                container.html(html)
            }
            container.find("a.delete-product").click(function() {
                confirm_modal.setButtonClasses("btn-success", "btn-danger"), confirm_modal.setButtonText("No", "Yes"), confirm_modal.show("Delete Product", "Are you sure you want to delete this product?", function() {
                    loading_modal.show("Saving..."), $.ajax({
                        type: "DELETE",
                        url: "/product/" + product._id
                    }).error(function(e) {
                        loading_modal.hide();
                        if(navigator.connection.type == "none")
                        {
                            alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                            return;
                        }
                        alert_modal.show("Error", e);
                    }).done(function() {
                        window.location.href = "/products/view"
                    })
                })
            }), favorite_toggle_widget.init(remote_url, product, brand, container.find(".favorite-container"), caller), opt_toggle_widget.init(remote_url, brand, container.find(".opt-container"), caller), container.find("a.brand-link").click(function() {
                var brand_link = $(this).data("link");
                window.open(brand_link, "_system")
            })
        }
        var template_def = '<div class="well animation-flicker-fix" style="padding-bottom: 20px;"><div class="pull-left animated flipInX" style=""><h3 class="pull-left">{{=it.product.name}}</h3>{{? it.caller}}<div class="favorite-container pull-left" style="display: inline; margin-left: 10px; margin-top: 10px;"></div>{{?}}<div class="clearfix"></div>{{?it.product.upc && it.product.upc.length > 0}}<div><h5>UPC: {{=it.product.upc}}</h5></div>{{?}}<div><h5>EAN: {{=it.product.ean}}</h5></div>{{? it.brand}}<div><strong>Brand</strong>:&nbsp;{{? it.brand.link}}<a data-link="{{=it.brand.link}}" class="brand-link">{{=it.brand.name}}</a>{{??}}{{=it.brand.name}}{{?}}{{? it.caller && typeof(cordova) == "undefined" && (it.caller.role == "admin" || it.caller.role == "brand-manager" || it.caller.role == "action-admin")}}<a href="/brand/view/{{=it.brand._id}}" style="margin-left: 10px;"><i class="glyphicon glyphicon-search"></i></a>{{?}}{{? it.caller}}<div class="opt-container" style="display: inline; margin-left: 10px; margin-top: 10px;"></div>{{?}}</div>{{?}}</div><div class="pull-right">{{? typeof(cordova) == "undefined" && it.brand && (it.brand.can_edit || it.brand.can_delete)}}{{? it.brand.can_edit}}<a class="pull-right btn btn-sm btn-success" style="margin-top: 10px;" href="/product/view/{{=it.product.ean}}?mode=edit">Edit</a>{{?}}<div class="clearfix"></div>{{? it.brand.can_delete}}<a class="pull-right btn btn-sm btn-danger delete-product" style="margin-top: 10px;" data-ean="{{=it.product.ean}}">Delete</a>{{?}}{{?}}</div><div class="clearfix"></div></div>',
            template = doT.template(template_def);
        return {
            init: init
        }
    }(),
    products_typeahead_widget = function() {
        function init(remote_url, container, onSearch, onSelected, initial_value) {
            var input_box = container.find("input.code-entry");
            input_box.on("keyup", function(e) {
                13 == e.which && (e.preventDefault(), input_box.trigger("blur"), onSearch(getValue(container)))
            });
            var limit = 20,
                products_bloodhound = new Bloodhound({
                    datumTokenizer: function(d) {
                        return Bloodhound.tokenizers.whitespace(d.name)
                    },
                    limit: limit,
                    queryTokenizer: function(d) {
                        var result = Bloodhound.tokenizers.whitespace(d);
                        return result.forEach(function(result_item, index) {
                            result[index] = encodeURIComponent(result_item)
                        }), result
                    },
                    remote: remote_url + "/products/find?limit=" + limit + "&ean_or_name=%QUERY"
                });
            products_bloodhound.initialize(), input_box.typeahead(null, {
                name: "products",
                displayKey: "name",
                highlight: !0,
                templates: {
                    suggestion: function(object) {
                        var settings = settings_manager.get();
                        settings.back_products = [];
                        settings.back_term = getValue(container);
                        settings_manager.save(settings);
                        return '<p><strong class="pull-left">' + object.name + "</strong>" + (object.brand_name ? '<div class="pull-right brand-name" style="margin-right: 5px;">' + object.brand_name + "</div>" : "") + '</p><div class="clearfix"></div><p style="text-align: right;">' + ("undefined" != typeof object.upc ? object.upc : object.ean) + "</p>"
                    }
                },
                source: products_bloodhound.ttAdapter()
            }).on("typeahead:selected", function(evt, suggestion) {
                input_box.trigger("blur"), onSelected(suggestion)
            }), container.find("button.search").click(function() {
                onSearch(getValue(container))
            }), input_box.val(initial_value ? initial_value : "")
        }

        function getValue(container) {
            return container.find("input.tt-input").val()
        }
        return {
            init: init,
            getValue: getValue
        }
    }(),
    profile_form = function() {
        function init(container, caller, options) {
            var genders = [{
		    value: "0",
		    text: "&nbsp;Gender",
		    selected: !0
	         }, {
                    value: "1",
                    text: "&nbsp;male"
                }, {
                    value: "2",
                    text: "&nbsp;female"
                }],
                countries = [{
                    value: "USA",
                    text: "&nbsp;United States of America"
                }, {
                    value: "CAN",
                    text: "&nbsp;Canada"
                }],
                is_role_visible = options.show_role && "undefined" != typeof caller && "admin" == caller.role,
                password_text = options.password_required ? "Password *" : "Password",
                showProfileFields = "undefined" != typeof options.is_profile && options.is_profile,
                fields = [{
                    label: "Email *",
                    property: "email",
                    visible: options.show_email,
                    enabled: options.email_enabled,
                    spacing_class: "col-xs-12 pad-left-icon",
                    field_icon: "fa fa-envelope"
                }, {
                    label: "First Name *",
                    property: "first_name",
                    visible: !0,
                    enabled: !0,
                    spacing_class: "col-xs-6"
                }, {
                    label: "Last Name *",
                    property: "last_name",
                    visible: !0,
                    enabled: !0,
                    spacing_class: "col-xs-6"
                }, {
                    label: "Birth Date *",
                    property: "dob",
                    visible: !0,
                    enabled: !0,
                    spacing_class: "col-xs-8",
                    field_type: "date",
                    field_icon_right: "fa fa-question-circle",
                    label_onclick: "profile_form.onDOBHelpClick",
                    watermark: !0
                }, {
                    label: "Gender",
                    property: "gender",
                    visible: !0,
                    enabled: !0,
                    type: "select",
                    values: genders,
                    spacing_class: "col-xs-4"
                }, {
                    label: "Phone #",
                    property: "phone",
                    visible: showProfileFields,
                    enabled: !0,
                    spacing_class: "col-xs-12 pad-left-icon",
                    field_icon: "fa fa-phone"
                }, {
                    label: "Street Address",
                    property: "street",
                    visible: showProfileFields,
                    enabled: !0,
                    spacing_class: "col-xs-12"
                }, {
                    label: "City",
                    property: "city",
                    visible: showProfileFields,
                    enabled: !0,
                    spacing_class: "col-xs-8"
                }, {
                    label: "State",
                    property: "state",
                    visible: showProfileFields,
                    enabled: !0,
                    spacing_class: "col-xs-4"
                }, {
                    label: "Country",
                    property: "country",
                    visible: showProfileFields,
                    enabled: !0,
                    type: "select",
                    values: countries,
                    spacing_class: "col-xs-12"
                }, {
                    label: "Postal Code *",
                    property: "zip",
                    visible: !0,
                    enabled: !0,
                    spacing_class: "col-xs-12"
                }, {
                    label: password_text,
                    property: "password",
                    visible: options.show_password,
                    type: "password",
                    enabled: !0,
                    spacing_class: "col-xs-12"
                }, {
                    label: "Opt In to Action!",
                    property: "opt",
                    visible: !0,
                    type: "check",
                    enabled: !0,
                    spacing_class: "col-xs-6 terms-label"
                }, {
                    label: "Terms & Conditions",
                    property: "terms",
                    visible: !showProfileFields,
                    type: "check",
                    enabled: !0,
                    spacing_class: "col-xs-6 terms-label",
                    label_link: "#terms-and-conditions",
                    label_onclick: "profile_form.onTermsClicked"
                }, {
                    label: "Role",
                    property: "role",
                    visible: is_role_visible,
                    type: "select",
                    enabled: !0,
                    values: roles,
                    spacing_class: "col-xs-12"
                }];
            return flex_form_widget.init(container, {
                fields: fields,
                caller: caller
            }), general_util.addPhoneInputHandler(container.find("input.phone-field")), fields
        }

        function onTermsClicked() {
            app_controller.openInternalPage("#terms-and-conditions", {
                hide_from_history: !1
            })
        }

        function onDOBHelpClick() {
            alert_modal.show("Why share my birthday with Action!", 'Sharing your birthday with action! helps us comply with age regulations for the companies you want to connect with. <a href="javascript:void(0);" onclick="app_controller.openExternalPage(\'http://www.coppa.org\')">Click Here</a> for more info.')
        }

        function getWidgets(form_container, context) {
            return form_widget.getWidgets(form_container, context)
        }

	function validateName(name, allowPeriod) {
	    var illChars = allowPeriod ? '0123456789!@#$%^&*()_+=[]\\/{}|\"<>? ' :  '0123456789!@#$%^&*()_+=[]\\/{}|\"<>? ';
	    var isValid = true;
	    for (var i = 0; i < name.length; i++) {
	        if (illChars.indexOf(name.charAt(i)) != -1) {
			isValid = false;
		}
	    }

	    return isValid;
	}

        function getData(form_container, fields) {
            var widgets = flex_form_widget.getWidgets(form_container, fields),
                data = {};
            return widgets.first_name_field.val().trim().length > 0 && (data.first_name = widgets.first_name_field.val()), widgets.last_name_field.val().trim().length > 0 && (data.last_name = widgets.last_name_field.val()), widgets.email_field.val().trim().length > 0 && (data.email = widgets.email_field.val()), widgets.phone_field.length > 0 && widgets.phone_field.val().trim().length > 0 && (data.phone = widgets.phone_field.val()), widgets.street_field.length > 0 && widgets.street_field.val().trim().length > 0 && (data.street = widgets.street_field.val()), widgets.city_field.length > 0 && widgets.city_field.val().trim().length > 0 && (data.city = widgets.city_field.val()), widgets.state_field.length > 0 && widgets.state_field.val().trim().length > 0 && (data.state = widgets.state_field.val()), widgets.country_field.length > 0 && widgets.country_field.val().trim().length > 0 && (data.country = widgets.country_field.val()), widgets.zip_field.val().trim().length > 0 && (data.zip = widgets.zip_field.val()), widgets.password_field.length > 0 && widgets.password_field.val().trim().length > 0 && (data.password = widgets.password_field.val()), widgets.gender_field[0].selectedIndex != -1 && (data.gender = widgets.gender_field[0].selectedIndex), widgets.role_field.length > 0 && (data.role = widgets.role_field.val()), widgets.dob_field.length > 0 && (data.dob = widgets.dob_field.val()), widgets.opt_field.prop("checked") && (data.opt = !0), data
        }

        function setValues(form_container, user, fields) {
            var widgets = flex_form_widget.getWidgets(form_container, fields);
            widgets.first_name_field.val(user.first_name), widgets.last_name_field.val(user.last_name), widgets.email_field.val(user.email), widgets.phone_field.val(user.phone), widgets.street_field.val(user.address ? user.address.street : ""), widgets.city_field.val(user.address ? user.address.city : ""), widgets.state_field.val(user.address ? user.address.state : ""), widgets.zip_field.val(user.address ? user.address.zip : ""), widgets.dob_field.val(user.dob), widgets.gender_field[0].selectedIndex = user.gender, widgets.country_field.val(user.address && user.address.country ? user.address.country : "USA"), user.dob && 0 != user.dob.length ? widgets.dob_field.removeClass("empty") : widgets.dob_field.addClass("empty"), widgets.role_field.length > 0 && widgets.role_field.val(user.role), widgets.opt_field.prop("checked", user.opt)
        }

        function clear(form_container, fields) {
            var widgets = flex_form_widget.getWidgets(form_container, fields);
            widgets.first_name_field.val(""), widgets.last_name_field.val(""), widgets.email_field.val(""), widgets.phone_field.val(""), widgets.street_field.val(""), widgets.city_field.val(""), widgets.state_field.val(""), widgets.country_field.val("USA"), widgets.zip_field.val(""), widgets.gender_field[0].selectedIndex = 0, widgets.password_field.val(""), widgets.dob_field.val(""), widgets.dob_field.addClass("empty"), widgets.opt_field.prop("checked", !1)
        }

        function validate(form_container, options, fields) {
            var widgets = flex_form_widget.getWidgets(form_container, fields),
                data = getData(form_container, fields),
                error_strings = [];
            return widgets.terms_field.removeClass("checkbox-error"), Object.keys(widgets).forEach(function(widget_key) {
                widgets[widget_key].removeClass("error-field")
            }), options.show_email && options.email_enabled && ("undefined" == typeof data.email ? (widgets.email_field.addClass("error-field"), error_strings.push("email is required")) : general_util.validateEmail(data.email) || (widgets.email_field.addClass("error-field"), error_strings.push("invalid email address"))), ("undefined" == typeof data.first_name ? (widgets.first_name_field.addClass("error-field"), error_strings.push("first name is required")) : validateName(data.first_name, true) || (widgets.first_name_field.addClass("error-field"), error_strings.push("invalid first name"))), ("undefined" == typeof data.last_name ?  (widgets.last_name_field.addClass("error-field"), error_strings.push("last name is required")) : validateName(data.last_name, false) || (widgets.last_name_field.addClass("error-field"), error_strings.push("invalid last name"))), ("undefined" == typeof data.dob || 0 == data.dob.trim().length) && (widgets.dob_field.addClass("error-field"), error_strings.push("date of birth is required")), "undefined" == typeof data.zip ? (widgets.zip_field.addClass("error-field"), error_strings.push("postal code is required")) : general_util.validateZip("USA" == data.country, "CAN" == data.country, data.zip) || (widgets.zip_field.addClass("error-field"), error_strings.push("USA" == data.country ? "a valid 5 or 9 digit zip code is required" : "CAN" == data.country ? "a valid Canadian postal code is required" : "a valid postal code is required")), "undefined" != typeof data.phone && data.phone.length > 0 && !general_util.validatePhoneNumber(data.phone) && (widgets.phone_field.addClass("error-field"), error_strings.push("if a phone number is provided, it must be in DDD-DDD-DDDD format")), widgets.password_field.length > 0 && options.password_required && "undefined" == typeof data.password && (widgets.password_field.addClass("error-field"), error_strings.push("password is required")), widgets.terms_field.length > 0 && !widgets.terms_field.prop("checked") && (widgets.terms_field.parent().addClass("checkbox-error"), error_strings.push("You must read and agree to the terms and conditions before registering.")), error_strings
        }
        var roles = [{
            value: "admin",
            text: "admin"
        }, {
            value: "action-admin",
            text: "action-admin"
        }, {
            value: "brand-manager",
            text: "brand-manager"
        }, {
            value: "user",
            text: "user"
        }];
        return {
            init: init,
            getWidgets: getWidgets,
            getData: getData,
            validate: validate,
            setValues: setValues,
            clear: clear,
            onTermsClicked: onTermsClicked,
            onDOBHelpClick: onDOBHelpClick
        }
    }(),
    profile_image_widget = function() {
        function init(container, user, onSelection) {
            var user_copy = JSON.parse(JSON.stringify(user));
            "undefined" != typeof user.image_url && null != user_copy.image_url && (user_copy.image_url = user_copy.image_url.replace(/^https:\/\//i, "http://")), container.html(modal_template({
                user: user_copy
            })), container.find(".profile-image-widget").click(function() {
                onSelection($(this).data("type"))
            })
        }
        var modal_template_def = '<div class="profile-image-widget"> <img {{?it.user.image_url}}src="{{=it.user.image_url}}"{{??}}src="img/upload-image.png"{{?}}></div>',
            modal_template = doT.template(modal_template_def);
        return {
            init: init
        }
    }(),
    select_message_type_widget = function() {
        function init(container, onSelection) {
            container.html(modal_template({})), container.find("button").click(function() {
                container.find("button").removeClass("active"), $(this).addClass("active"), onSelection && onSelection($(this).data("type"))
            })
        }

        function getSelected(container) {
            var selected = container.find("button.active");
            return 0 == selected.length ? void 0 : selected.data("type")
        }

        function clearSelection(container) {
            container.find("button").removeClass("active")
        }
        var modal_template_def = '<div class="btn-group"><button type="button" class="btn btn-action" data-type="comment">Comment</button><button type="button" class="btn btn-action" data-type="complaint">Complaint</button><button type="button" class="btn btn-action" data-type="question">Question</button></div>',
            modal_template = doT.template(modal_template_def);
        return {
            init: init,
            getSelected: getSelected,
            clearSelection: clearSelection
        }
    }(),
    settings_manager = function() {
        function init() {
            var settings = window.localStorage.getItem("settings");
            return ("undefined" == typeof settings || null == settings) && (settings = JSON.stringify(default_settings), window.localStorage.setItem("settings", settings)), JSON.parse(settings)
        }

        function get() {
            var settings_string = window.localStorage.getItem("settings");
            return "undefined" == typeof settings_string || null == settings_string ? init() : $.extend({}, default_settings, JSON.parse(settings_string))
        }

        function save(settings) {
            window.localStorage.setItem("settings", JSON.stringify(settings))
        }

        function clear() {
            window.localStorage.removeItem("settings")
        }
        var default_settings = {
            has_entered_basic_info: !1,
            show_instructions_once: !0,
            has_allowed_directions: !1,
            product_auto_messages: {},
            brand_auto_messages: {},
            recent_searches: [],
            recent_searches_limit: 10,
            recent_products: [],
            recent_products_limit: 10
        };
        return {
            init: init,
            clear: clear,
            get: get,
            save: save
        }
    }(),
    star_rating_handler = function() {
        function init(container, page, remote_url) {
            $.ajax({
                type: "GET",
                url: remote_url + "/feedback?type=rating&page=" + page
            }).success(function(data) {
                var value = 0;
                data && data.value && (value = data.value), displayValue(container, page, remote_url, value)
            }).error(function(data, text) {
                console.log("failed to get rating: " + text)
            })
        }

        function displayValue(container, page, remote_url, value) {
            star_rating_widget.init(container, {
                value: value,
                on_selected: function(value_selected) {
                    loading_modal.show(), $.ajax({
                        type: "PUT",
                        url: remote_url + "/feedback",
                        data: {
                            type: "rating",
                            platform: "web",
                            page: page,
                            value: value_selected
                        }
                    }).success(function() {
                        loading_modal.hide(), init(container, page, remote_url);
                        if(navigator.connection.type == "none")
                        {
                            alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                            return;
                        }
                        alert_modal.show("Success", "Feedback sent!")
                    }).error(function(data) {
                        loading_modal.hide(), window.alert("An error occurred: " + data.responseText)
                    })
                }
            })
        }
        return {
            init: init
        }
    }(),
    survey_widget = function() {
        function init(container, options) {
            var _options = {
                remoteUrl: "",
                surveys: [],
                onBeforeAnswer: function() {},
                onAnswered: function() {},
                onDeclined: function() {}
            };
            _options = $.extend({}, _options, options);
            var now_utc = moment.utc().valueOf();
            return _options.surveys = _options.surveys.filter(function(survey) {
                return survey.after && now_utc < survey.after ? !1 : survey.before && now_utc > survey.before ? !1 : !0
            }), 0 != _options.surveys.length ? "app-sentiment" == _options.surveys[0].type ? (_options.survey = _options.surveys[0], void _initAppSentimentSurvey(container, _options)) : "resolved-sentiment" == _options.surveys[0].type ? (_options.survey = _options.surveys[0], void _initResolvedSentimentSurvey(container, _options)) : void 0 : void 0
        }

        function _initAppSentimentSurvey(container, options) {
            if (container.html('<div class="title-text text-center"></div><div class="rating-contents"></div>'), 0 != options.survey.questions.length) {
                var title_text = "";
                options.survey.title && (title_text = options.survey.title.trim()), container.find(".title-text").html(title_text);
                var emoticon_questions = options.survey.questions.filter(function(question) {
                    return "emoticons" == question.type
                });
                emoticon_questions.length > 0 && rating_widget.init(container.find(".rating-contents"), {
                    stars: [{
                        rating_classes: "fa fa-frown-o fa-2x",
                        rating_style: "color: red; text-shadow: 0 0 1px #333"
                    }, {
                        rating_classes: "fa fa-meh-o fa-2x",
                        rating_style: "color: #ffdd00; text-shadow: 0 0 1px #333;"
                    }, {
                        rating_classes: "fa fa-smile-o fa-2x",
                        rating_style: "color: #00dd00; text-shadow: 0 0 1px #333"
                    }],
                    onSelected: function(star_index) {
                        container.html(""), single_input_modal.show("Thank you!", emoticon_questions[0].text, "text", function(value) {
                            _sendSentimentSurvey(options, star_index, value)
                        }, function() {
                            _sendSentimentSurvey(options, star_index, "")
                        }, function() {})
                    }
                })
            }
        }

        function _sendSentimentSurvey(options, value, text) {
            var answers = [{
                extra: value,
                text: text
            }];
            options.onBeforeAnswer(answers), $.ajax({
                type: "PUT",
                url: options.remoteUrl + "/survey/" + options.survey._id + "/response",
                data: {
                    answers: answers
                }
            }).success(function() {
                options.onAnswered(options.survey, answers)
            }).error(function(data) {
                if(navigator.connection.type == "none")
                {
                    alert_modal.show("Error","Unable to communicate with the server. Please check your data connection.");
                    return;
                }
                alert_modal.show("Error", "An error occurred: " + data.responseText)
            })
        }

        function _initResolvedSentimentSurvey(container, options) {
            if (container.html('<div class="title-text text-center"></div><div class="rating-contents  text-center"></div>'), 0 != options.survey.questions.length) {
                var title_text = "";
                options.survey.title && (title_text = options.survey.title.trim()), container.find(".title-text").html(title_text);
                var emoticon_questions = options.survey.questions.filter(function(question) {
                    return "emoticons" == question.type
                });
                emoticon_questions.length > 0 && rating_widget.init(container.find(".rating-contents"), {
                    stars: [{
                        rating_classes: "fa fa-frown-o fa-2x",
                        rating_style: "margin-right: 5px; color: red; text-shadow: 0 0 1px #333"
                    }, {
                        rating_classes: "fa fa-meh-o fa-2x",
                        rating_style: "margin-right: 5px; color: #ffdd00; text-shadow: 0 0 1px #333;"
                    }, {
                        rating_classes: "fa fa-smile-o fa-2x",
                        rating_style: "margin-right: 5px; color: #00dd00; text-shadow: 0 0 1px #333"
                    }],
                    onSelected: function(star_index) {
                        single_input_modal.show("Thank you!", "Please share more to help action! improve", "text", function(value) {
                            _sendSentimentSurvey(options, star_index, value)
                        }, function() {
                            _sendSentimentSurvey(options, star_index, "")
                        }, function() {})
                    }
                })
            }
        }
        return {
            init: init
        }
    }(),
    user_image_selection_widget = function() {
        function init(container, options_in) {
            var options = $.extend({}, default_options, options_in);
            container.html(template_instance(options)), container.find(".facebook-button").click(function() {
                app.caller.image_url = options.user.facebook_data.picture.data.url, options.onSelection(app.caller.image_url);
                var url = app_util.getRemoteUrl() + "/user/" + app.caller._id;
                app_util.makeRequest("POST", url, app.caller, "Updating", function() {
                    options.onComplete(app.caller.image_url)
                }, function(e) {
                    options.onError("an error occurred: " + e.responseText)
                })
            }), container.find(".google-button").click(function() {
                app.caller.image_url = options.user.google_data.image.url, options.onSelection(app.caller.image_url);
                var url = app_util.getRemoteUrl() + "/user/" + app.caller._id;
                app_util.makeRequest("POST", url, app.caller, "Updating", function() {
                    options.onComplete(app.caller.image_url)
                }, function(e) {
                    options.onError("an error occurred: " + e.responseText)
                })
            }), container.find(".gallery-button").click(function() {
                "undefined" != typeof platform_util && platform_util.isMobile() ? navigator.camera.getPicture(function(data) {
                    options.onSelection(data), progress_modal.show();
                    window.resolveLocalFileSystemURL(data, function(fileEntry) {

                        fileEntry.file(function(metadata) {
                            /*
                            metadata.fullPath = data.replace("file://","");
                            metadata.type = "image/jpeg";
                            console.log(metadata);*/
                            console.log(metadata);
                            if(metadata.size > options.max_size){
                                progress_modal.hide();
                                alert_modal.show("Error","File Size exceed size limit, choose another file");

                                return false;
                            }
                            var url = app_util.getRemoteUrl() + "/user/" + app.caller._id + "/content",
                                name = data.replace(/^.*[\\\/]/, "");
                            name = (new Date).getTime() + "." + name.split(".").pop(), name.split("?").length > 0 && (name = name.split("?")[0]);
                            var media_file = {
                                fullPath: data,
                                name: name
                            };

                            capture_util.uploadFile(url, media_file, {}, _onProgressEvent, function(err_upload, upload_result) {
                                return progress_modal.hide(), err_upload ? void options.onError("upload failed: " + err_upload.body) : (console.log("Upload success: " + upload_result.responseCode), console.log(upload_result.bytesSent + " bytes sent"), app.caller.image_url = upload_result.response, url = app_util.getRemoteUrl() + "/user/" + app.caller._id, void app_util.makeRequest("POST", url, app.caller, "Updating", function() {
                                    options.onComplete(data)
                                }, function(e) {
                                    options.onError("an error occurred: " + e.responseText)
                                }))
                            })
                        });

                    },function(error){console.log(error)});

                }, function(error) {
                    options.onError(error)
                }, {
                    sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
                    targetWidth: 256,
                    targetHeight: 256
                }) : options.onError("NOT IMPLEMENTED FOR NON-MOBILE PLATFORM")
            }), container.find(".camera-button").click(function() {
                "undefined" != typeof platform_util && platform_util.isMobile() ? navigator.camera.getPicture(function(data) {
                    options.onSelection(data), progress_modal.show();
                    var url = app_util.getRemoteUrl() + "/user/" + app.caller._id + "/content",
                        name = data.replace(/^.*[\\\/]/, "");
                    name = (new Date).getTime() + "." + name.split(".").pop(), name.split("?").length > 0 && (name = name.split("?")[0]);
                    var media_file = {
                        fullPath: data,
                        name: name
                    };
                    capture_util.uploadFile(url, media_file, {}, _onProgressEvent, function(err_upload, upload_result) {
                        return progress_modal.hide(), err_upload ? void options.onError("upload failed: " + err_upload.body) : (console.log("Upload success: " + upload_result.responseCode), console.log(upload_result.bytesSent + " bytes sent"), app.caller.image_url = upload_result.response, url = app_util.getRemoteUrl() + "/user/" + app.caller._id, void app_util.makeRequest("POST", url, app.caller, "Updating", function() {
                            options.onComplete(data)
                        }, function(e) {
                            options.onError("an error occurred: " + e.responseText)
                        }))
                    })
                }, function(error) {
                    options.onError(error)
                }, {
                    sourceType: Camera.PictureSourceType.CAMERA,
                    targetWidth: 256,
                    targetHeight: 256
                }) : options.onError("NOT IMPLEMENTED FOR NON-MOBILE PLATFORM")
            });
        }

        function _onProgressEvent(evt) {
            progress_modal.setProgress({
                loaded: evt.loaded,
                total: evt.total
            })
        }
        var default_options = {
                user: null,
                onSelection: function() {},
                onComplete: function() {},
                onError: function() {},
                rootUrl: "/"
            },

            template_ref = '<div class="user-image-selection-widget">{{?it.user && it.user.facebook_data && it.user.facebook_data.picture && it.user.facebook_data.picture.data && it.user.facebook_data.picture.data.url}}<button class="facebook-button">Use FB Image</button>{{?}}{{?it.user && it.user.google_data && it.user.google_data.image && it.user.google_data.image.url}}<button class="google-button">Use Google Plus Image</button>{{?}}<button class="gallery-button">From Gallery</button> <button class="camera-button" style="margin-left:10px;">Use Camera</button></div>',

            template_instance = doT.template(template_ref);
        return {
            init: init
        }
    }(),
    share_video_selection_widget = function() {
        function init(container, options_in, capture_func, select_video) {
            var options = $.extend({}, default_options, options_in,capture_func);
            //alert(cordova.file.externalRootDirectory);
            container.html(template_instance(options)),container.find(".gallery-button").click(function() {
                "undefined" != typeof platform_util && platform_util.isMobile() ? navigator.camera.getPicture(function(data) {
                    //options.onSelection(data), progress_modal.show();
                    var url = app_util.getRemoteUrl() + "/user/" + app.caller._id + "/content",
                        name = data.replace(/^.*[\\\/]/, "");
                    name = (new Date).getTime() + "." + name.split(".").pop(), name.split("?").length > 0 && (name = name.split("?")[0]);
                    var media_file = {
                        fullPath: data,
                        name: name
                    };
                    strdata = data.replace("private/","");

                    videodataURL = decodeURIComponent(data).split(":")[2];
                    if(data.indexOf("com.google.android.apps.docs.storage") > 0){
                        options.onError("Please download your content from Google Drive to your local device to attach.");
                        //alert_modal.show("Error","Please download your content from Google Drive to your local device to attach.");
                        return;
                    }
                    console.log(videodataURL);
                    if(device.platform != 'iOS'){
                        window.FilePath.resolveNativePath(strdata, function(uri){
                            var fileURI = uri;
                            if(uri.indexOf("file://") < 0) {
                                fileURI = "file://" + uri;
                            }
                            console.log(fileURI);
                            window.resolveLocalFileSystemURL(fileURI, function (fileEntry) {
                                console.log("filepath-entry");
                                fileEntry.file(function (metadata) {
                                    metadata.type = "video/quicktime";
                                    var text = "";
                                    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                                    for (var j = 0; j < 10; j++)
                                        text += possible.charAt(Math.floor(Math.random() * possible.length));

                                    metadata.name = "video" + text + ".mov"
                                    obj = [metadata];
                                    select_video(obj);
                                }, function(error){
                                    window.resolveLocalFileSystemURL(strdata, function (fileEntry) {
                                        console.log("filepath-fileentry-error");
                                        fileEntry.file(function (metadata) {
                                            metadata.type = "video/quicktime";
                                            var text = "";
                                            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                                            for (var j = 0; j < 10; j++)
                                                text += possible.charAt(Math.floor(Math.random() * possible.length));

                                            metadata.name = "video" + text + ".mov"
                                            obj = [metadata];
                                            select_video(obj);
                                        });
                                    }, function (error) {
                                        console.log(error);
                                    });
                                });
                            }, function (error) {
                                console.log(error);
                            });
                        },function(error){

                            var fileURI = "";
                            if(strdata.indexOf("externalstorage.documents/") > 0) {
                                fileURI = "file:///storage/external_SD/" + videodataURL;

                            } else {
                                fileURI = "file:///storage/emulated/0" + videodataURL;
                            }
                            window.resolveLocalFileSystemURL(fileURI, function (fileEntry) {
                                console.log("filepath-entry");
                                fileEntry.file(function (metadata) {
                                    metadata.type = "video/quicktime";
                                    var text = "";
                                    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                                    for (var j = 0; j < 10; j++)
                                        text += possible.charAt(Math.floor(Math.random() * possible.length));

                                    metadata.name = "video" + text + ".mov"
                                    obj = [metadata];
                                    select_video(obj);
                                });
                            }, function (error) {
                                window.resolveLocalFileSystemURL(strdata, function (fileEntry) {
                                    console.log("filepath-entry");
                                    fileEntry.file(function (metadata) {
                                        metadata.type = "video/quicktime";
                                        var text = "";
                                        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                                        for (var j = 0; j < 10; j++)
                                            text += possible.charAt(Math.floor(Math.random() * possible.length));

                                        metadata.name = "video" + text + ".mov"
                                        obj = [metadata];
                                        select_video(obj);
                                    });
                                }, function (error) {
                                    console.log(error);
                                })
                            });
                        });
                    } else {
                        window.resolveLocalFileSystemURL(strdata, function (fileEntry) {
                            console.log("filepath-entry");
                            fileEntry.file(function (metadata) {
                                metadata.type = "video/quicktime";
                                var text = "";
                                var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                                for (var j = 0; j < 10; j++)
                                    text += possible.charAt(Math.floor(Math.random() * possible.length));

                                metadata.name = "video" + text + ".mov"
                                obj = [metadata];
                                select_video(obj);
                            });
                        }, function (error) {
                            console.log(error);
                        })
                    }

                    /*
                    window.resolveLocalFileSystemURL(strdata, function (fileEntry) {
                        //alert(JSON.stringify(fileEntry));
                        alert(fileEntry.toURL());

                        fileEntry.file(function (metadata) {
                            alert("resolve-entry");
                            metadata.type = "video/quicktime";
                            var text = "";
                            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                            for (var j = 0; j < 10; j++)
                                text += possible.charAt(Math.floor(Math.random() * possible.length));


                            metadata.name = "video" + text + ".mov";
                            alert(JSON.stringify(metadata));
                            obj = [metadata];

                            select_video(obj);
                        }, function(error){
                            alert("first");
                            alert(JSON.stringify(error));
                            alert(JSON.stringify(window.FilePath));
                            window.FilePath.resolveNativePath(strdata, function(uri){

                                var fileURI = uri;
                                if(uri.indexOf("file://") < 0) {
                                    fileURI = "file://" + uri;
                                }
                                alert(fileURI);
                                window.resolveLocalFileSystemURL(fileURI, function (fileEntry) {
                                    alert("filepath-entry");
                                    fileEntry.file(function (metadata) {
                                            metadata.type = "video/quicktime";
                                            var text = "";
                                            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                                            for (var j = 0; j < 10; j++)
                                                text += possible.charAt(Math.floor(Math.random() * possible.length));

                                            metadata.name = "video" + text + ".mov"
                                            obj = [metadata];
                                            select_video(obj);
                                        });
                                    }, function (error) {
                                        console.log(error);
                                    });
                            }, function(error){
                                fileURL = "file:///storage/external_SD/" + videodataURL;
                                alert(fileURL);
                                window.resolveLocalFileSystemURL(fileURL, function (fileEntry) {

                                    fileEntry.file(function (metadata) {
                                        alert("resolve-sd");
                                        metadata.type = "video/quicktime";
                                        var text = "";
                                        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                                        for (var j = 0; j < 10; j++)
                                            text += possible.charAt(Math.floor(Math.random() * possible.length));


                                        metadata.name = "video" + text + ".mov";
                                        alert(JSON.stringify(metadata));
                                        obj = [metadata];

                                        select_video(obj);
                                    });
                                });

                            });
                        });
                    }, function (error) {
                        alert("second");
                        alert(JSON.stringify(error));
                        window.FilePath.resolveNativePath(data, function(uri){

                            var fileURI = uri;
                            if(uri.indexOf("file://") < 0) {
                                fileURI = "file://" + uri;
                            }
                            alert(fileURI);
                            window.resolveLocalFileSystemURL(fileURI, function (fileEntry) {
                                alert("filepath-entry");
                                fileEntry.file(function (metadata) {
                                        metadata.type = "video/quicktime";
                                        var text = "";
                                        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                                        for (var j = 0; j < 10; j++)
                                            text += possible.charAt(Math.floor(Math.random() * possible.length));

                                        metadata.name = "video" + text + ".mov"
                                        obj = [metadata];
                                        select_video(obj);
                                    });

                                }, function (error) {
                                    console.log(error);
                                });
                        });
                    });*/
                        /*
                        window.FilePath.resolveNativePath(data, function(uri){
                            alert(uri);
                            var fileURI = uri;
                            if(uri.indexOf("file://") < 0) {
                                fileURI = "file://" + uri;
                            }
                            alert(fileURI);
                            window.resolveLocalFileSystemURL(fileURI, function (fileEntry) {

                                fileEntry.file(function (metadata) {
                                    metadata.type = "video/quicktime";
                                    var text = "";
                                    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                                    for (var j = 0; j < 10; j++)
                                        text += possible.charAt(Math.floor(Math.random() * possible.length));

                                    metadata.name = "video" + text + ".mov"
                                    obj = [metadata];
                                    select_video(obj);
                                });

                            }, function (error) {
                                alert("2nd error");
                                alert(error.code);
                            });
                            var fileURL="";
                            if(uri.indexOf("/storage/emulated/") == -1){
                                fileURL = "cdvfile://localhost" + uri.replace("/storage","")
                            }
                            //fileURL = "cdvfile://localhost/persistent/DCIM/Camera/20160119_040210.mp4";
                            //fileURL = "cdvfile://localhost//persistent/DCIM/Camera/20160104_191021.mp4";
                            alert(fileURL);
                            window.resolveLocalFileSystemURL(fileURL, function (fileEntry) {

                                fileEntry.file(function (metadata) {
                                    metadata.type = "video/quicktime";
                                    var text = "";
                                    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                                    for (var j = 0; j < 10; j++)
                                        text += possible.charAt(Math.floor(Math.random() * possible.length));


                                    metadata.name = "video" + text + ".mov"
                                    obj = [metadata];
                                    select_video(obj);
                                });

                            }, function (error) {
                                alert("cdv error");
                                alert(error.code);
                            });
                        }, function(err){console.log(err)});
                        */

                }, function(error) {
                    options.onError(error)
                }, {
                    sourceType: 0,
                    destinationType : 1,
                    mediaType : 1
                }) : options.onError("NOT IMPLEMENTED FOR NON-MOBILE PLATFORM")
            }), container.find(".camera-button").click(function() {
                capture_func();
                "undefined" != typeof platform_util && platform_util.isMobile() ? navigator.camera.getPicture(function(data) {
                    options.onSelection(data), progress_modal.show();
                    var url = app_util.getRemoteUrl() + "/user/" + app.caller._id + "/content",
                        name = data.replace(/^.*[\\\/]/, "");
                    name = (new Date).getTime() + "." + name.split(".").pop(), name.split("?").length > 0 && (name = name.split("?")[0]);
                    var media_file = {
                        fullPath: data,
                        name: name
                    };

                    /*
                     capture_util.uploadFile(url, media_file, {}, _onProgressEvent, function(err_upload, upload_result) {
                     return progress_modal.hide(), err_upload ? void options.onError("upload failed: " + err_upload.body) : (console.log("Upload success: " + upload_result.responseCode), console.log(upload_result.bytesSent + " bytes sent"), app.caller.image_url = upload_result.response, url = app_util.getRemoteUrl() + "/user/" + app.caller._id, void app_util.makeRequest("POST", url, app.caller, "Updating", function() {
                     options.onComplete(data)
                     }, function(e) {
                     options.onError("an error occurred: " + e.responseText)
                     }))
                     })
                     */
                }, function(error) {
                    options.onError(error)
                }, {
                    sourceType: Camera.PictureSourceType.CAMERA,
                    targetWidth: 256,
                    targetHeight: 256
                }) : options.onError("NOT IMPLEMENTED FOR NON-MOBILE PLATFORM")
            });
        }

        function _onProgressEvent(evt) {
            progress_modal.setProgress({
                loaded: evt.loaded,
                total: evt.total
            })
        }
        var default_options = {
                user: null,
                onSelection: function() {},
                onComplete: function() {},
                onError: function() {},
                rootUrl: "/"
            },
            template_ref = '<div class="share_video-selection-widget"><button class="gallery-button">From Gallery</button> <button class="camera-button">Use Camera</button></div>',
            template_instance = doT.template(template_ref);
        return {
            init: init
        }
    }(),
    share_image_selection_widget = function() {
        function init(container, options_in, capture_func, select_image) {
            var options = $.extend({}, default_options, options_in,capture_func);
            container.html(template_instance(options)),container.find(".gallery-button").click(function() {
                if("undefined" != typeof platform_util && platform_util.isMobile())
                    {
                        if((window.device.platform == "Android" || device.platform == "Android") && (window.device.version[0] >= "5" || device.version[0] >= "5")){
                            navigator.camera.getPicture(function(data) {

                                FileIO.fromdataurl(data, function () {
                                    obj = [hs_metadata];

                                    select_image(obj);
                                });
                            }, function(error) {
                                options.onError(error)
                            }, {
                                sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
                                destinationType : 0,
                                mediaType : 0
                            })
                        }
                        else{
                            navigator.camera.getPicture(function(data) {
                                if(device.platform == "Android" || window.device.platform == "Android") {
                                    FileIO.updateCameraImages(data, function () {
                                        obj = [hs_metadata];
                                        select_image(obj);
                                    });
                                }
                                else
                                {
                                    window.resolveLocalFileSystemURL(data, function(fileEntry) {

                                        fileEntry.file(function(metadata) {
                                            metadata.fullPath = data.replace("file://","");
                                            metadata.type = "image/jpeg";
                                            obj = [metadata];
                                            select_image(obj);
                                        });

                                    },function(error){console.log(error)});
                                }
                            }, function(error) {
                                options.onError(error)
                            }, {
                                sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
                                destinationType : 1,
                                mediaType : 0
                            })
                        }

                    }

                else {
                    options.onError("NOT IMPLEMENTED FOR NON-MOBILE PLATFORM")
                }
            }), container.find(".camera-button").click(function() {
                capture_func();
            });
        }

        function _onProgressEvent(evt) {
            progress_modal.setProgress({
                loaded: evt.loaded,
                total: evt.total
            })
        }
        var default_options = {
                user: null,
                onSelection: function() {},
                onComplete: function() {},
                onError: function() {},
                rootUrl: "/"
            },
            template_ref = '<div class="share_video-selection-widget"><button class="gallery-button">From Gallery</button> <button class="camera-button">Use Camera</button></div>',
            template_instance = doT.template(template_ref);
        return {
            init: init
        }
    }(),
    view_attachments_widget = function() {
        function init(options_in) {
            var options = $.extend({}, default_options, options_in);
            options.container.html(widget_template({
                files: options.files,
                allow_remove: options.allow_remove
            })), options.container.find(".video").click(function() {
                return window.open($(this).data("url"), "_system"), !1
            }), options.container.find(".audio").click(function() {
                return window.open($(this).data("url"), "_system"), !1
            }), options.container.find(".remove").click(function() {
                return options.onRemoveFile(options.files[$(this).data("index")]), !1
            }), console.log(options.files)
        }
        var default_options = {
                container: null,
                files: [],
                allow_remove: !1,
                onRemoveFile: function() {}
            },
            widget_template_def = '<div class="view-attachments-widget">{{~it.files :file_info:file_index}}<div class="attachment-item">{{?file_info.type && file_info.type.indexOf("image") == 0}}<img data-type="{{=file_info.type}}" src="{{=general_util.processImageLink(file_info.link)}}">{{??file_info.type && file_info.type.indexOf("video") == 0}}<div class="video" data-url="{{=file_info.link}}"><i class="glyphicon glyphicon-film"></i></div>{{??}}<div class="audio" data-url="{{=file_info.link}}"><i class="glyphicon glyphicon-headphones"></i></div>{{?}}{{?it.allow_remove}}<div class="remove" data-index="{{=file_index}}"><i class="glyphicon glyphicon-remove"></i></div>{{?}}</div>{{?file_index < it.files.length - 1}}<hr>{{?}}{{~}}</div>',
            widget_template = doT.template(widget_template_def);
        return {
            init: init
        }
    }(),
    wilke_enlight_util = function() {
        function init() {}

        function loadCategories(base_url, brand_id, wilke_config, callback2) {
            var url = base_url + "/faq/enlight/" + wilke_config.enlight_tenant + "/categories";
            url += "?view=" + wilke_config.view_id + "&doctype=" + wilke_config.doc_type_id + "&brand=" + brand_id, $.ajax({
                type: "GET",
                url: url
            }).success(function(data) {
                return "undefined" == typeof data.rows || 0 == data.rows.length ? void callback2("No FAQ data was found") : void callback2(null, data.rows)
            }).error(function() {

                callback2("Failed to retrieve FAQ data")
            })
        }

        function getCategory(base_url, wilke_config, category_code, callback2) {
            var url = base_url + "/faq/enlight/" + wilke_config.enlight_tenant + "/category/" + category_code;
            url += "?view=" + wilke_config.view_id + "&doctype=" + wilke_config.doc_type_id + "&brand_keyword=" + wilke_config.brand_keyword, $.ajax({
                type: "GET",
                url: url
            }).success(function(data) {
                return "undefined" != typeof data.errMsg && data.errMsg ? void callback2(data.errMsg) : "undefined" != typeof data.rows && data.rows && 0 != data.rows.length ? void callback2(null, data) : void callback2("No category FAQ data was found")
            }).error(function() {
                callback2("Failed to retrieve FAQ category data")
            })
        }
        return {
            init: init,
            loadCategories: loadCategories,
            getCategory: getCategory
        }
    }(),
    accordion_widget = function() {
        function init(options_in) {
            "use strict";
            var options = $.extend(!0, {}, default_options, options_in);
            0 === options_in.items.length && (options.items = []), options.container.html(template(options)), options.delayBodyRendering && options.container.find("> .panel").on("shown.bs.collapse", function() {
                alert("open")
            })
        }

        function addItems(container, items) {
            "use strict";
            var template_options = {
                items: items,
                enabled: container.find(".panel-group").data("enabled"),
                isOneOpenAtATime: container.find(".panel-group").data("singleton")
            };
            container.find(".panel").append(items_template(template_options))
        }

        function removeItem(container, className) {
            container.find(".panel > div.panel-heading-" + className + ", .panel > div.collapse-" + className).remove()
        }

        function getBodyContainer(options, className) {
            return options.container.find(".panel-body-" + className)
        }

        function getHeaderWidgetContainer(options, className) {
            return options.container.find(".panel-heading-" + className).find(".header-widget-container")
        }

        function toggleCollapsed(container) {
            var data_toggle = container.find("> .panel > .panel-heading a[data-toggle=collapse]"),
                collapse_body = container.find("> .panel > .panel-collapse.collapse");
            collapse_body.collapse("toggle"), data_toggle.toggleClass("collapsed")
        }
        var default_options = {
                container: null,
                className: null,
                isOneOpenAtATime: !1,
                tabsInitiallyOpen: !0,
                isStriped: !1,
                enabled: !0,
                delayBodyRendering: !1,
                items: [{
                    title: "panel 1",
                    className: "panel1",
                    titleFunction: null,
                    bodyFunction: function() {
                        return ""
                    },
                    headFunction: function() {
                        return ""
                    }
                }]
            },
            items_template_def = '{{~it.items :item:item_index}}<div class="panel-heading  panel-heading-{{=item.className}}"><h4 class="panel-title">{{?it.isOneOpenAtATime}}<a {{?it.enabled}}data-toggle="collapse" data-parent=".{{=it.className}}" href=".collapse-{{=item.className}}" {{?}}class="{{?item_index != 0}}collapsed{{?}}">{{??}}<a {{?it.enabled}}data-toggle="collapse" href=".collapse-{{=item.className}}" {{?}}class="{{?!it.tabsInitiallyOpen}}collapsed{{?}}">{{?}}<i class="si si-downarrow"></i><span>{{?item.titleFunction}}{{=item.titleFunction()}}{{??}}{{=item.title}}{{?}}</span><div class="pull-right header-widget-container">{{?item.headFunction}}{{=item.headFunction()}}{{?}}</div></a></h4></div>{{?it.isOneOpenAtATime}}<div class="panel-collapse collapse {{?item_index == 0}}in {{?}}collapse-{{=item.className}}">{{??}}<div class="panel-collapse collapse {{?it.tabsInitiallyOpen}}in {{?}}collapse-{{=item.className}}">{{?}}<div class="panel-body panel-body-{{=item.className}}">{{?item.bodyFunction && !it.delayBodyRendering}}{{=item.bodyFunction()}}{{?}}</div></div>{{~}}',
            template_def = '<div class="panel-group accordion {{?it.isStriped}}striped{{?}} accordion-semi {{=it.className}}" data-singleton="{{=it.isOneOpenAtATime}}" data-enabled="{{=it.enabled}}"><div class="panel panel-default">' + items_template_def + "</div></div>",
            template = doT.template(template_def),
            items_template = doT.template(items_template_def);
        return {
            init: init,
            addItems: addItems,
            removeItem: removeItem,
            getHeaderWidgetContainer: getHeaderWidgetContainer,
            getBodyContainer: getBodyContainer,
            toggleCollapsed: toggleCollapsed
        }
    }(),
    alert_modal = function() {
        function show(title, text, onComplete) {
            var dialog = $(_modalClassName),
                okButton = dialog.find("button.btn-ok");
            var settings = settings_manager.get();
            settings.modal_instance = _modalClassName;
            settings_manager.save(settings);
            okButton.unbind("click"), "undefined" != typeof onComplete && okButton.click(function() {
                hide(), onComplete()
            }), dialog.modal({
                show: !1,
                keyboard: !1,
                backdrop: "static"
            }), dialog.find(".modal-body > p").html(text), dialog.find(".modal-header > h4").html(title), dialog.modal("show")
        }

        function showFromXHR(title, xhr, onComplete) {
            return "undefined" != typeof xhr.responseText && xhr.responseText.length > 0 ? void show(title, xhr.responseText, onComplete) : 404 == xhr.responseCode ? void show(title, "not found", onComplete) : void show(title, "response code: " + xhr.responseCode)
        }

        function hide() {
            var settings = settings_manager.get();
            settings.modal_instance = undefined;
            settings_manager.save(settings);
            $(_modalClassName).modal("hide")

        }

        function getHtml() {
            return doT.template(alert_modal_template_def)({})
        }

        function get() {
            return $(_modalClassName)
        }
        var alert_modal_template_def = '<div class="modal-alert modal"><div class="modal-content"><div class="modal-header"><button class="close" data-dismiss="modal" style="padding: 5px 10px 5px 15px;">x</button><h4></h4></div><div class="modal-body" style="overflow: auto;"><p></p></div><div class="modal-footer"><button data-dismiss="modal" class="btn-ok btn btn-warning">OK</button></div></div></div>',
            _modalClassName = ".modal-alert";
        return {
            show: show,
            hide: hide,
            showFromXHR: showFromXHR,
            getHtml: getHtml,
            get: get
        }
    }();
$(function() {
    $("body").append(alert_modal.getHtml())
});
var clock_widget = function() {
        function init(options_in) {
            function _updateTime() {
                var time_string;
                time_string = options.isUTC ? moment().utc().format(options.format) + "Z" : moment().format(options.format), clock_container.html(time_string)
            }
            var options = $.extend({}, default_options, options_in);
            options.container.html(template({}));
            var clock_container = options.container.find(".clock-widget");
            setInterval(_updateTime, 500), _updateTime()
        }
        var external_interface = {
                init: init
            },
            default_options = {
                container: null,
                isUTC: !1,
                format: "YYYY-MM-DD HH:mm:ss"
            },
            template_def = '<div class="clock-widget" title="Current time"></div>',
            template = doT.template(template_def);
        return external_interface
    }(),
    confirm_modal = function() {
        function setButtonClasses(cancelButtonClass, okButtonClass) {
            var dialog = $(_modalClassName);
            var settings = settings_manager.get();
            settings.modal_instance = _modalClassName;
            settings_manager.save(settings);
            _addedCancelClass.length > 0 && dialog.find("button.cancel").removeClass(_addedCancelClass), cancelButtonClass && (dialog.find("button.cancel").addClass(cancelButtonClass), _addedCancelClass = cancelButtonClass), _addedOkClass.length > 0 && dialog.find("button.submit").removeClass(_addedOkClass), okButtonClass && (dialog.find("button.submit").addClass(okButtonClass), _addedOkClass = okButtonClass)
        }

        function setButtonText(cancelButtonText, okButtonText) {
            var dialog = $(_modalClassName);
            dialog.find("button.cancel").text(cancelButtonText), dialog.find("button.submit").text(okButtonText)
        }

        function show(title, text, onOk, onCancel, onHidden) {
            var dialog = $(_modalClassName);
            dialog.modal({
                show: !1,
                keyboard: !1,
                backdrop: "static"
            }), dialog.find(".modal-body > p").html(text), dialog.find(".modal-header > h4").html(title), dialog.find("button.submit").unbind("click"), dialog.find("button.submit").click(function() {
                return hide(), onOk(), !1
            }), dialog.find("button.cancel").unbind("click"), dialog.find("button.cancel").click(function() {
                hide(), onCancel && onCancel()
            }), dialog.on("hidden.bs.modal", function() {
                onHidden && onHidden()
            }), dialog.modal("show")
        }

        function hide() {
            $(_modalClassName).modal("hide")
            var settings = settings_manager.get();
            settings.modal_instance = undefined;
            settings_manager.save(settings);
        }

        function getHtml() {
            return doT.template(confirm_modal_template_def)({})
        }
        var _modalClassName = ".modal-confirm",
            _addedCancelClass = "",
            _addedOkClass = "",
            confirm_modal_template_def = '<div class="modal-confirm modal fade" role="dialog"><div class="modal-dialog" style="background-color: #fff;"><div class="modal-header"><button class="close" data-dismiss="modal" style="padding: 5px 5px 5px 15px;">x</button><h4></h4></div><div class="modal-body"><p></p></div><div class="modal-footer"><button data-dismiss="modal" class="cancel btn">Cancel</button><button class="submit btn">Ok</button></div></div></div>';
        return {
            setButtonClasses: setButtonClasses,
            setButtonText: setButtonText,
            show: show,
            hide: hide,
            getHtml: getHtml
        }
    }();
$(function() {
    $("body").append(confirm_modal.getHtml())
});
var file_upload_widget = function() {
        function init(container, url, customizations, onSuccess, onFailure) {
            var options = $.extend({}, default_options, customizations);
            container.html(template(options));
            var widget = container.find("input");
            widget.unbind("change"), widget.change(function() {
                loading_modal.show("Loading...")
            }), container.fileupload({
                url: url,
                dataType: "json",
                pasteZone: null,
                error: function(e) {
                    200 == e.status ? (loading_modal.hide(), onSuccess(e)) : (loading_modal.hide(), onFailure(e))
                },
                done: function(e, data) {
                    loading_modal.hide(), onSuccess(data)
                }
            })
        }
        var template_def = '<span class="btn fileinput-button {{=it.buttonClasses}}"><i class="{{=it.iconClassString}}"></i><span>{{=it.text}}</span><input type="file" name="file"{{? it.multi}}multiple{{?}} data-sequential-uploads="false" class="fileupload {{=it.className}}"></span>',
            template = doT.template(template_def),
            default_options = {
                text: "",
                buttonClasses: "",
                iconClassString: "",
                multi: !0,
                className: ""
            };
        return {
            init: init
        }
    }(),
    flex_form_widget = function() {
        function init(container, options) {
            container.html(pagefn({
                fields: options.fields,
                caller: options.caller
            })), container.find('input[type="date"]').change(function() {
                console.log("detected a change on ios to date input"), $(this).val().length > 0 ? $(this).removeClass("empty") : $(this).addClass("empty")
            })
        }

        function getWidgets(form_container, fields) {
            var results = {};
            return fields.forEach(function(field) {
                results[field.property + "_field"] = form_container.find("." + field.property + "-field")
            }), results
        }
        var form_body_template = '{{##def.textfield: <div class="{{=field.spacing_class}} field">{{?field.field_icon}}<div class="{{=field.field_icon}} field-icon"></div>{{?}}{{?field.watermark}}<div class="{{=field.field_icon}} field-watermark"></div>{{?}}<input {{?!field.enabled}}disabled{{?}} class="form-control {{=field.property}}-field" {{?field.field_type}}type="{{=field.field_type}}"{{?}} data-id="" placeholder="{{=field.label}}">{{?field.field_icon_right}}{{?field.label_onclick}}<div class="{{=field.field_icon_right}} field-icon-right" style="cursor: pointer" {{?field.label_onclick}} onclick={{=field.label_onclick}}(){{?}}></div>{{?}}{{?!field.label_onclick}}<div class="{{=field.field_icon_right}} field-icon-right"></div>{{?}}{{?}}</div>#}}{{##def.passwordfield: <div class="{{=field.spacing_class}} field"><input type="password" {{?!field.enabled}}disabled{{?}} class="form-control {{=field.property}}-field" data-id="" placeholder="{{=field.label}}"></div>#}}{{##def.selectfield: <div class="{{=field.spacing_class}} field"><div class="glyphicon glyphicon-chevron-down field-icon-right"></div><select class="form-control {{=field.property}}-field"  placeholder="{{=field.label}}">{{~field.values :option:option_index}}<option value="{{=option.value}}">{{=option.text}}</option>{{~}}</select></div>#}}{{##def.checkfield: <div class="{{=field.spacing_class}} field" ><div class="checkbox checkbox-circle"><input id="{{=field.property}}" class="{{=field.property}}-field" type="checkbox"><label for="{{=field.property}}">{{?field.label_onclick}}<a href="javascript:void(0);"{{?field.label_onclick}} onclick={{=field.label_onclick}}(){{?}}>{{=field.label}}</a>{{?}}{{?!field.label_onclick}}{{=field.label}}{{?}}</label></div></div>#}}{{##def.customfield: <label class="col-xs-4 control-label">{{=field.label}}</label><div class="col-xs-8 form-control-container">{{=field.template(field)}}</div>#}}<form role="form" class="form-horizontal flex-form">{{~it.fields :field:index}}{{?field.visible}}{{?field.break_before}}<hr>{{?}}{{?field.type == "check"}}{{#def.checkfield}}{{??field.type=="select"}}{{#def.selectfield}}{{??field.type=="password"}}{{#def.passwordfield}}{{??field.type=="custom"}}{{#def.customfield}}{{??}}{{#def.textfield}}{{?}}{{?field.break_after}}<hr>{{?}}{{?}}{{~}}</form><div class="clearfix"></div>',
            pagefn = doT.template(form_body_template);
        return {
            init: init,
            getWidgets: getWidgets
        }
    }(),
    form_widget = function() {
        function init(container, options) {
            container.html(pagefn({
                fields: options.fields,
                caller: options.caller
            }))
        }

        function getWidgets(form_container, fields) {
            var results = {};
            return fields.forEach(function(field) {
                results[field.property + "_field"] = form_container.find("." + field.property + "-field")
            }), results
        }
        var form_body_template = '{{##def.textfield: <div class="form-group"><label class="col-xs-4 control-label">{{=field.label}}</label><div class="col-xs-8"><input {{?!field.enabled}}disabled{{?}} class="form-control {{=field.property}}-field" data-id=""></div></div>#}}{{##def.passwordfield: <div class="form-group"><label class="col-xs-4 control-label">{{=field.label}}</label><div class="col-xs-8"><input type="password" {{?!field.enabled}}disabled{{?}} class="form-control {{=field.property}}-field" data-id=""></div></div>#}}{{##def.selectfield: <div class="form-group"><label class="col-xs-4 control-label">{{=field.label}}</label><div class="col-xs-8"><select class="form-control {{=field.property}}-field">{{~field.values :option:option_index}}<option value="{{=option.value}}">{{=option.text}}</option>{{~}}</select></div></div>#}}{{##def.checkfield: <div class="form-group"><label class="col-xs-4 control-label">{{=field.label}}</label><div class="col-xs-8 form-control-container"><input type="checkbox" class="{{=field.property}}-field"></div></div>#}}{{##def.customfield: <div class="form-group"><label class="col-xs-4 control-label">{{=field.label}}</label><div class="col-xs-8 form-control-container">{{=field.template(field)}}</div></div>#}}<form role="form" class="form-horizontal">{{~it.fields :field:index}}{{?field.visible}}{{?field.break_before}}<hr>{{?}}{{?field.type == "check"}}{{#def.checkfield}}{{??field.type=="select"}}{{#def.selectfield}}{{??field.type=="password"}}{{#def.passwordfield}}{{??field.type=="custom"}}{{#def.customfield}}{{??}}{{#def.textfield}}{{?}}{{?field.break_after}}<hr>{{?}}{{?}}{{~}}</form>',
            pagefn = doT.template(form_body_template);
        return {
            init: init,
            getWidgets: getWidgets
        }
    }(),
    generic_modal = function() {
        function init(options) {
            var context = {},
                final_options = $.extend(!0, {}, _default_options, options);
            context.selector = final_options.container.append(modal_template(final_options));
            var dialog = options.container.find("." + final_options.className);
            var settings = settings_manager.get();
            settings.modal_instance = "." + final_options.className;
            settings_manager.save(settings);
            return dialog.modal({
                show: !1,
                keyboard: !1,
                backdrop: "static"
            }), context.hide = function() {
                dialog.modal("hide")
                var settings = settings_manager.get();
                settings.modal_instance = undefined;
                settings_manager.save(settings);
            }, dialog.on("hidden.bs.modal", function() {
                final_options.onHidden(), dialog.remove()
            }), dialog.modal("show"), context.getBody = function() {
                return dialog.find(".modal-body")
            }, context
        }
        var _default_options = {
                className: "modal-generic",
                showHeader: !0,
                showFooter: !0,
                headerHtml: "",
                bodyHtml: "",
                footerHtml: "",
                removeOnHide: !0,
                onOk: function() {},
                onCancel: function() {},
                onHidden: function() {}
            },
            modal_template_def = '<div class="{{=it.className}} modal fade" role="dialog"><div class="modal-dialog" style="background-color: #fff;">{{?it.showHeader}}<div class="modal-header"><button class="close" data-dismiss="modal"><i class="glyphicon glyphicon-remove"></i></button>{{=it.headerHtml}}</div>{{?}}<div class="modal-body">{{=it.bodyHtml}}</div>{{?it.showFooter}}<div class="modal-footer">{{=it.footerHtml}}</div>{{?}}</div></div>',
            modal_template = doT.template(modal_template_def);
        return {
            init: init
        }
    }(),
    google_map = function() {
        function _getPosition(onPosition, onError) {
            navigator.geolocation ? navigator.geolocation.getCurrentPosition(function(position) {
                _onGPSSuccess(position, !0), "undefined" != typeof onPosition && onPosition(position)
            }, function() {
                navigator.geolocation.getCurrentPosition(function(position) {
                    _onGPSSuccess(position, !1), "undefined" != typeof onPosition && onPosition(position)
                }, function(err_second_try) {
                    _onGPSError(err_second_try, onError)
                }, {
                    maximumAge: 6e4,
                    timeout: 2e4,
                    enableHighAccuracy: !1
                })
            }, {
                maximumAge: 6e4,
                timeout: 2e4,
                enableHighAccuracy: !0
            }) : (container.html(""), console.log("could not use geolocation API"))
        }

        function _onGPSSuccess(position, is_high_accuracy) {
            user_position = position, user_position.lat_lon = new google.maps.LatLng(user_position.coords.latitude, user_position.coords.longitude), user_position.is_high_accuracy = is_high_accuracy
        }

        function _onGPSError(err, onError) {
            var message = "",
                error_text = "Please ensure you have turned on the GPS or Location feature on your phone";
            1 == err.code ? message = "<strong>Please turn on your GPS or Location feature on your phone</strong>" : (message = "<strong>Could not get a location</strong>", message += "<div>Reason: " + err.message + "</div>"), "undefined" != typeof platform_util && (message += "<div>For help with enabling geolocation, see " + (platform_util.isApple() ? '<a href="http://support.apple.com/kb/HT5594" target="_blank">Apple Support</a>' : "Android Support")), console.log("could not use get location via geolocations API (code = " + err.code + ")"), "undefined" != typeof onError && onError(error_text), container.html(message)
        }

        function _showMap() {
            if (!map) {
                var mapOptions = {};
                user_position && (mapOptions = {
                    center: user_position.lat_lon,
                    zoom: 10
                }), map = new google.maps.Map(container[0], mapOptions), directionsDisplay.setMap(map), placesService = new google.maps.places.PlacesService(map)
            }
        }

        function _searchNearby(radius_miles, terms, onPlaces) {

            if ('undefined' == typeof terms || null == terms) {
                onPlaces([]);
                return;
            }
            var request = {
                location: user_position.lat_lon,
                radius: radius_miles * METERS_PER_MILE,
                types: terms
            };
            placesService.nearbySearch(request, function(results, status) {
                status == google.maps.places.PlacesServiceStatus.OK ? (results.forEach(function(result) {
                    result.distance = google.maps.geometry.spherical.computeDistanceBetween(result.geometry.location, new google.maps.LatLng(user_position.coords.latitude, user_position.coords.longitude)), result.distance = isNaN(result.distance) ? 0 / 0 : result.distance /= METERS_PER_MILE
                }), "function" == typeof onPlaces && onPlaces(results)) : "function" == typeof onPlaces && onPlaces([])
            })
        }

        function _createMarker(name, location, image_path, onclicked) {
            var marker_options = {
                map: map,
                position: location
            };
            "undefined" != typeof image_path && (marker_options.icon = image_path);
            var marker = new google.maps.Marker(marker_options);
            return google.maps.event.addListener(marker, "click", function() {
                infowindow.setContent(name + '<br><a class="get-directions" data-lat="' + location.lat() + '" data-lon="' + location.lng() + '">Directions</a>'), infowindow.open(map, this), "function" == typeof onclicked && onclicked(this)
            }), marker
        }

        function _removeMarker(marker) {
            marker.setMap(null)
        }

        function _center(location) {
            map.setCenter(location)
        }

        function _getDirections(source, destination, onDirections) {
            var request = {
                origin: source,
                destination: destination,
                travelMode: google.maps.TravelMode.DRIVING
            };
            directionsService.route(request, function(response, status) {
                status == google.maps.DirectionsStatus.OK && (directionsDisplay.setDirections(response), "function" == typeof onDirections && onDirections(response))
            })
        }
        var directionsService, placesService, container, directions_selector, directionsDisplay, infowindow, user_position, map = null,
            METERS_PER_MILE = 1609,
            acceptable_place_types = {
                accounting: "accounting",
                airport: "airport",
                amusement_park: "amusement_park",
                aquarium: "aquarium",
                art_gallery: "art_gallery",
                atm: "atm",
                bakery: "bakery",
                bank: "bank",
                bar: "bar",
                beauty_salon: "beauty_salon",
                bicycle_store: "bicycle_store",
                book_store: "book_store",
                bowling_alley: "bowling_alley",
                bus_station: "bus_station",
                cafe: "cafe",
                campground: "campground",
                car_dealer: "car_dealer",
                car_rental: "car_rental",
                car_repair: "car_repair",
                car_wash: "car_wash",
                casino: "casino",
                cemetery: "cemetery",
                church: "church",
                city_hall: "city_hall",
                clothing_store: "clothing_store",
                convenience_store: "convenience_store",
                courthouse: "courthouse",
                dentist: "dentist",
                department_store: "department_store",
                doctor: "doctor",
                electrician: "electrician",
                electronics_store: "electronics_store",
                embassy: "embassy",
                establishment: "establishment",
                finance: "finance",
                fire_station: "fire_station",
                florist: "florist",
                food: "food",
                funeral_home: "funeral_home",
                furniture_store: "furniture_store",
                gas_station: "gas_station",
                general_contractor: "general_contractor",
                grocery_or_supermarket: "grocery_or_supermarket",
                gym: "gym",
                hair_care: "hair_care",
                hardware_store: "hardware_store",
                health: "health",
                hindu_temple: "hindu_temple",
                home_goods_store: "home_goods_store",
                hospital: "hospital",
                insurance_agency: "insurance_agency",
                jewelry_store: "jewelry_store",
                laundry: "laundry",
                lawyer: "lawyer",
                library: "library",
                liquor_store: "liquor_store",
                local_government_office: "local_government_office",
                locksmith: "locksmith",
                lodging: "lodging",
                meal_delivery: "meal_delivery",
                meal_takeaway: "meal_takeaway",
                mosque: "mosque",
                movie_rental: "movie_rental",
                movie_theater: "movie_theater",
                moving_company: "moving_company",
                museum: "museum",
                night_club: "night_club",
                painter: "painter",
                park: "park",
                parking: "parking",
                pet_store: "pet_store",
                pharmacy: "pharmacy",
                physiotherapist: "physiotherapist",
                place_of_worship: "place_of_worship",
                plumber: "plumber",
                police: "police",
                post_office: "post_office",
                real_estate_agency: "real_estate_agency",
                restaurant: "restaurant",
                roofing_contractor: "roofing_contractor",
                rv_park: "rv_park",
                school: "school",
                shoe_store: "shoe_store",
                shopping_mall: "shopping_mall",
                spa: "spa",
                stadium: "stadium",
                storage: "storage",
                store: "store",
                subway_station: "subway_station",
                synagogue: "synagogue",
                taxi_stand: "taxi_stand",
                train_station: "train_station",
                travel_agency: "travel_agency",
                university: "university",
                veterinary_care: "veterinary_care",
                zoo: "zoo"
            },
            interface_object = {
                init: function(container, onLoaded) {
                    google.maps.event.addDomListener(window, "load", function() {
                        google_map.initLoaded(container), onLoaded()
                    })
                },
                initLoaded: function(outer_container) {
                    container = outer_container, directionsDisplay = new google.maps.DirectionsRenderer, directionsService = new google.maps.DirectionsService, infowindow = new google.maps.InfoWindow
                },
                getClientPosition: function(onPosition, onError) {
                    _getPosition(onPosition, onError)
                },
                showMap: function() {
                    _showMap()
                },
                clear: function() {
                    map = null
                },
                searchNearby: function(radius_miles, search_terms, onResults) {
                    _searchNearby(radius_miles, search_terms, onResults)
                },
                getDirections: function(destination, onDirections) {
                    _getDirections(user_position.coords.latitude + "," + user_position.coords.longitude, destination, onDirections)
                },
                createMarker: function(name, location, image, onclicked) {
                    return _createMarker(name, location, image, onclicked)
                },
                removeMarker: function(marker) {
                    _removeMarker(marker)
                },
                getLastPosition: function() {
                    return user_position
                },
                setUserPosition: function(position) {
                    user_position = position
                },
                center: function(lat_lon) {
                    _center(lat_lon)
                },
                centerOnClientLocation: function() {
                    _center(user_position.lat_lon)
                },
                setDirectionsPanel: function(directionsPanelSelector) {
                    directions_selector = directionsPanelSelector;
                    var directionsPanel = $(directionsPanelSelector);
                    directionsDisplay.setPanel(directionsPanel[0])
                },
                hideDirections: function() {
                    directionsDisplay.set("directions", null)
                },
                closeInfoWindow: function() {
                    infowindow.close()
                },
                triggerResize: function() {
                    google.maps.event.trigger(map, "resize")
                },
                acceptable_place_types: acceptable_place_types
            };
        return interface_object
    }(google_map),
    loading_indicator_widget = function() {
        function init(options_in) {
            "use strict";
            var options = $.extend(!0, {}, default_options, options_in);
            options.container.html(loading_template_def), options.container.find(".loading-text").html(options.text);
            var spinner_container = options.container.find(".loading-child");
            options.container.find(".loading-container").css("top", Math.floor(options.container.height() / 2 - 37));
            var opts = {
                    lines: options.render_lines,
                    length: options.render_length,
                    width: options.render_line_width,
                    radius: options.render_radius,
                    corners: options.render_corners,
                    rotate: options.render_rotate,
                    direction: options.render_direction,
                    color: options.render_color,
                    speed: options.render_speed,
                    trail: options.render_trail,
                    shadow: options.render_shadow,
                    hwaccel: options.render_hwaccel,
                    className: options.render_class,
                    zIndex: options.render_zindex,
                    top: options.render_top,
                    left: options.render_left
                },
                spinner = new Spinner(opts),
                target = spinner_container.get(0);
            spinner.spin(target)
        }

        function destroy(container) {
            container.find(".loading-container").remove()
        }

        function setText(container, text) {
            container.find(".loading-text").html(text)
        }
        var loading_template_def = '<div class="loading-container" style="position: relative;"><div class="loading-message" style="height:74px; width: 80px; margin: auto;"><div class="loading-child" style="position: relative; top: 40px;"></div></div><div style="text-align: center;" class="loading-text"></div></div>',
            default_options = {
                container: null,
                text: "Loading",
                render_lines: 9,
                render_length: 0,
                render_line_width: 7,
                render_radius: 20,
                render_corners: 1,
                render_rotate: 0,
                render_direction: 1,
                render_color: "#000",
                render_speed: 1,
                render_trail: 60,
                render_shadow: !1,
                render_hwaccel: !1,
                render_class: "spinner",
                render_zindex: 0,
                render_top: "auto",
                render_left: "auto"
            };
        return {
            init: init,
            destroy: destroy,
            setText: setText
        }
    }(),
    loading_modal = function() {
        function show(loadingText, timeout_ms) {
            var loadingMessage = $(".modal-loading");
            loadingMessage.modal({
                show: !1,
                keyboard: !1,
                backdrop: "static"
            }), loadingMessage.find(".modal-body").find(".loading-text").html("undefined" == typeof loadingText ? default_loading_text : loadingText);
            var spinner_container = loadingMessage.find(".loading-child");
            if (spinner_container.children().length > 0) return void loadingMessage.modal("show");
            if ("undefined" == typeof this.spinner) {
                var opts = {
                    lines: 13,
                    length: 20,
                    width: 10,
                    radius: 30,
                    corners: 1,
                    rotate: 0,
                    direction: 1,
                    color: "#000",
                    speed: 1,
                    trail: 60,
                    shadow: !1,
                    hwaccel: !1,
                    className: "spinner",
                    zIndex: 2e9,
                    top: "auto",
                    left: "auto"
                };
                this.spinner = new Spinner(opts)
            }
            var target = spinner_container.get(0);
            return this.spinner.spin(target), loadingMessage.modal("show"), "undefined" == typeof timeout_ms ? void setTimeout(hide, 9999) : void(timeout_ms > 0 && setTimeout(hide, timeout_ms))
        }

        function hide() {
            $(".modal-loading").modal("hide"), "undefined" != typeof this.spinner && this.spinner.stop()
        }

        function getHtml() {
            return doT.template(loading_modal_template_def)({})
        }
        var default_loading_text = "Loading",
            loading_modal_template_def = '<div class="modal-loading modal" style="height:165px; width: 165px; margin-left: -82px; left: 50%; top: 50%; margin-top: -75px; overflow: visible;"><div class="modal-content"><div class="modal-body" style="border-radius: 10px;"><div class="loading-message" style="height:65px; width: 135px;"><div class="loading-child" style="margin-left: 63px; margin-top: 60px;"></div></div><div style="text-align: center;" class="loading-text">' + default_loading_text + "</div></div></div></div>";
        return {
            show: show,
            hide: hide,
            getHtml: getHtml
        }
    }();
$(function() {
    $("body").append(loading_modal.getHtml())
});
var rating_widget = function() {
        function init(container, options) {
            var _options = {
                stars: [{}],
                selection_enabled: !0,
                onSelected: function(star_index) {
                    console.log(star_index)
                }
            };
            _options = $.extend({}, _options, options), container.html(info_template(_options)), _options.selection_enabled && container.find(".rating-option").click(function() {
                _options.onSelected($(this).data("score"))
            })
        }
        var info_template_ref = '{{~it.stars :value:index}}<a class="rating-option" data-score={{=index}}><i class="{{=value.rating_classes}}" style="{{=value.rating_style}}"></i></a>{{~}}<div class="clearfix"></div>',
            info_template = doT.template(info_template_ref);
        return {
            init: init
        }
    }(),
    single_input_modal = function() {
        function show(title, text, input_type, onOk, onCancel, onHidden) {
            var dialog = $(_modalClassName);
            var settings = settings_manager.get();
            settings.modal_instance = _modalClassName;
            settings_manager.save(settings);
            dialog.modal({
                show: !1,
                keyboard: !1,
                backdrop: "static"
            }), dialog.find(".modal-body").html(text), dialog.find(".modal-body").append('<form onsubmit="return !1;"><input class="form-control" type="' + input_type + '"></form>'), dialog.find(".modal-header > h3").html(title), dialog.find("button.submit").unbind("click"), dialog.find("button.submit").click(function() {
                return hide(), onOk(dialog.find("input").val()), !1
            }), dialog.find("button.cancel").unbind("click"), dialog.find("button.cancel").click(function() {
                onCancel && onCancel()
            }), dialog.find("input.form-control").unbind("keyup"), dialog.find("input.form-control").keyup(function(event) {
                if(event.which == 13)
                    return hide(), onOk(dialog.find("input").val()), !1;
            }), dialog.on("hidden.bs.modal", function() {
                onHidden && onHidden()
            }), dialog.modal("show")
        }

        function hide() {
            $(_modalClassName).modal("hide")
            var settings = settings_manager.get();
            settings.modal_instance = undefined;
            settings_manager.save(settings);
        }

        function init(container) {
            container.append(doT.template(single_input_modal_template_def)({}))
        }

        function getValue(container) {
            return container.find(_modalClassName).find("input").val()
        }
        var _modalClassName = ".modal-single-input",
            single_input_modal_template_def = '<div class="modal-single-input modal fade" role="dialog"><div class="modal-dialog" style="background-color: #fff;"><div class="modal-header"><button class="close" data-dismiss="modal" style="padding: 5px 5px 5px 15px;">x</button><h3></h3></div><div class="modal-body"></div><div class="modal-footer"><button data-dismiss="modal" class="cancel btn">Cancel</button><button type="submit" class="submit btn">Ok</button></div></div></div>';
        return {
            show: show,
            hide: hide,
            init: init,
            getValue: getValue
        }
    }();
$(function() {
    single_input_modal.init($("body"))
});
var star_rating_widget = function() {
        function init(container, options) {
            var _options = {
                supports_half_stars: !1,
                unselected_style: "margin-right: 5px;",
                selected_style: "color: #ff0; text-shadow: 0 0 1px #000; margin-right: 5px;",
                value: 0,
                selection_enabled: !0,
                number_of_stars: 5,
                on_selected: function(star_rating) {
                    console.log(star_rating)
                }
            };
            options && Object.keys(options).forEach(function(key) {
                _options[key] = options[key]
            }), _options.stars = [];
            for (var i = 0; i < _options.number_of_stars; i++) _options.stars.push(_options.value <= i ? 0 : _options.value <= i + .5 && _options.supports_half_stars ? .5 : 1);
            container.html(info_template(_options)), _options.selection_enabled && container.find(".star-rating").click(function() {
                _options.on_selected($(this).data("score"))
            }), container.find("a.star-info").click(function() {
                alert_modal.show("Info", star_info_contents)
            })
        }
        var info_template_ref = '{{~it.stars :value:index}}{{?value == 0}}<a class="star-rating" data-score={{=index + 1}}><i class="glyphicon glyphicon-star-empty icon icon-star-empty" style="{{=it.unselected_style}}"></i></a>{{?? value == 0.5}}<a class="star-rating" data-score={{=index + 1}}><i class="glyphicon glyphicon-star-half icon icon-star-half" style="{{=it.selected_style}}"></i></a>{{??}}<a class="star-rating" data-score={{=index + 1}}><i class="glyphicon glyphicon-star icon icon-star" style="{{=it.selected_style}}"></i></a>{{?}}{{~}}<div class="clearfix" style="margin-bottom: 10px;"></div><a class="star-info">what do these mean?</a>',
            star_info_contents = '<div style="font-size: 14px;"><div>1 star:<br>Was Not Helpful</div><div>2 star:<br>Could Not Find What I Was Looking For</div><div>3 star:<br>Helpful but Looking for More Information</div><div>4 star:<br>Helpful Found What I Was Looking For</div><div>5 star:<br>Very Helpful Will Use It Again</div></div>',
            info_template = doT.template(info_template_ref);
        return {
            init: init
        }
    }(),
    tabbed_container_widget = function() {
        function init(container, options_in) {
            "use strict";
            var options = $.extend(!0, {}, default_options, options_in);
            return "tabs" == options.style ? _initTabStyle(container, options) : _initDropdownStyle(container, options)
        }

        function openTab(container, target, options_in) {
            var options = $.extend(!0, {}, default_options, options_in);
            return "tabs" == options.style ? void _openTabForTabStyle(container, target, options) : void _openTabForDropdownStyle(container, target, options)
        }

        function _initDropdownStyle(container, options) {
            function getCurrentTabInfo() {
                var activeTabClass = container.find(".tab-pane.active").data("tab"),
                    activeTab = _getTabInfo(options, function(tab) {
                        return tab.className == activeTabClass
                    });
                return {
                    target: activeTab.className,
                    label: activeTab.label
                }
            }
            var _interface = {
                getCurrentTabInfo: getCurrentTabInfo
            };
            return container.html(dropdown_template(options)), container.find("a.type-selector").click(function() {
                var tabClass = $(this).data("tab");
                openTab(container, tabClass, options)
            }), _interface
        }

        function _initTabStyle(container, options) {
            function getCurrentTabInfo() {
                var activeTab = container.find("li.active > a");
                return {
                    target: activeTab.data("toggle-target").substr(1),
                    label: activeTab.text()
                }
            }
            var _interface = {
                getCurrentTabInfo: getCurrentTabInfo
            };
            if (container.html(tabs_template(options)), container.find('a[data-toggle="tab"]').click(function() {
                    openTab(container, $(this).data("toggle-target"), options)
                }), options.initialTab) openTab(container, "." + options.initialTab, options);
            else if (options.processHashes) {
                var hash = window.location.hash.length > 0 && "#" == window.location.hash[0] ? window.location.hash.substr(1) : window.location.hash,
                    selectedTab = _getTabInfo(options, function(tab) {
                        return tab.hash == hash
                    });
                selectedTab ? openTab(container, "." + selectedTab.className, options) : openTab(container, "." + options.tabs[0].className, options)
            }
            return _interface
        }

        function _openTabForTabStyle(container, target, options) {
            container.find(".tab-pane").removeClass("active");
            var target_container = container.find(target).addClass("active");
            container.find('a[data-toggle-target="' + target + '"]').tab("show");
            var targetSansPeriod = target.substr(1),
                selectedTab = _getTabInfo(options, function(tab) {
                    return tab.className == targetSansPeriod
                });
            selectedTab && (options.processHashes && "undefined" != typeof selectedTab.hash && history.pushState(null, null, "#" + selectedTab.hash), "undefined" != typeof selectedTab.onOpened && selectedTab.onOpened()), options.onTabOpened(targetSansPeriod, target_container)
        }

        function _openTabForDropdownStyle(container, target, options) {
            var selectedTab = _getTabInfo(options, function(tab) {
                return tab.className == target
            });
            container.find(".selected-label").html(selectedTab.label), container.find(".tab-pane").removeClass("active"), container.find(".tab-pane." + target).addClass("active")
        }

        function _getTabInfo(options, filterFunction) {
            if ("undefined" == typeof options.tabs || !Array.isArray(options.tabs)) return null;
            var matching_tabs = options.tabs.filter(filterFunction);
            return 0 == matching_tabs.length ? null : (matching_tabs.length > 1 && console.log("WARNING: on a TabbedContainerWidget, more than one tab was selected in _getTabInfo"), matching_tabs[0])
        }
        var default_options = {
                initialTab: null,
                tabs: [{
                    className: "tab-one",
                    label: "Tab One",
                    onOpened: function() {},
                    hash: "tab1"
                }],
                style: "tabs",
                secondary_label: "",
                processHashes: !1,
                onTabOpened: function() {}
            },
            tabs_template_def = '<div class="tabbed-collection tab-style"><div class="controls"></div><ul class="nav nav-tabs">{{~it.tabs :tab:tab_index}}{{? (it.initialTab && it.initialTab == tab.className)}}<li class="active"><a data-toggle-target=".{{=tab.className}}" data-toggle="tab">{{=tab.label}}</a></li>{{??}}<li><a data-toggle-target=".{{=tab.className}}" data-toggle="tab">{{=tab.label}}</a></li>{{?}}{{~}}</ul><div class="tab-content">{{~it.tabs :tab:tab_index}}{{? (it.initialTab && it.initialTab == tab.className)}}<div class="tab-pane active {{=tab.className}}"></div>{{??}}<div class="tab-pane {{=tab.className}}"></div>{{?}}{{~}}</div></div>',
            dropdown_template_def = '<div class="tabbed-collection dropdown-style"><div class="dropdown pull-left"><a class="dropdown-toggle" data-toggle="dropdown" id="dropdown-type-1">{{~it.tabs :tab:tab_index}}{{? (it.initialTab && it.initialTab == tab.className)}}<span class="selected-label">{{=tab.label}}</span>{{?}}{{~}}<i class="si-downarrow"></i></a><ul class="dropdown-menu" role="menu" aria-labelledby="dropdown-type-1">{{~it.tabs :tab:tab_index}}<li role="presentation"><a class="type-selector" data-tab="{{=tab.className}}">{{=tab.label}}</a></li>{{~}}</ul><span class="secondary-label">{{=it.secondary_label}}</span></div><div class="clearfix"></div><div class="tab-content">{{~it.tabs :tab:tab_index}}{{? (it.initialTab && it.initialTab == tab.className)}}<div class="tab-pane active {{=tab.className}}" data-tab="{{=tab.className}}"></div>{{??}}<div class="tab-pane {{=tab.className}}" data-tab="{{=tab.className}}"></div>{{?}}{{~}}</div></div>',
            tabs_template = doT.template(tabs_template_def),
            dropdown_template = doT.template(dropdown_template_def);
        return {
            init: init,
            openTab: openTab
        }
    }(),
    video_chat_widget = function() {
        function init(options_in) {
            function _loginSuccess(easyrtcid) {
                console.log("rtc login succeeded"), my_rtc_id = easyrtcid, console.log("your rtc id is " + easyrtcid)
            }

            function _loginFailure(err) {
                console.log("rtc login failed, an error occurred: " + err)
            }

            function roomListener(roomName, otherPeers) {
                console.log("roomListener called: " + Object.keys(otherPeers).length + " other peers"), null == room_join_time && (room_join_time = (new Date).getTime());
                var callersContainer = options.container.find(".callers");
                callersContainer.html(peers_template(otherPeers)), callersContainer.find("a.caller").click(function() {
                    performCall($(this).data("caller"))
                })
            }

            function performCall(otherEasyrtcid) {
                console.log("performing call"), easyrtc.hangupAll();
                var acceptedCB = function(accepted, easyrtcid) {
                        accepted || (easyrtc.showError("CALL-REJECTED", "Sorry, your call to " + easyrtc.idToName(easyrtcid) + " was rejected"), enable("otherClients"))
                    },
                    successCB = function() {
                        setUpMirror()
                    },
                    failureCB = function() {};
                easyrtc.call(otherEasyrtcid, successCB, failureCB, acceptedCB)
            }

            function setUpMirror() {
                if (!haveSelfVideo && showSelfVideo) {
                    var selfVideo = selfVideoContainer[0];
                    easyrtc.setVideoObjectSrc(selfVideo, easyrtc.getLocalStream()), selfVideo.muted = !0, haveSelfVideo = !0
                }
            }

            function _acceptChecker(easyrtcid, callback) {
                return !0
            }
            var options = $.extend({}, default_options, options_in);
            options.container.html(template(options));
            var videoContainer = options.container.find(".callerVideo"),
                selfVideoContainer = options.container.find(".videoMirror"),
                callersContainer = options.container.find(".callers");
            videoContainer.addClass("hidden"), callersContainer.html(peers_template({})), options.container.find("button.hang-up-all").click(function() {
                easyrtc.hangupAll()
            }), options.showSelf && (showSelfVideo = !0), options.remoteUrl && easyrtc.setSocketUrl(options.remoteUrl), easyrtc.enableAudio(!0), easyrtc.enableVideo(!0), easyrtc.setRoomOccupantListener(roomListener), easyrtc.setAcceptChecker(_acceptChecker), easyrtc.setStreamAcceptor(function(easyrtcid, stream) {
                console.log("running stream acceptor"), setUpMirror(), easyrtc.setVideoObjectSrc(videoContainer[0], stream), console.log("saw video from " + easyrtcid), videoContainer.removeClass("hidden")
            }), easyrtc.setOnStreamClosed(function() {
                console.log("rtc stream closed"), easyrtc.setVideoObjectSrc(callersContainer[0], "")
            }), console.log("connecting to room " + options.roomName), easyrtc.connect(options.roomName, _loginSuccess, _loginFailure)
        }
        var my_rtc_id = null,
            haveSelfVideo = !1,
            showSelfVideo = !1,
            room_join_time = null,
            default_options = {
                roomName: "defaultRoom",
                container: null,
                showSelf: !1,
                remoteUrl: null,
                isCalling: !0
            },
            template_def = '<div class="your-id">{{?it.showSelf}}<video class="videoMirror" autoplay="autoplay" muted="muted" volume="0"></video>{{?}}<video class="callerVideo" autoplay="autoplay"></video><div class="callers"></div><button class="hang-up-all btn btn-warning">Hang up all</button></div>',
            peers_template_def = '{{?Object.keys(it).length == 0}}No callers are in the queue{{??}}{{~Object.keys(it) :caller_key}}<a class="caller" data-caller="{{=caller_key}}">{{=caller_key}}</a>{{~}}{{?}}',
            template = doT.template(template_def),
            peers_template = doT.template(peers_template_def);
        return {
            init: init
        }
    }();
