HistoryPage.prototype  = new PageController();
HistoryPage.prototype.constructor = HistoryPage;

function HistoryPage() {
}

HistoryPage.prototype.onPageReady = function() {
    this.pageContainer = $('#history-page');
};

HistoryPage.prototype.onPageBeforeShow = function() {
    window.scrollTo(80,0);
    var container = this.pageContainer.find('.user-message-container');
    var emoticonContainer = this.pageContainer.find('.rating-container');
    var resolvedSurveyContainer = this.pageContainer.find('.resolved-survey-container');

    header_widget.update('messages');

    this.initEmoticonSurvey(emoticonContainer, app_util.getRemoteUrl(), 'messages');
    this.initUserSurveys(resolvedSurveyContainer, app_util.getRemoteUrl(), app.caller._id, 'messages');

    emoticonContainer.removeClass('hidden');
    resolvedSurveyContainer.removeClass('hidden');
    $('a[href="#history-page"]').click(function(){
        container.find(".back-icon").click();
    });
    if(app && app.caller) {
        inbox_widget2.init(app_util.getRemoteUrl() + '/', container, app.caller._id, true, {
            onReply: function(reply_id, ean) {

                product_query.query(ean, app_util.isUsingWeb, 'search', function(results) {
                    if(results && results.length == 0) {
                        alert('No product was found for this reply');
                        return;
                    }

                    app.onReplyBegan(results, reply_id);
                });
            },

            onBack: function() {
                emoticonContainer.removeClass('hidden');
                resolvedSurveyContainer.removeClass('hidden');
            },

            onViewMessage: function() {
                emoticonContainer.addClass('hidden');
                resolvedSurveyContainer.addClass('hidden');
            }
        });
    }
};

HistoryPage.prototype.onPageBeforeHide = function() {
    $('#default-footer').removeClass("hidden");
};