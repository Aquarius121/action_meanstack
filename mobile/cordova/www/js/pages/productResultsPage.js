ProductResultsPage.prototype  = new PageController();
ProductResultsPage.prototype.constructor = ProductResultsPage;

function ProductResultsPage() {
}

ProductResultsPage.prototype.onPageReady = function() {
    this.pageContainer = $('#product-results');
    this.accordion_container = this.pageContainer.find('.accordion-container');



    /*
    var content_div = $('body > .content');
    var trigger = $('body > .nav-trigger');
    var sidebar = $('body > .sidebar');
    var trigger_label = content_div.find('.hamburger-label');

    var bind_events = "click";

    if(platform_util.isMobile() && platform_util.isApple()) {
        bind_events = "touchstart";
    }

    trigger_label.bind(bind_events, function(e) {
        that.toggleSidebar();
        return false;
    });
    */
    //console.log(this.accordion_container.find('a'));
};

ProductResultsPage.prototype.onPageBeforeShow = function() {
    window.scrollTo(80,0);
    if(this.product_info && this.product_info.brand && this.product_info.brand.styling) {
        app_util.addCustomStyle(this.product_info.brand.styling);
    }
    this.initEmoticonSurvey(this.pageContainer.find('.rating-container'), app_util.getRemoteUrl(), 'product-info');

    var accordian = $('#product-accordion > .accordion-group > .accordion-heading');
    console.log(accordian);
    var bind_events = "click";

    if(platform_util.isMobile() && platform_util.isApple()) {
        bind_events = "touchstart";
    }
    if(device.version == "4.3" || device.version == "4.2.2" || device.version == "4.4.4")
    {
        $("#product-results").height(2500);
    }

    accordian.bind(bind_events,function(e){

        //$("#product-results").hide().show(0);
        //$("#product-results").show();

        /*
         setTimeout(function(){
         if(e.target.href.indexOf("#instructionsCollapse") != -1)
         {

         $("#product-results").hide();
         setTimeout(function(){  $("#product-results").show(0);},10);
         }
         },20);*/
        //alert("asdf");
    });
    if(this.show_promo) {
        this.show_promo = false;

        // make sure promo collapse is expanded, if it's contracted
        if(!this.pageContainer.find('#promoCollapse').hasClass('in')) {
            this.pageContainer.find('a[href=#promoCollapse]').trigger('click');
        }
    } else {
        // make sure promo collapse is contracted, if it's expanded
        if(this.pageContainer.find('#promoCollapse').hasClass('in')) {
            this.pageContainer.find('a[href=#promoCollapse]').trigger('click');
        }
    }
};

ProductResultsPage.prototype.onPageBeforeHide = function() {
    app_util.removeCustomStyling();
};

ProductResultsPage.prototype.onProductConfirmed = function(results) {
    this.product_info = results;

    general_util.applyBestProductImage(results, this.pageContainer);

    //product_summary_widget.init(app_util.getRemoteUrl(), results.product, results.brand, this.pageContainer.find('.data-dump'), app.caller);
    this.accordion_container.html('');
    product_accordion_widget.init(results.product, results.brand, this.accordion_container);

    this.pageContainer.trigger('create');
};

ProductResultsPage.prototype.onReplyBegan = function(product_info, reply_id) {
    this.onProductConfirmed(product_info);
};