HowCanWeHelpPage.prototype  = new PageController();
HowCanWeHelpPage.prototype.constructor = HowCanWeHelpPage;

function HowCanWeHelpPage() {
}

HowCanWeHelpPage.prototype.onPageReady = function() {

    this.pageContainer = $('#how-can-we-help');
};

HowCanWeHelpPage.prototype.onProductConfirmed = function(results) {
    this.product_info = results;

    this.applyProductImages(results, this.pageContainer);

    this.pageContainer.trigger('create');
};

HowCanWeHelpPage.prototype.onReplyBegan = function(product_info, reply_id) {
    this.onProductConfirmed(product_info);
};

HowCanWeHelpPage.prototype.onPageBeforeShow = function() {
    header_widget.update('Contact Us');
    window.scrollTo(80,0);
    this.tryApplyStyling(this.product_info);
};

HowCanWeHelpPage.prototype.onPageBeforeHide = function() {
    app_util.removeCustomStyling();
};