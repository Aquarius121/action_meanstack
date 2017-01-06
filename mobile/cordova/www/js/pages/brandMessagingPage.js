BrandMessagingPage.prototype  = new PageController();
BrandMessagingPage.prototype.constructor = BrandMessagingPage;

function BrandMessagingPage() {
}

BrandMessagingPage.prototype.onPageReady = function() {
    this.pageContainer = $('#brand-messaging');
};

BrandMessagingPage.prototype.onPageBeforeShow = function() {
    window.scrollTo(80,0);
    this.tryApplyStyling(this.product_info);

    this.fillInVideos();
};

BrandMessagingPage.prototype.onPageBeforeHide = function() {
    app_util.removeCustomStyling();

    var video_gallery = this.pageContainer.find('.video-gallery');
    var iframe_selector = video_gallery.find('iframe');
    if(iframe_selector.length > 0) {
        iframe_selector[0].contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
    }
    this.pageContainer.find('.video-gallery').html('')
};

BrandMessagingPage.prototype.onProductConfirmed = function(results) {
    this.product_info = results;

    // fill in product image
    if(results.product.images && results.product.images.length > 0) {
        this.pageContainer.find('img.product-image').attr('src', general_util.processImageLink(results.product.images[0]));
    } else {
        this.pageContainer.find('img.product-image').attr('src', '');
    }

    // fill in brand message
    if(results.product.brand_message && results.product.brand_message.length > 0) {
        this.pageContainer.find('.brand-message').html(results.product.brand_message);
    } else {
        this.pageContainer.find('.brand-message').html('');
    }

    this.pageContainer.trigger('create');
};

BrandMessagingPage.prototype.onReplyBegan = function(product_info, reply_id) {
    this.onProductConfirmed(product_info);
};

BrandMessagingPage.prototype.fillInVideos = function() {

    // fill in videos
    if(this.product_info.product.promo_videos && this.product_info.product.promo_videos.length > 0) {

        var video_html = '';
        this.product_info.product.promo_videos.forEach(function(video_url) {

            /*
            // TODO: maybe check that it's youtube?
            // if the video url has no params, add the enablejsapi param so we can pause the video
            if(video_url.indexOf('?') == -1) {
                video_html += '<iframe src="' + video_url + '?enablejsapi=1" frameborder="0" allowfullscreen=""></iframe>'; // width="420" height="315"
            } else {
                video_html += '<iframe src="' + video_url + '" frameborder="0" allowfullscreen=""></iframe>'; // width="420" height="315"
            }
            */

            video_html += '<iframe src="' + video_url + '" frameborder="0" allowfullscreen=""></iframe>'; // width="420" height="315"
        });
        this.pageContainer.find('.video-gallery').html(video_html);
    } else {
        this.pageContainer.find('.video-gallery').html('');
    }
};
