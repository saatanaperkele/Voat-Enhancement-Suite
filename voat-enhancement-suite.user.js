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

        var excludesPageType = excludes.length && (RESUtils.isPageType.apply(RESUtils, excludes) || RESUtils.matchesPageRegex.apply(RESUtils, excludes));
        if (!excludesPageType) {
            var includesPageType = !includes.length || RESUtils.isPageType.apply(RESUtils, includes) || RESUtils.matchesPageRegex.apply(RESUtils, includes);
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
        var page = RESUtils.pageType();
        return Array.prototype.slice.call(arguments).some(function(e) {
            return (e === 'all') || (e === thisPage);
        });
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
};

var VESConsole = {
    getModulePrefs: function(moduid) {

    },
    setModulePrefs: function(prefs) {

    },
    // create console
    create: function() {

    },
};

/* MODULES
IDEAS:
+ post edited highlighter
+ user highlighter
+ username hider
+ keyboard navigator
*/

modules['VESDebugger'] = {
    moduid: 'VESDebugger',
    moduleName: 'VES Debugger',
    description: 'VES analytics for debugging.',
    options: {

    },
    isEnabled: function() {
        return VESConsole.getModulePrefs(this.moduid);
    },
    // include: [
    //     'all'
    // ],
    isMatchURL: function() {
        return VESUtils.isMatchURL(this.moduid);
    },
    go: function() {
        if ((this.isMatchURL())) {  // force run
        //if ((this.isEnabled()) && (this.isMatchURL())) {
            // do some basic logging.
            console.log('done: ' + Date());
            console.log('isVoat: ' + VESUtils.isVoat());
            console.log('pageType: ' + VESUtils.pageType());
            console.log('subverse: ' + VESUtils.currentSubverse());
        }
    },
};

modules['VoatingNeverEnds'] = {
    moduid: 'VoatingNeverEnds',
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
            RESUtils.addCSS();
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
    description: 'Adds a [l+c] link to open both the page\'s link and comments page in new tabs at once.',
    options: {},
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
            // will need a watcher for .sitetable for when VoatingNeverEnds loads next page
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
                    //console.log("thisLink -- " + thisLink);
                    var thisComments = (thisComments = entries[i].querySelector('.comments')) && thisComments.href;
                    //console.log("thisComments -- " + thisComments);
                    var thisUL = entries[i].querySelector('ul.flat-list');
                    var singleClickLI = document.createElement('li');
                    var singleClickLink = document.createElement('span');
                    singleClickLink.innerHTML = '[l+c]';
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
