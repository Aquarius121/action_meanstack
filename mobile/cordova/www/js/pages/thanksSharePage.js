ThanksSharePage.prototype  = new PageController();
ThanksSharePage.prototype.constructor = ThanksSharePage;

function ThanksSharePage() {
}

ThanksSharePage.prototype.onPageReady = function() {
    this.pageContainer = $('#thanks-share');
    this.brandNameElement = this.pageContainer.find('.brand-name-text');
};

ThanksSharePage.prototype.onPageBeforeShow = function() {
    window.scrollTo(80,0);
    $('#default-footer').addClass("hidden");
};

ThanksSharePage.prototype.onPageBeforeHide = function() {
    $('#default-footer').removeClass("hidden");
};

ThanksSharePage.prototype.onProductConfirmed = function(results) {
    this.applyProductImages(results, this.pageContainer);

    // put the correct brand name
    if(typeof(results) == 'undefined' || typeof(results.brand) == 'undefined' || typeof(results.brand.name) == 'undefined') {
        this.brandNameElement.html('we');
    } else {
        this.brandNameElement.html(results.brand.name);
    }

    this.product_info = results;
    this.pageContainer.trigger('create');
};

ThanksSharePage.prototype.onReplyBegan = function(product_info, reply_id) {
    this.onProductConfirmed(product_info);
};