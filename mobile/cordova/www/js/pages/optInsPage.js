OptInsPage.prototype  = new PageController();
OptInsPage.prototype.constructor = OptInsPage;

function OptInsPage() {
}

OptInsPage.prototype.onPageReady = function() {
    this.pageContainer = $('#opt-ins');
    this.optInsContainer = this.pageContainer.find('.user-opt-ins-container');
};

OptInsPage.prototype.onPageBeforeShow = function() {
    var that = this;
    window.scrollTo(80,0);
    this.optInsContainer.html('');
    header_widget.update('brand opt-ins');

    app_util.makeRequest('GET', app_util.getRemoteUrl() + '/opt-ins?id=' + app.caller._id, {}, 'Loading Opt-ins',
        function(optins_data) {

            // fill in the favorites widget
            opt_ins_widget.init({
                user_id: app.caller._id,
                container: that.optInsContainer,
                remote_url: app_util.getRemoteUrl(),
                opt_ins: optins_data,
                onBrandSelected: function(id) {
                    app_controller.getPage('#brand').setBrandId(id);
                    app_controller.openInternalPage('#brand');
                }
            });
        }, function(data) {
            console.log(data);
        }
    );
};