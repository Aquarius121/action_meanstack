
$(function() {
    $( ".ui-tooltip" ).tooltip({});

    products_find_page.init();
});

var products_find_page = (function() {

    function init() {
        //products_typeahead_widget.init('', $('.products-typeahead-widget'), _searchProductName, _onSelection, '');
        /*
        if(caller.firstVisit == true)
        {
            var settings = settings_manager.get();
            settings.back_term = "";
            settings.back_text = "";
            settings.back_products = undefined;
            settings_manager.save(settings);
            caller.firstVisit = false
        }
        */
        var settings = settings_manager.get();
        settings.auto_message = true;
        settings.logged_in = true;
        settings_manager.save(settings);
        $('.pager-container').css('display', 'none');

        var pageContainer = $('body');
        var recentProductsContainer = $('.recent-products-container');

        _initRecentResults(recentProductsContainer);

        var query = _getParameterByName('query'), initial_value = ''; // "?query=M&ms%20Peanut%20Butter%20Candies"
        if(query.length > 0) {
            initial_value = decodeURIComponent(query);
        }

        pageContainer.find('.cancel-btn').click(function() {
            pageContainer.find('input.code-entry').val('');
        });
        if(initial_value.length > 0) {
            _searchProductName(initial_value);
        } else {
            $('.products-typeahead-widget').find('input').focus();
            recentProductsContainer.removeClass('hidden');
        }
        if(settings.back_products && isFromProdDetailPage())
        {
            if(settings.back_products.products && settings.back_products.products.length !=0)
            {
                product_search_results.preserveSearch('', $('.results-container'), settings.back_term, 30, function(ean) {
                    _onProductSelectedFromResults(ean);

                });
                pageContainer.find('input.code-entry').val(settings.back_term);
                products_typeahead_widget.init('', $('.products-typeahead-widget'), _searchProductName, _onSelection, settings.back_term);

            }
            else
            {
                pageContainer.find('input.code-entry').val(settings.back_term);
                products_typeahead_widget.init('', $('.products-typeahead-widget'), _searchProductName, _onSelection, settings.back_term);
            }
            recentProductsContainer.addClass(" hidden");

        }
        else {
            products_typeahead_widget.init('', $('.products-typeahead-widget'), _searchProductName, _onSelection, initial_value);
            $('.products-typeahead-widget').find('input').focus();
            recentProductsContainer.removeClass('hidden');
        }


        pageContainer.find('input.code-entry').keyup(function(e) {
            if($(this).val().length == 0) {
                _initRecentResults(recentProductsContainer);
                recentProductsContainer.removeClass('hidden');
                $('input.code-entry.form-control.tt-hint').hide();
            } else {
                if(13 != e.which) {
                    $('.results-container').html("");
                    recentProductsContainer.addClass('hidden');
                }
                $('input.code-entry.form-control.tt-hint').show();
            }
        });


    }
    function isFromProdDetailPage()
    {
        var historyUrl = window.sessionStorage.getItem('historyUrl');
        if (historyUrl == null)
            return !1;
        if(historyUrl.search('/product/view/')>-1)
                return !0;
    }
    function _initRecentResults(container) {
        var settings = settings_manager.get();

        var recent_products_clone = settings.recent_products.slice(0);
        recent_products_clone.reverse();

        var products_only = recent_products_clone.map(function(clone_item) {
            clone_item.product.brand_logo_url = (clone_item.brand ? clone_item.brand.logo_url : '');
            return clone_item.product;
        });

        product_search_results.initWithStaticData(container.find('.product-results-container'), products_only, function(ean) {
            _onProductSelectedFromResults(ean);
        });



        container.find('.btn-clear').click(function() {
            var settings = settings_manager.get();
            settings.recent_products = [];

            settings_manager.save(settings);

            //container.addClass('hidden');
            container.find('.product-results-container').html('');
        });
    }

    function _searchProductName(term) {
        if(term == "")
        {
            alert_modal.show("Error","Input text you want to search");
            return;
        }
        $('input.product-search').typeahead('close');
        product_search_results.init('', $('.results-container'), term, 30, function(ean) {
            _onProductSelectedFromResults(ean);
        });
    }

    function _onSelection(selected) {

        window.location.href = '/product/view/' + selected.ean;
    }

    function _onProductSelectedFromResults(ean) {
        window.location.href = '/product/view/' + ean;
    }

    function _getParameterByName(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    return {
        init: init

    }
}());
