FAQPage.prototype  = new PageController();
FAQPage.prototype.constructor = FAQPage;

function FAQPage() {
}

FAQPage.prototype.onPageReady = function() {
    this.pageContainer = $('#faq-page');
};

FAQPage.prototype.onProductConfirmed = function(results) {
    this.product_info = results;

    general_util.applyBestProductImage(results, this.pageContainer);
};

FAQPage.prototype.onReplyBegan = function(product_info, reply_id) {
    this.onProductConfirmed(product_info);
};

FAQPage.prototype.onPageBeforeShow = function() {
    window.scrollTo(80,0);
    header_widget.update('FAQ');
    this.tryApplyStyling(this.product_info);

    this.initEmoticonSurvey(this.pageContainer.find('.rating-container'), app_util.getRemoteUrl(), 'faq');

    product_faq_widget.init(this.pageContainer.find('div[data-role="content"]').find('.faq-content'),
        app_util.getRemoteUrl(),
        this.product_info.product,
        this.product_info.brand
    );
};

FAQPage.prototype.onPageBeforeHide = function() {
    app_util.removeCustomStyling();
};
