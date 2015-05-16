// ==UserScript==
// @name        Voat Enhancement Suite
// @version     0.01
// @description Suite of tools to enhance Voat's functionalities
// @author      travis
// @include     http://voat.co/*
// @include     https://voat.co/*
// @include     http://*.voat.co/*
// @include     https://*.voat.co/*
// @exclude
// @match
// @grant       none
// @require
// @noframes
// @downloadURL https://github.com/travis-g/Voat-Enhancement-Suite/raw/master/voat-enhancement-suite.user.js
// @updateURL   https://github.com/travis-g/Voat-Enhancement-Suite/raw/master/voat-enhancement-suite.user.js
// @icon
// ==/UserScript==

var VESversion = 0.01;


// some basic utils
function hasClass(e,c) {
    if ((typeof(e) == 'undefined') || (e == null)) {
        console.log(arguments,callee,caller);
        return false;
    }
    return ele.className.match(new RegExp('(\\s|^)'+c+'(\\s|$)'));
};
function addClass(e,c) {
    if (!hasClass(e,c)) e.className += " "+c;
};
function removeClass(e,c) {
    if (hasClass(e,c)) {
        var r = new RegExp('(\\s|^)'+c+'(\\s|$)');
        e.className = e.className.replace(r,' ');
    }
};
function insertAfter(target, node) {
    if ((typeof(target) == 'undefined') || (target == null)){
        console.log(arguments.callee.caller);
    } else if ((typeof(target.parentNode) != 'undefined') && (typeof(target.nextSibling) != 'undefined')) {
        target.parentNode.insertBefore( node, target.nextSibiling);
    }
};
function createElement(type, id, classname, textContent) {
    obj = document.createElement(type);
    if (id!=null) {
        obj.setAttribute('id',id);
    }
    if ((typeof classname !== 'undefined') && classname && (classname !== '')) {
        obj.setAttribute('class',classname);
    }
    if (textContent) {
        if (classname && classname.split(' ').indexOf('noCtrlF') !== -1) {
            obj.setAttribute('data-text', textContent);
        } else {
            obj.textContent = textContent;
        }
    }
    return obj;
};

var BrowserDetect = {
    init: function () {
        this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
        this.version = this.searchVersion(navigator.userAgent)
            || this.searchVersion(navigator.appVersion)
            || "an unknown version";
        this.OS = this.searchString(this.dataOS) || "an unknown OS";
    },
    searchString: function (data) {
        for (var i=0;i<data.length;i++) {
            var dataString = data[i].string;
            var dataProp = data[i].prop;
            this.versionSearchString = data[i].versionSearch || data[i].identity;
            if (dataString) {
                if (dataString.indexOf(data[i].subString) != -1)
                    return data[i].identity;
            }
            else if (dataProp)
                return data[i].identity;
        }
    },
    searchVersion: function (dataString) {
        var index = dataString.indexOf(this.versionSearchString);
        if (index == -1) return;
        return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
    },
    dataBrowser: [
        {
            string: navigator.userAgent,
            subString: "Chrome",
            identity: "Chrome"
        },
        {   string: navigator.userAgent,
            subString: "OmniWeb",
            versionSearch: "OmniWeb/",
            identity: "OmniWeb"
        },
        {
            string: navigator.vendor,
            subString: "Apple",
            identity: "Safari",
            versionSearch: "Version"
        },
        {
            prop: window.opera,
            identity: "Opera",
            versionSearch: "Version"
        },
        {
            string: navigator.vendor,
            subString: "iCab",
            identity: "iCab"
        },
        {
            string: navigator.vendor,
            subString: "KDE",
            identity: "Konqueror"
        },
        {
            string: navigator.userAgent,
            subString: "Firefox",
            identity: "Firefox"
        },
        {
            string: navigator.vendor,
            subString: "Camino",
            identity: "Camino"
        },
        {       // for newer Netscapes (6+)
            string: navigator.userAgent,
            subString: "Netscape",
            identity: "Netscape"
        },
        {
            string: navigator.userAgent,
            subString: "MSIE",
            identity: "Explorer",
            versionSearch: "MSIE"
        },
        {
            string: navigator.userAgent,
            subString: "Gecko",
            identity: "Mozilla",
            versionSearch: "rv"
        },
        {       // for older Netscapes (4-)
            string: navigator.userAgent,
            subString: "Mozilla",
            identity: "Netscape",
            versionSearch: "Mozilla"
        }
    ],
    dataOS : [
        {
            string: navigator.platform,
            subString: "Win",
            identity: "Windows"
        },
        {
            string: navigator.platform,
            subString: "Mac",
            identity: "Mac"
        },
        {
               string: navigator.userAgent,
               subString: "iPhone",
               identity: "iPhone/iPod"
        },
        {
            string: navigator.platform,
            subString: "Linux",
            identity: "Linux"
        }
    ]
};
BrowserDetect.init();

