IndexPage.prototype  = new PageController();
IndexPage.prototype.constructor = IndexPage;

function IndexPage() {
}

IndexPage.prototype.onPageReady = function() {
    this.pageContainer = $('#index');

    var scanButton = this.pageContainer.find('button.scan-button');
    scanButton.unbind('click');
    scanButton.click(function() {
        app_controller.openInternalPage("#scan", "none");
        return false;
    });
};

IndexPage.prototype.onPageBeforeShow = function() {
    window.scrollTo(80,0);
    header_widget.update();
    header_widget.setRightNavVisible(false);
    $("#login").hide();
};

IndexPage.prototype.onPageBeforeHide = function() {
    header_widget.setRightNavVisible(true);
};