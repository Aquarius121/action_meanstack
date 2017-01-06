FindPage.prototype  = new PageController();
FindPage.prototype.constructor = FindPage;

function FindPage(results_callback) {
    this.resultsCallback = results_callback;
}

FindPage.prototype.onPageReady = function() {
    var that = this;
    this.pageContainer = $('#find');
    this.resultsContainer = this.pageContainer.find('.search-results-container');
    this.recentProductsContainer = this.pageContainer.find('.recent-products-container');

    this.pageContainer.find('.code-query').click(function() {
        _searchProductName(that.pageContainer, that.pageContainer.find('input.code-entry.tt-input').val(), that.resultsCallback);
        return false;
    });

    // accept "Go", etc on keyboard
    this.pageContainer.find('form.code').ajaxForm({
        beforeSubmit: function() {
            return false;
        }
    });

    this.pageContainer.find('form.code').keyup(function(evt) {
        if(evt.which === 13) {
            _searchProductName(that.pageContainer, that.pageContainer.find('input.code-entry.tt-input').val(), that.resultsCallback);
        }
    });

    this.initTypeAhead();

    this.pageContainer.find('input.code-entry').keyup(function() {
        that.resultsContainer.html('');
        if($(this).val().length == 0) {
            that.setRecentProductsVisible(true);
        } else {
            that.setRecentProductsVisible(false);
        }
    });

    this.recentProductsContainer.find('.btn-clear').click(function() {
        var settings = settings_manager.get();
        settings.recent_products = [];
        settings_manager.save(settings);

        that.recentProductsContainer.find('.product-results-container').html('');
    });

    var settings = settings_manager.get();
    if(settings.recent_products.length > 0) {
        this.pageContainer.find('.results-container').html('');
        this.setRecentProductsVisible(true);
    }
};

FindPage.prototype.setRecentProductsVisible = function(is_visible) {
    if(is_visible) {
        this.resultsContainer.addClass('hidden');
        this.recentProductsContainer.removeClass('hidden');
    } else {
        this.resultsContainer.removeClass('hidden');
        this.recentProductsContainer.addClass('hidden');
    }
};

FindPage.prototype.initTypeAhead = function() {
    var initial_value = "", that = this;

    products_typeahead_widget.init(app_util.getRemoteUrl(), this.pageContainer, function(term) {
    }, _onSelection, initial_value);

    function _onSelection(selected) {
        product_query.query(selected.ean, app_util.isUsingWeb, 'search', function(results) {
            if(!results || results.length == 0) {
                alert('No results were found');
                return;
            }

            general_util.reportProductView(results);
            that.resultsCallback(results);
        });
    }
};

FindPage.prototype.onPageBeforeShow = function() {
    window.scrollTo(80,0);
    var settings = settings_manager.get();
    var that = this;
    if(settings.back_product_flag == true)
    {
        settings.back_product_flag = false;
        settings_manager.save(settings);
        that.pageContainer.find('input.code-entry').typeahead('close');
        if(settings.back_products.length !=0)
        {
            product_search_results.preserveSearch(app_util.getRemoteUrl(), that.pageContainer.find('.search-results-container'), settings.back_term, 15, function(ean) {
                product_query.query(ean, app_util.isUsingWeb, 'search', function(results) {
                    if(!results || results.length == 0) {
                        alert('No results were found');
                        return;
                    }
                    general_util.reportProductView(results);

                    that.resultsCallback(results);
                });

            });
            return;
        }
        else
        {
            this.pageContainer.find('input.code-entry').val(settings.back_term);
            that.setRecentProductsVisible(true);

            return;
        }
    }
    var codeEntry = this.pageContainer.find('input.code-entry');

    $('.cancel-icon').unbind('click');
    $('.cancel-icon').click(function() {
        codeEntry.val('');
        that.setRecentProductsVisible(true);
    });

    codeEntry.typeahead('close');
    codeEntry.val('');

    this.setRecentProductsVisible(true);

    /*
     this.pageContainer.find('.input-code-container').addClass('no-search');

     this.pageContainer.find('input.code-entry').val('');
     this.pageContainer.find('input.code-entry').typeahead('destroy');
     this.initTypeAhead();

     this.pageContainer.find('.results-container').html('');
     this.pageContainer.find('.results-total-container').html('');
     */




    var recent_products_clone = settings.recent_products.slice(0);
    recent_products_clone.reverse();

    var products_only = recent_products_clone.map(function(clone_item) {
        clone_item.product.brand_logo_url = (clone_item.brand ? clone_item.brand.logo_url : '');
        return clone_item.product;
    });

    product_search_results.initWithStaticData(this.recentProductsContainer.find('.product-results-container'), products_only, function(ean) {
        product_query.query(ean, app_util.isUsingWeb, 'search', function(results) {
            if(!results || results.length == 0) {
                alert('No results were found');
                return;
            }
            general_util.reportProductView(results);

            that.resultsCallback(results);
        });
    });

    header_widget.update('search');


};

function _searchProductName(container, term, results_callback) {
    container.find('input.code-entry').typeahead('close');

    product_search_results.init(app_util.getRemoteUrl(), container.find('.search-results-container'), term, 15, function(ean) {
        product_query.query(ean, app_util.isUsingWeb, 'search', function(results) {
            if(!results || results.length == 0) {
                alert('No results were found');
                return;
            }
            general_util.reportProductView(results);
            results_callback(results);
        });
    });
}