// Get firebug to show console.log
if (typeof(unsafeWindow) != 'undefined') {
    if ((typeof(unsafeWindow.console) != 'undefined') && (typeof(self.on) != 'function')) {
        console = unsafeWindow.console;
    } else if (typeof(console) == 'undefined') {
        console = {
            log: function(str) {
                return false;
            }
        };
    }
}

// for applying VESUtils.css
function injectCSS(css) {
    // make a new <style/> tag
    var style = document.createElement('style');
    style.textContent = css;
    // append the <style/> tag within <head>
    var head = document.getElementsByTagName('head')[0];
    if (head) {
        head.appendChild(style);
    }
};

var modules = new Array();

// common utils for modules
var VESUtils = {
    css: '',    // CSS for ALL of VES's modules
    addCSS: function(css) {
        this.css += css;
    },
    regexes: {
        all: /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\//i,
        inbox: /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\/messaging\/([\w\.\+]+)\//i,
        comments: /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\/v\/([\w\.\+]+)\/comments\/([\w\.\+]+)/i,
        user: /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\/user\/([\w\.\+]+)/i,
        //search:
        //submit: 
        subverse: /^https?:\/\/(?:[\-\w\.]+\.)?voat\.co\/v\/([\w\.\+]+)/i,
        //subversePostListing:
    },
    isVoat: function() {
        var currURL = location.href;
        return VESUtils.regexes.all.test(currURL);
    },
    isMatchURL: function() {
        if (!VESUtils.isVoat()) {
            return false;
        }
        var module = modules[moduid];
        if (!module) {
            console.warn("isMatchURL could not find module", moduid)
            return false;
        }

        var exclude = module.exclude,
            include = module.include;
        return VESUtils.matchesPageLocation(include, exclude);
    },
    matchesPageLocation: function() {
        includes = typeof includes === 'undefined' ? [] : [].concat(includes);
        excludes = typeof excludes === 'undefined' ? [] : [].concat(excludes);

        var excludesPageType = excludes.length && (VESUtils.isPageType.apply(VESUtils, excludes) || VESUtils.matchesPageRegex.apply(VESUtils, excludes));
        if (!excludesPageType) {
            var includesPageType = !includes.length || VESUtils.isPageType.apply(VESUtils, includes) || VESUtils.matchesPageRegex.apply(VESUtils, includes);
            return includesPageType;
        }
    },
    pageType: function() {

        if (typeof this.pageTypeSaved === 'undefined') {
            var pageType = '';
            var currURL = location.href;
            if (VESUtils.regexes.user.test(currURL)) {
                pageType = 'user';
            } else if (VESUtils.regexes.inbox.test(currURL)) {
                pageType = 'inbox';
            } else if (VESUtils.regexes.comments.test(currURL)) {
                pageType = 'comments';
            } else if (VESUtils.regexes.subverse.test(currURL)) {
                pageType = 'subverse';
            } else {
                pageType = 'linklist';
            }
            this.pageTypeSaved = pageType;
        }
        return this.pageTypeSaved;
    },
    isPageType: function(/*type1,type2*/) {
        var page = VESUtils.pageType();
        return Array.prototype.slice.call(arguments).some(function(e) {
            return (e === 'all') || (e === thisPage);
        });
    },
    getOptions: function(moduid) {
        //console.log("getting options for " + moduid);
        var thisOptions = localStorage.getItem('VESOptions.' + moduid);
        //console.log("thisOptions = " + thisOptions);
        var currentTime = new Date();
        if ((thisOptions) && (thisOptions != 'undefined') && (thisOptions != null)) {
            storedOptions = JSON.parse(thisOptions);
            codeOptions = modules[moduid].options;
            for (attrname in codeOptions) {
                if (typeof(storedOptions[attrname]) == 'undefined') {
                    storedOptions[attrname] = codeOptions[attrname];
                }
            }
            modules[moduid].options = storedOptions;
            localStorage.setItem('VESOptions.' + moduid, JSON.stringify(modules[moduid].options));
        } else {
            //console.log('getOptions: setting defaults');
            // nothing's been stored, so set defaults:
            localStorage.setItem('VESOptions.' + moduid, JSON.stringify(modules[moduid].options));
        }
        //console.log('getOptions: returning options for ' + moduid);
        return modules[moduid].options;
    },
    getURLParams: function() {
        var result = {}, queryString = location.search.substring(1),
            re = /([^&=]+)=([^&]*)/g, m;
        while (m = re.exec(queryString)) {
            result[decodeURLComponent(m[1])] = decodeURLComponent(m[2]);
        }
        return result;
    },
    currentSubverse: function(check) {
        if (typeof this.curSub === 'undefined') {
            var match = location.href.match(VESUtils.regexes.subverse);
            if (match !== null) {
                this.curSub = match[1];
                if (check) return (match[1].toLowerCase() === check.toLowerCase());
                return match[1];
            } else {
                if (check) return false;
                return null;
            }
        } else {
            if (check) return (this.curSub.toLowerCase() === check.toLowerCase());
            return this.curSub;
        }
    },
    currentUserProfile: function() {
        // TODO
    },
    stripHTML: function(str) {
        var regex = /<\/?[^>]+>/gi;
        str = str.replace(regex, '');
        return str;
    },
    // adds vendor prefixes to CSS snippits.
    cssVendorPrefix: function(css) {
        return '-webkit-' + css + ';' + '-o-' + css + ';' + '-moz-' + css + ';'
            + '-ms-' + css + ';' + css + ';';
    },
    loggedInUser: function(tryingEarly) {
        if (typeof this.loggedInUserCached === 'undefined') {
            var userLink = document.querySelector('#header-account > .logged-in > span.user > a');
            if ((userLink != null)) {
                this.loggedInUserCached = userLink.textContent;
                // does this element exist?
                //this.loggedInUserHashCached = document.querySelector('[name=uh]').value;
            } else {
                if (tryingEarly) {
                    delete this.loggedInUserCached;
                    //delete this.loggedInUserHashCached;
                } else {
                    this.loggedInUserCached = null;
                }
            }
        }
        return this.loggedInUserCached;
    },
    loggedInUserInfo: function(callback) {
        // TODO
    },
    click: function(obj, btn) {
        var evt = document.createEvent('MouseEvents');
        btn = btn || 0;
        evt.initMouseEvent('click', true, true, window.wrappedJSObject, 0, 1, 1, 1, 1, false, false, false, false, button, null);
        obj.dispatchEvent(evt);
    },
    mousedown: function(obj, btn) {
        var evt = document.createEvent('MouseEvents');
        btn = btn || 0;
        evt.initMouseEvent('mousedown', true, true, window.wrappedJSObject, 0, 1, 1, 1, 1, false, false, false, false, button, null);
        obj.dispatchEvent(evt);
    },
    elementInViewport: function(obj) {
        // TODO
    },
    elementUnderMouse: function(obj) {
        // TODO
    },
    isEmpty: function(obj) {
        for(var prop in obj) {
            if(obj.hasOwnProperty(prop)) return false;
        }
        return true;
    },
    openLinkInNewTab: function(url, focus) {
        if (typeof(chrome) != 'undefined') {
            thisJSON = {
                requestType: 'openLinkInNewTab',
                linkURL: url,
                button: focus
            }
            chrome.runtime.sendMessage(thisJSON, function(response) {
                return true;
            });
        } else if (typeof(safari) != 'undefined') {
            thisJSON = {
                requestType: 'openLinkInNewTab',
                linkURL: url,
                button: focus
            }
            safari.self.tab.dispatchMessage("openLinkInNewTab", thisJSON);
        } else if (typeof(opera) != 'undefined') {
            thisJSON = {
                requestType: 'openLinkInNewTab',
                linkURL: url,
                button: focus
            }
            self.postMessage(thisJSON);
        } else {
            window.open(url);
        }
    },

    runtime: {/* specified later */},
};

