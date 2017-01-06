TermsAndConditionsPage.prototype  = new PageController();
TermsAndConditionsPage.prototype.constructor = TermsAndConditionsPage;

function TermsAndConditionsPage() {
}

TermsAndConditionsPage.prototype.onPageReady = function() {
    this.pageContainer = $('#terms-and-conditions');
    this.contentContainer = this.pageContainer.find('.content-container');
};

TermsAndConditionsPage.prototype.onPageBeforeShow = function() {
    var that = this;
    window.scrollTo(80,0);
    header_widget.update('terms and conditions');

    this.contentContainer.html('<div class="text-center">Loading...</div>');

    var url = app_util.getRemoteUrl() + '/config/terms-and-conditions';
    app_util.makeRequest('GET', url, {}, '',
        function(response_data) { // , text, jqXHR
            that.contentContainer.html(response_data.value);
            general_util.makeLinksSafe(that.contentContainer);
        },function(error) {
            that.contentContainer.html('Failed to load terms and conditions');
            //alert_modal.show('Error', 'an error occurred: ' + error.responseText);
        }
    );
};

TermsAndConditionsPage.prototype.onPageBeforeHide = function() {
};
