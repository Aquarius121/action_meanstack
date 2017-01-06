CustomModalPage.prototype  = new PageController();
CustomModalPage.prototype.constructor = CustomModalPage;

function CustomModalPage() {

}

CustomModalPage.prototype.onPageReady = function() {
    this.pageContainer = $('#custom-modal');
};

CustomModalPage.prototype.onPageBeforeShow = function() {
    if(this.product_info && this.product_info.brand && this.product_info.brand.styling) {
        app_util.addCustomStyle(this.product_info.brand.styling);
    }
};

CustomModalPage.prototype.onPageBeforeHide = function() {
    app_util.removeCustomStyling();
};

CustomModalPage.prototype.onProductConfirmed = function(results) {
    this.product_info = results;
};
