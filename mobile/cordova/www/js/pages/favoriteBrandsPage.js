FavoriteBrandsPage.prototype  = new PageController();
FavoriteBrandsPage.prototype.constructor = FavoriteBrandsPage;

function FavoriteBrandsPage() {
}

FavoriteBrandsPage.prototype.onPageReady = function() {
    this.pageContainer = $('#favorite-brands');
    this.favoritesContainer = this.pageContainer.find('.user-favorites-container');
};

FavoriteBrandsPage.prototype.onPageBeforeShow = function() {
    var that = this;
    window.scrollTo(80,0);
    this.favoritesContainer.html('');
    header_widget.update('favorites');

    // get favorites
    app_util.makeRequest('GET', app_util.getRemoteUrl() + '/favorites?id=' + app.caller._id, {}, 'Loading Favorites',
        function(favorites_data) {

            // then, get opt-ins
            app_util.makeRequest('GET', app_util.getRemoteUrl() + '/opt-ins?id=' + app.caller._id, {}, 'Loading Opt-ins',
                function(optins_data) {

                    // fill in the favorites widget
                    favorites_widget.init({
                        user_id: app.caller._id,
                        container: that.favoritesContainer,
                        remote_url: app_util.getRemoteUrl(),
                        favorites: favorites_data,
                        opt_ins: optins_data,
                        onBrandSelected: function(id) {
                            app_controller.getPage('#brand').setBrandId(id);
                            app_controller.openInternalPage('#brand');
                        },
                        onProductSelected: function(id, ean) {
                            product_query.query(ean, app_util.isUsingWeb, 'search', function(results) {
                                if(results.length == 0) {
                                    alert('No results were found');
                                    return;
                                }

                                general_util.reportProductView(results);
                                app.confirmProduct(results);
                            });
                        }
                    });
                }, function(data) {
                    console.log(data);
                }
            );
        }, function(data) {
            console.log(data);
        }
    );
};