var VESConsole = {
    resetModulePrefs: function() {
        //console.log("resetModulePrefs(): resetting module prefs");
        prefs = {
            'debug': true,
            'voatingNeverEnds': true,
            'singleClick': false,
        };
        this.setModulePrefs(prefs);
        return prefs;
    },
    getAllModulePrefs: function() {
        //console.log('entering getAllModulePrefs()...')
        if (localStorage.getItem('VES.modulePrefs') != null) {
            var storedPrefs = JSON.parse(localStorage.getItem('VES.modulePrefs'));
        } else {
            //console.log('getAllModulePrefs: resetting stored prefs');
            // first time VES has been run
            storedPrefs = this.resetModulePrefs();
        }
        if (storedPrefs == null) {
            storedPrefs = {};
        }
        // create a JSON object to return all prefs
        //console.log('getAllModulePrefs: creating prefs object');
        var prefs = {};
        for (i in modules) {
            if (storedPrefs[i]) {
                prefs[i] = storedPrefs[i];
            } else if (storedPrefs[i] == null) {
                // new module! ...or no preferences.
                prefs[i] = true;
            } else {
                prefs[i] = false;
            }
        }
        if ((typeof(prefs) != 'undefined') && (prefs != 'undefined') && (prefs)) {
            return prefs;
        }
    },
    getModulePrefs: function(moduid) {
        //console.log('entered getModulePrefs for ' + moduid)
        if (moduid) {
            //console.log('running getModulePrefs for ' + moduid);
            var prefs = this.getAllModulePrefs();
            //console.log('getModulePrefs: returning prefs for ' + moduid);
            return prefs[moduid];
        } else {
            alert('no module name specified for getModulePrefs');
        }
    },
    setModulePrefs: function(prefs) {
        //console.log("setting VES.modulePrefs...")
        if (prefs != null) {
            localStorage.setItem('VES.modulePrefs', JSON.stringify(prefs));
            //this.drawModulesPanel(); // create settings panel for modules
            return prefs;
        } else {
            alert('error - no prefs specified');
        }
    },
    // create console
    create: function() {

    },
};

