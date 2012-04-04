(function () {
    var resizedByUs = false;
    var previousHeights;

    if (parent == window) return;

    var isWebKit = navigator.userAgent.indexOf("WebKit") > -1;
    var isOpera = navigator.userAgent.indexOf("Opera") > -1;
    var isIE = (function() {
        var div = document.createElement('div');
        div.innerHTML = '<!--[if IE]><i></i><![endif]-->';
        return (div.getElementsByTagName('i').length === 1);         
    }());

    var target = parent.postMessage ? parent : 
	(parent.document.postMessage ? parent.document : undefined);
    if (typeof target == "undefined") return;

    var mylog = function() {};
    //if (window['console'] !== undefined) { mylog = function(s) { console.log(s); }; } 
    //else { mylog = function(s) { alert(s); }; }
    
    var computeHeights = function() {
	var docElt = document.documentElement
	return docElt["clientHeight"] + " " + 
	    docElt["scrollHeight"] + "|" + document.body["scrollHeight"] + " " + 
	    docElt["offsetHeight"] + "|" + document.body["offsetHeight"];
    }

    var heightsChanged = function() {
	var heights = computeHeights();
	var changed = heights !== previousHeights;
	previousHeights = heights;
	if (changed) 
	    mylog("heights changed: " + heights)
	//else
	//    mylog("heights unchanged");
	return changed;
    };

    var computeHeight = function() {
	var docElt = document.documentElement;

	var height = isWebKit ? docElt["scrollHeight"] : // Chrome & Safari & Opera
	             isIE ? document.body["scrollHeight"] + 10 :
	             isOpera ? (docElt["offsetHeight"] > 20 ? docElt["offsetHeight"] : docElt["scrollHeight"]) :
	             docElt["offsetHeight"]; // Firefox
	return height;
    };
    var postMessageIframeHeight = function(kind) {
        var changed = heightsChanged();
	if (kind !== "load" && !changed) return;

	var height = computeHeight(kind);
	if (height > 20) {
	    mylog("sending height " + height);
	    target.postMessage("iframeHeight " + height, "*");
	    resizedByUs = true;
        }
    };

    var intervalId;
    var intervalCount = 0;

    var checkResize = function() {
        mylog("checkResize");
        intervalCount--;
        if (intervalCount == 0) {
           intervalId = clearInterval(intervalId);
        } else {
           postMessageIframeHeight("");
        }
    };

    var mayRegisterCheckResize = function() {
	mylog("mayRegisterCheckResize " + intervalId);
        if (!intervalId) {
           intervalId = setInterval(checkResize, 500);
        }
        intervalCount = 4;
    }


    var load = function(e) {
        //mylog("load");
        postMessageIframeHeight("load");
	mayRegisterCheckResize();
    };

    var windowResize = function(e) {
        mylog("windowResize");
	if (resizedByUs) {
	    mylog("new heights below ignored")
	    heightsChanged(); // compute new heights which surely must have changed
	    resizedByUs = false;
	} else {
	    postMessageIframeHeight("windowResize");
	}
	    
    };

    var click = function () {
	mylog("click");
	mayRegisterCheckResize();
    };

    if (window.addEventListener){
	if (document.doctype) {
	    window.addEventListener("load", load, false);
	    window.addEventListener("resize", windowResize, false);
	    document.addEventListener("click", click, false);
	}
	else
	    mylog("postMessage-resize-iframe-in-parent: no DOCTYPE, aborting");
    } else {
	// for IE
	var ie_has_doctype = function() {
	    var doctype = document.childNodes[0];
	    return doctype && doctype.data && 
		typeof doctype.data === "string" && 
		doctype.data.indexOf("DOCTYPE ") === 0;
	};
	if (ie_has_doctype()) {
	    window.attachEvent("onload", load);
	    window.attachEvent("onresize", windowResize);
	    document.attachEvent("onclick", click);
	}
	else
	    mylog("postMessage-resize-iframe-in-parent: no DOCTYPE found, aborting");
    }

    var loadCSS = function (url) {
	var fileref = document.createElement("link");
	fileref.setAttribute("rel", "stylesheet");
	fileref.setAttribute("type", "text/css");
	fileref.setAttribute("href", url);
	document.getElementsByTagName("head")[0].appendChild(fileref);
    };
    if (window['cssToLoadIfInsideIframe']) 
	loadCSS(window['cssToLoadIfInsideIframe']);

})();
