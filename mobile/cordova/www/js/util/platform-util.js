var platform_util = (function() {

    function isMobile() {
        return navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/);
    }

    function isApple() {
        return navigator.userAgent.match(/(iPhone|iPod|iPad)/);
    }

    function isAndroid() {
        return navigator.userAgent.match(/Android/);
    }

    function getPlatformString() {
        if(isAndroid()) {
            return 'android';
        } else if(isApple()) {
            return 'ios';
        }
        return 'web';
    }

    // returns array (e.g. [4,2,1] for v4.2.1)
    function getAndroidVersion() {
        var ua = navigator.userAgent.toLowerCase();
        var match = ua.match(/android\s([0-9\.]*)/);
        if(!match) {
            return [];
        }

        return match[1].split('.');
    }

    function iOSversion() {
        if (/iP(hone|od|ad)/.test(navigator.platform)) {
            // supports iOS 2.0 and later: <http://bit.ly/TJjs1V>
            var v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
            return [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || 0, 10)];
        }
    }

    function supportsSvg() {
        return isApple();

        // http://www.w3.org/TR/SVG11/feature#Image', '1.1' (path, etc)
        // http://www.w3.org/TR/SVG11/feature#BasicPaintAttribute, '1.1' (fill)
        //return document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#Image", "1.1") &&
        //    document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicPaintAttribute", "1.1")
    }

    return {
        isMobile: isMobile,
        isApple: isApple,
        isAndroid: isAndroid,
        getPlatformString: getPlatformString,
        iOSversion: iOSversion,
        getAndroidVersion: getAndroidVersion,
        supportsSvg: supportsSvg
    }
}(platform_util));