VESUtils.addCSS('.link .flat-list li span { font-weight: bold }');  // singleClick module


/* MODULES
IDEAS:
+ post edited highlighter
+ user highlighter
+ username hider
+ keyboard navigator
*/

modules['debug'] = {
    moduid: 'debug',
    moduleName: 'VES Debugger',
    description: 'VES analytics for debugging.',
    options: {

    },
    isEnabled: function() {
        //console.log('debug.isEnabled(): ' + VESConsole.getModulePrefs(this.moduid));
        return VESConsole.getModulePrefs(this.moduid);
    },
    include: [
        'all'
    ],
    isMatchURL: function() {
        //console.log('debug.isMatchURL(): ' + VESUtils.isMatchURL(this.moduid));
        return VESUtils.isMatchURL(this.moduid);
    },
    go: function() {
        //if ((this.isMatchURL())) {  // force run
        if ((this.isEnabled()) && (this.isMatchURL())) {
            // do some basic logging.
            console.log('done: ' + Date());
            console.log('isVoat: ' + VESUtils.isVoat());
            console.log('loggedInUser: ' + VESUtils.loggedInUser());
            console.log('pageType: ' + VESUtils.pageType());
            console.log('subverse: ' + VESUtils.currentSubverse());
        }
    },
};

modules['voatingNeverEnds'] = {
    moduid: 'voatingNeverEnds',
    moduleName: 'Voating Never Ends',
    description: 'Load the next page of Voat automatically.',
    options: {
        autoLoad: {
            value: true,
            description: 'Autoload next page on scroll (click to load if off)'
        },
        fadeDuplicates: {
            value: true,
            description: 'Fade any duplicate entries'
        }
    },
    isEnabled: function() {
        return VESConsole.getModulePrefs(this.moduid);
    },
    include: [
        'all'
    ],
    exclude: [
        'comments'
    ],
    isMatchURL: function() {
        return VESUtils.isMatchURL(this.moduid);
    },
    go: function() {
        if ((this.isEnabled()) && (this.isMatchURL())) {
            VESUtils.addCSS();
            // getNextPrevLinks();
            // loadNewPage();
        }
    },
    getNextPrevLinks: function(e) {
        e = e || document.body;
        var links = {
            next: e.querySelector('.content .pagination-container a[rel~=next]'),
            prev: e.querySelector('.content .pagination-container a[rel~=prev]'),
        };

        if (!(links.next || links.prev)) links = false;
        return links;
    },
    loadNewPage: function() {
        // fromBackButton
        if (this.isLoading != true) {
            // change loading indicator
            this.isLoading = true;
            GM_xmlhttpRequest({
                method: "GET",
                //url: '',
                onload: function(response) {
                    // crazy http response processing/injection
                }
            });
        } else {
            console.log("load new page ignored");
        }
    },
};

