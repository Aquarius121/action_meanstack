ProductConfirmPage.prototype  = new PageController();
ProductConfirmPage.prototype.constructor = ProductConfirmPage;

function ProductConfirmPage(results_callback, deny_callback) {
    this.results_callback = results_callback;
    this.deny_callback = deny_callback;
}

ProductConfirmPage.prototype.onPageReady = function() {
    this.pageContainer = $('#product-confirm');
    this.yes_button = this.pageContainer.find('a.confirm-product-yes');
    this.no_button = this.pageContainer.find('a.confirm-product-no');
    this.product_image = this.pageContainer.find('img.product-image');
};

ProductConfirmPage.prototype.onPageBeforeShow = function() {
    window.scrollTo(80,0);
    if(this.product_info && this.product_info.brand && this.product_info.brand.styling) {
        app_util.addCustomStyle(this.product_info.brand.styling);
    }
};

ProductConfirmPage.prototype.onPageBeforeHide = function() {
    app_util.removeCustomStyling();
};

ProductConfirmPage.prototype.onProductScanned = function(product_info) {
    this.product_info = product_info;

    var that = this;

    if(!product_info || !product_info.product) {
        return;
    }

    if(product_info.product.images && product_info.product.images.length > 0) {
        this.product_image.attr('src', general_util.processImageLink(product_info.product.images[0]));
    } else {
        this.product_image.attr('src', '');
    }

    // app reference stinks
    product_summary_widget.init(app_util.getRemoteUrl(), product_info.product, product_info.brand, this.pageContainer.find('.data-dump'), app.caller);

    this.yes_button.unbind('click');
    this.yes_button.click(function() {
        that.results_callback(product_info);
        return false;
    });

    this.no_button.unbind('click');
    this.no_button.click(function() {
        that.deny_callback();
        return false;
    });
};
