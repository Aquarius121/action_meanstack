NotParticipatingPage.prototype  = new PageController();
NotParticipatingPage.prototype.constructor = NotParticipatingPage;

function NotParticipatingPage() {

}

NotParticipatingPage.prototype.onPageShow = function() {
    window.scrollTo(80,0);
    auto_message_utils.tryShowAutoMessage(this.product_info);
};

NotParticipatingPage.prototype.onPageReady = function() {
    this.pageContainer = $('#not-participating');
};

NotParticipatingPage.prototype.onProductScanned = function(results) {
    this.product_info = results;
    _notParticipatingPageProductConfirmation(this.pageContainer, results);
};

NotParticipatingPage.prototype.onProductConfirmed = function(results) {
    this.product_info = results;
    _notParticipatingPageProductConfirmation(this.pageContainer, results);
};

NotParticipatingPage.prototype.onReplyBegan = function(product_info, reply_id) {
    this.onProductConfirmed(product_info);
};

function _notParticipatingPageProductConfirmation(container, results) {
    var notParticipatingContainer = $('#product-results');

    container.find('.data-dump').html('');

    if(!!results && !!results.product) {
        product_summary_widget.init(app_util.getRemoteUrl(), results.product, results.brand, container.find('.data-dump'), app.caller);
        notParticipatingContainer.trigger('create');
    }
}
