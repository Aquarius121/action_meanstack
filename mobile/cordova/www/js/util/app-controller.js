// controls page visibility
// NO APP-SPECIFIC STUFF SHOULD BE IN HERE!

// usage:
// - for each page, do app_Controller.addPage(...);
// - then, call app_controller.init();
// - at the app-level, add something like:
//     window.onhashchange = function(evt) {
//         app_controller.onPageChanged(app_controller.getActivePage());
//     };

var app_controller = (function() {

    var active_page;
    var page_controllers = {};
    var pages_requiring_login = [];
    var pages_visited = [];
    var max_pages_visited = 5;

    function init(pages_to_require_login) {
        $('div[data-role=page]').addClass('hidden');

        pages_requiring_login = pages_to_require_login;
    }

    function onReady() {
        console.log('calling onReady for pages');
        forEachPage(function(page) {
            page.onPageReady();
        });
        onPageChanged(getActivePage());
    }

    function forEachPage(functor) {
        Object.keys(page_controllers).forEach(function(page_key) {
            functor(page_controllers[page_key]);
        });
    }

    function addPage(id, page) {
        page.setId(id);
        page_controllers[id] = page;
    }

    function getActivePage() {
        if(window.location.hash) {
            return window.location.hash;
        }
        return active_page;
    }

    function getVisitedPages() {
        return pages_visited;
    }

    function getPage(id) {
        return page_controllers[id];
    }

    function openExternalPage(pageUrl) {
        window.open(pageUrl, '_system');
    }

    function onPageChanged(pageSelectorString) {

        // add the page selector to the list of visited pages
        pages_visited.push(pageSelectorString);

        // respect the limit on how many page views we track
        if(max_pages_visited < pages_visited.length) {
            pages_visited.shift();
        }

        // ensure protected pages are viewed by logged in users
        if(_pageRequiresLogin(pageSelectorString) && !app.caller) {
            alert_modal.show('Notice', 'This page requires an Action! account', function() {
                app.login_referrer = pageSelectorString; // TODO: YUCK
                app_controller.openInternalPage('#login', 'none'); // TODO: parameterize
            });
            return;
        }

        // setTimeout is used so we can take the function's context out of any sort of jquery/DOM call-stack
        //setTimeout(function() {
            var pageToHide = page_controllers[active_page];
            var pageToShow = page_controllers[pageSelectorString];

            if(pageToHide) {
                pageToHide.onPageBeforeHide();

                $('div[data-role=page]').addClass('hidden');
            }

            if(pageToShow) {
                pageToShow.onPageBeforeShow();

                $(pageSelectorString).removeClass('hidden');
            }

            if(pageToHide) {
                pageToHide.onPageHide();
            }
            if(pageToShow) {
                pageToShow.onPageShow();

                app_util.redrawElement($('body'));
            }

            active_page = pageSelectorString;
        //}, 0);
    }

    function openInternalPage(pageSelectorString, options) {
        if(typeof(options) != 'undefined') {
            if(typeof(options.hide_from_history) != 'undefined') {
                if(options.hide_from_history) {
                    window.location.replace(pageSelectorString);

                    setTimeout(function() {
                        window.scrollTo(0, 0);
                    }, 0);
                    return;
                }
            }
        }

        window.location.href = pageSelectorString;

        setTimeout(function() {
            window.scrollTo(0, 0);
        }, 0);
    }

    // pages_back should be either undefined or positive
    function back(pages_back) {
        if(typeof(pages_back) == 'undefined') {
            window.history.back();
            return;
        }
        window.history.go(-pages_back);
    }

    function _pageRequiresLogin(selector) {
        return (pages_requiring_login.indexOf(selector) != -1);
    }

    return {
        init: init,
        addPage: addPage,
        onReady: onReady,

        forEachPage: forEachPage,

        onPageChanged: onPageChanged,
        openExternalPage: openExternalPage,
        openInternalPage: openInternalPage,
        back: back,

        getPage: getPage,
        getActivePage: getActivePage,
        getVisitedPages: getVisitedPages
    }
}());