modules['singleClick'] = {
    moduid: 'singleClick',
    moduleName: 'Single Click',
    description: 'Adds an [l+c] link that opens a link and the comments page in new tabs for you in one click.',
    options: {
        openOrder: {
            type: 'enum',
            values: [
                { name: 'open comments then link', value: 'commentsfirst' },
                { name: 'open link then comments', value: 'linkfirst' }
            ],
            value: 'commentsfirst',
            description: 'What order to open the link/comments in.'
        },
        hideLEC: {
            type: 'boolean',
            value: true,
            description: 'Hide the [l=c] where the link is the same as the comments page'
        }
    },
    isEnabled: function() {
        return VESConsole.getModulePrefs(this.moduid);
    },
    inlude: [
        'all',
    ],
    exclude: [
        'comments',
    ],
    isMatchURL: function() {
        return VESUtils.isMatchURL(this.moduid);
    },
    go: function() {
        //if ((this.isMatchURL())) {    // force run
        if ((this.isEnabled()) && (this.isMatchURL())) {
            this.applyLinks();
            // watch for changes to .sitetable, then reapply
            //VESUtils.watchForElement('sitetable', modules['singleClick'].applyLinks);
            document.body.addEventListener('DOMNodeInserted', function(event) {
                if ((event.target.tagName == 'DIV') && (event.target.getAttribute('class') == 'sitetable')) {
                    modules['singleClick'].applyLinks();
                }
            }, true);
        }
    },
    applyLinks: function(ele) {
        ele = ele || document;
        var entries = ele.querySelectorAll('.sitetable>.submission .entry'); // beware of .alert-featuredsub!
        for (var i = 0, len = entries.length; i < len; i++) {
            if ((typeof entries[i] !== 'undefined') && (!entries[i].classList.contains('lcTagged'))) {
                entries[i].classList.add('lcTagged');
                this.titleLA = entries[i].querySelector('A.title');
                if (this.titleLA !== null) {
                    var thisLink = this.titleLA.href;
                    // check if it's a relative path (no http://)
                    if (!(thisLink.match(/^http/i))) {
                        thisLink = 'http://' + document.domain + thisLink;
                    }
                    //console.log("thisLink -- " + thisLink);
                    var thisComments = (thisComments = entries[i].querySelector('.comments')) && thisComments.href;
                    //console.log("thisComments -- " + thisComments);
                    var thisUL = entries[i].querySelector('ul.flat-list');
                    var singleClickLI = document.createElement('li');
                    var singleClickLink = document.createElement('span');
                    if (thisLink != thisComments) {
                        singleClickLink.innerHTML = '[l+c]';
                    } else if (!(this.options.hideLEC.value)) {
                        singleClickLink.innerHTML = '[l=c]';
                    }
                    singleClickLI.appendChild(singleClickLink);
                    thisUL.appendChild(singleClickLI);
                    singleClickLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        // check if it's a relative link (no http://domain) because chrome barfs on these when creating a new tab...
                        var thisLink = this.getAttribute('thisLink')
                        // some json crap specific to chrome/safari used to be here...
                        // some if-else using the future options for the module about which link opens first
                        window.open(this.getAttribute('thisLink'));
                        if (this.getAttribute('thisLink') != this.getAttribute('thisComments')) {
                            window.open(this.getAttribute('thisComments'));
                        }
                    }, true);
                }
            }
        }
    },
};


(function(u) {
    // load all the VES modules
    for (i in modules) {
        moduid = i;
        modules[moduid].go();
    }
    // inject all VES modules' CSS
    injectCSS(VESUtils.css);

})();
