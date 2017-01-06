ProductMenuPage.prototype  = new PageController();
ProductMenuPage.prototype.constructor = ProductMenuPage;

function ProductMenuPage() {
}

ProductMenuPage.prototype.onPageReady = function() {
    this.pageContainer = $('#product-menu');
    this.promoImageContainer = this.pageContainer.find('.product-promo-container');
};

ProductMenuPage.prototype.onPageBeforeShow = function() {
    header_widget.update();
    window.scrollTo(80,0);
    this.tryApplyStyling(this.product_info);
};

ProductMenuPage.prototype.onPageShow = function() {
    var birth_year = app.caller.dob.substring(0,4);
    var caller_age = new Date().getFullYear() - parseInt(birth_year);
    if(this.product_info.brand.minimum_age && parseInt(this.product_info.brand.minimum_age) > caller_age)
    {
        alert_modal.show("Error","We're sorry, but regulations require that you must be at least " + this.product_info.brand.minimum_age +    " years old to access this product.",function(){
            window.history.back();
        });
        return;

    }
    else
        auto_message_utils.tryShowAutoMessage(this.product_info);
};

ProductMenuPage.prototype.onPageBeforeHide = function() {
    app_util.removeCustomStyling();
    auto_message_utils.saveHistory(""+window.location);
};

ProductMenuPage.prototype.onProductConfirmed = function(results) {
    var that = this;

    this.product_info = results;
    console.log(results);
    this.pageContainer.find('.product-location').css('display', 'none');
    this.pageContainer.find('.product-self-help').css('display', 'none');
    this.pageContainer.find('.favorite-container').html('');

    //change product background
    if('undefined' != typeof(this.product_info.brand.styles) && null != this.product_info.brand.styles && 'undefined' != typeof(this.product_info.brand.styles.body_background) && null != this.product_info.brand.styles.body_background)
    {
        this.pageContainer.css('background-color', this.product_info.brand.styles.body_background);
        this.pageContainer.css('height', '100%');
    }

    product_jumbotron_widget.init({
        container: this.pageContainer.find('.product-image-jumbotron-container'),
        product: this.product_info.product,
        brand: this.product_info.brand,
        remote_url: app_util.getRemoteUrl(),
        caller: app.caller
    });

    general_util.applyBestProductImage(results, this.pageContainer);

    var selector = this.pageContainer.find('.product-promo-container');
    this.pageContainer.find('.product-promo-container').click(function() {
        app_controller.getPage('#product-results').show_promo = true;
        app_controller.openInternalPage("#product-results");
    });

    var is_horizontal = (typeof(results.product.promo_images) != 'undefined' && results.product.promo_images.length > 0);

    product_menu_widget.init({
        horizontal: is_horizontal,
        container: this.pageContainer.find('.product-menu-container'),
        product: results.product,
        brand: results.brand,
        onProductInfo: function() {
            app_controller.openInternalPage("#product-results");
        },
        onFAQ: function() {
            app_controller.openInternalPage("#faq-page");
        },
        onContactUs: function() {
            app_controller.openInternalPage("#how-can-we-help");
        },
        onWhereToBuy: function() {
            app.minimizeSidebar();
                             
                             console.log('w2b');
            if(brand && brand.participating && 'undefined' != typeof brand.locator.participating_message && brand.locator.participating_message!=""  && brand.locator.participating_message != null)
            {
                             console.log('123'+brand.locator.participating_message);
                alert_modal.show("Message", brand.locator.participating_message);
            }
            if(!settings_manager.get().has_allowed_directions) {
                //app_controller.openInternalPage("#allow-location-page");
                confirmation_util.showYesNo('<h4 class="text-center">Will you please allow Action! to access your current location?</h4>',
                    function() {
                        var settings = settings_manager.get();
                        settings.has_allowed_directions = true;
                        settings_manager.save(settings);

                        app_controller.openInternalPage("#where-to-buy", {
                            hide_from_history: true
                        });
                        return false;
                    }, function() {
                        //app_controller.openInternalPage("#where-to-buy");
                        //window.history.go(-1);
                        window.history.back();
                        return false;
                    }
                );
            } else {
                app_controller.openInternalPage("#where-to-buy");
            }
        }
    });

    if(typeof(results.product) != 'undefined' && typeof(results.product.promo_images) != 'undefined' && results.product.promo_images.length > 0) {
        this.promoImageContainer.html('<img src="' + general_util.processImageLink(results.product.promo_images[0]) + '">');
    } else {
        this.promoImageContainer.html('');
    }

    /*
    if(this.product_info.brand) {
        this.pageContainer.find('.brand-name').html(this.product_info.brand.name);
    }
    */

    this.pageContainer.trigger('create');
};

ProductMenuPage.prototype.onReplyBegan = function(product_info, reply_id) {
    this.onProductConfirmed(product_info);
};