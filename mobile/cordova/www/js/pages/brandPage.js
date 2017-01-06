BrandPage.prototype  = new PageController();
BrandPage.prototype.constructor = BrandPage;

function BrandPage(productConfirmCallback) {
    this.brandId = null;
    this.pageContainer = null;
    this.resultsCallback = productConfirmCallback;
}

BrandPage.prototype.onPageReady = function() {
    this.pageContainer = $('#brand');
};

BrandPage.prototype.setBrandId = function(id) {
    this.brandId = id;
};

BrandPage.prototype.onPageBeforeShow = function() {
    window.scrollTo(80,0);
    var that = this;

    header_widget.update('brand');

    brand_summary_widget.init({
        container: this.pageContainer.find('.brand-info-container'),
        brand_id: this.brandId,
        remote_url: app_util.getRemoteUrl(),
        caller: app.caller
    });

    //this.tryApplyStyling(this.product_info);
    brand_products_widget.init({
        container: this.pageContainer.find('.results-container'),
        brand_id: this.brandId,
        remote_url: app_util.getRemoteUrl(),
        onSelected: function(ean) {
            product_query.query(ean, app_util.isUsingWeb, 'search', function(results) {
                if(results.length == 0) {
                    alert('No results were found');
                    return;
                }

                general_util.reportProductView(results);
                that.resultsCallback(results);
            });
        }
    });
};

BrandPage.prototype.onPageBeforeHide = function() {
    //app_util.removeCustomStyling();
};
