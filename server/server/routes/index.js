var user_util = require('../util/user-utils');
var brands = require('./brands');

module.exports = {
    index_get: _handleIndexGet,
    sitemap: _handleSitemap,
    robots: _handleRobots,
    coming_attractions_get: _handleComingAttractionsGet,
    video_chat: _handleVideoChatGet,
    intro_get: _handleIntroGet
};

function _handleIndexGet(req, res){
    var caller = user_util.getCaller(req);

    if(!caller) {
        res.render('index', {
            caller: caller,
            title: 'Home',
            url: req.url
        });
        return;
    }
    caller.firstVisit = true;
    if(caller.role == 'admin') {
        res.render('admin-dashboard', {
            caller: caller,
            title: 'Dashboard',
            url: req.url
        });
    } else if(caller.role == 'brand-manager') {
        brands.brands_view(req, res);
    } else {
        res.render('products-find', {
            caller: caller,
            title: 'Find Products',
            url: req.url
        });
    }
}

function _handleSitemap(req, res){
    res.render('sitemap', {
        url: req.url
    });
    return;
}

function _handleRobots(req, res){
    res.render('robots', {
        url: req.url
    });
    return;
}


function _handleIntroGet(req, res){
    var caller = user_util.getCaller(req);
    res.render('intro', {
        caller: caller,
        title: 'Take a tour',
        url: req.url
    });
}

function _handleComingAttractionsGet(req, res) {
    var caller = user_util.getCaller(req);
    res.render('coming-attraction', {
        caller: caller,
        title: 'Coming Attraction',
        url: req.url
    });
}

function _handleVideoChatGet(req, res) {
    var caller = user_util.getCaller(req);
    res.render('video-chat', {
        caller: caller,
        title: 'Video Chat',
        brand_id: req.param('brand_id'),
        url: req.url
    });
}