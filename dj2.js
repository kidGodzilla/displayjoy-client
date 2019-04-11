/**
 * Are we there yet?
 */
var Awty = (function Awty () {
    var _debug = 0, _key, __interval, __timr, _defaultAction, __actions = {}, _server = 'https://hwm.meetingroom365.com';

    function rint (max) {
        return Math.floor(Math.random() * Math.floor(max));
    }

    function setKey (k) {
        _key = k;
    }

    function addAction (key, fn) {
        __actions[key] = fn;
    }

    function debugState () {
        console.log({  __interval: __interval, _server: _server, _debug: _debug, _key: _key });
    }

    function sendCommand (k, cmd) {
        $.get(_server + '/cmd/' + k + '/' + encodeURIComponent(cmd) + '?_=' + rint(999999999));
    }

    function _poll (newConf, cb) {
        if (typeof newConf == 'string') _key = newConf;
        if (!newConf || typeof newConf != 'object') newConf = {};
        if (newConf.defaultAction) _defaultAction = newConf.defaultAction;
        if (newConf.server) _server = newConf.server;
        if (newConf.debug) _debug = newConf.debug;
        if (newConf.key) _key = newConf.key;
        var _st = new Date().getTime();

        if (!_key) return console.warn('Cannot init without assigning a key.');
        if (!window.jQuery || !window.$) return console.warn('Requires jQuery.');

        $.get(_server + '/s/' + _key + '?_=' + rint(999999999), function (cmd) {
            var ms = new Date().getTime() - _st;

            // Process commands
            var cmds = cmd.split(',');

            cmds.forEach(function (command) {
                if (__actions[command] && typeof __actions[command] == 'function') __actions[command]();
            });

            // Adjust interval for next request
            __interval = Math.max(Math.min(ms * 12, 30000), 4800);

            // Default action and debugging
            if (_defaultAction && typeof _defaultAction == 'function') _defaultAction(cmd);
            if (_debug) console.log(ms, 'ms', '-', cmd, '-', __interval);

            // Make next request
            clearTimeout(__timr);
            __timr = setTimeout(_poll, __interval);
        }).fail(function () {
            clearTimeout(__timr);
            __timr = setTimeout(_poll, 7500);
        });

        if (cb && typeof cb === "function") cb();
    }

    if (_key) _poll();

    return function () {
        return {
            sendCommand: sendCommand,
            debugState: debugState,
            addAction: addAction,
            setKey: setKey,
            init: _poll
        };
    };
})();

/**
 * DisplayJoy Client Library
 * @constructor
 * @example
 * var dj = new DisplayJoy();
 */
var DisplayJoy = (function DisplayJoy (obj) {

    var getConfTimer, awty, _srvr = 'https://hwm.mr365.co', _APIURL = 'https://api.mr365.co';
    window._djConfig = Object.assign({}, obj);


    function setLocalStorage (key, value) {
        if (!key || !value) return false;

        try { localStorage.setItem(key, value) } catch (e) {
            if (window._debug) console.log(e);
            return false;
        }

        return true;
    }

    function getLocalStorage (key) {
        var result = '';

        try { result = localStorage.getItem(key) } catch (e) {
            if (window._debug) console.log(e);
            return result;
        }

        return result;
    }

    function getJSON (url, cb) {
        var xmlHttp = new XMLHttpRequest();

        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
                cb(xmlHttp.response);
        };

        xmlHttp.open("GET", url, true);
        xmlHttp.responseType = 'json';
        xmlHttp.send(null);
    }

    function gConfUrl (key) {
        return 'https://mr365confs.b-cdn.net/key-' + key + '.json';
    }

    function setConfig (config) {
        window.__deviceConfiguration = config;
    }

    function handleUpdate (msg) {
        if (window.getConfiguration) window.getConfiguration();
        else getConfiguration();
        if (window._debug) console.log('getConfiguration', msg);
    }

    function handleRestart () {
        if (window.restartApp && typeof window.restartApp === 'function')
            window.restartApp();
    }

    function getConfiguration (cb) {

        clearTimeout(getConfTimer); // Debounce

        getConfTimer = setTimeout(function () {

            if (window.getConfig && typeof window.getConfig === "function")
                window.getConfig();

            else {
                if (!window.__displayKey) return;

                var displayKey = window.__displayKey;
                displayKey = displayKey.replace('mgr-', '');

                getJSON(gConfUrl(displayKey), function (data) {
                    if (data && typeof data === 'object') {
                        if (window.applyConfiguration) applyConfiguration(data);
                        else window.displayConfig = data;
                        if (window._debug) console.log('Device configuration:', data);
                    }
                });
            }
        }, 900);

        if (cb && typeof cb === "function") cb();
    }

    function calculateAnalytics () {
        var MR365EPOCH = 1454212801000;
        var truncatedTimestamp = Math.floor(((+ new Date) - MR365EPOCH) / (5 * 60 * 1000));

        if (!window.__uptime) window.__uptime = getLocalStorage('__uptime');
        if (window.__uptime && typeof window.__uptime === 'string') window.__uptime = window.__uptime.split(',');
        if (!window.__uptime) window.__uptime = [];

        if (window.__uptime.indexOf(truncatedTimestamp) === -1) {
            window.__uptime.push(truncatedTimestamp);

            var uptimeString = window.__uptime.join(',').replace(/"/g,"");
            setLocalStorage('__uptime', uptimeString);
        }
    }

    function updateStatus (obj, cb) {
        if (!window.__displayKey) return;

        try { obj = JSON.parse(obj) } catch (e) {}
        if (!obj || typeof obj !== 'object') obj = {};

        obj.displayKey = window.__displayKey;
        obj.site = location.hostname;

        if (__uptime && Array.isArray(__uptime)) {
            var uptimeString = __uptime.join(',').replace(/"/g,"");

            if (!window.__lastUptimeString || window.__lastUptimeString != uptimeString) {
                obj.uptime = uptimeString;
                window.__lastUptimeString = uptimeString;
            }
        }

        if (obj.meetings && !Object.keys(obj.meetings).length) delete obj.meetings;

        // Attempt to remove invalid characters which may cause a bug
        try { obj = JSON.parse(obj.toString().trim()) } catch (e) {} // silent

        // POST updated state
        if (!window.$ || !_APIURL) return;
        $.post(_APIURL + '/displaystate', obj, function () {
            // Todo: Received
        });

        if (cb && typeof cb === "function") cb();
    }

    function addAction (key, fn) {
        if (!awty) return console.warn('Uninstantiated instance of DisplayJoy cannot listen for events.');
        awty.addAction(key, fn);
    }

    function initialize (cb) {
        if (window._djConfig && window._djConfig.server) _srvr = window._djConfig.server;
        if (window._djServerUrl) _srvr = window._djServerUrl;

        // Do not proceed if we've already initialized
        if (awty && cb && typeof cb === "function") return cb();

        awty = new Awty();
        addAction('restart', handleRestart); // Todo: move out
        addAction('update', handleUpdate); // Todo: move out

        // Initialize uptime analytics
        clearInterval(window._calculateAnalyticsTimer);
        window._calculateAnalyticsTimer = setInterval(calculateAnalytics, 60 * 1000);
        calculateAnalytics();

        if (cb && typeof cb === "function") cb();
    }

    function init (key, cb) {
        window.__displayKey = key;
        setLocalStorage('_displayKey', key);

        initialize(function () {
            awty.init({ key: key, server: _srvr }, cb);
        });
    }


    /**
     * Create / export globals
     */
    window.DisplayJoy = {};

    DisplayJoy.getConfiguration = getConfiguration;
    //DisplayJoy.setLocalStorage = setLocalStorage;
    //DisplayJoy.getLocalStorage = getLocalStorage;
    //DisplayJoy.getSearchParam = getSearchParam;
    //DisplayJoy.coerceBoolean = coerceBoolean;
    DisplayJoy.updateStatus = updateStatus;
    //DisplayJoy.checkLatency = checkLatency;
    DisplayJoy.initialize = initialize;
    //DisplayJoy.dayOfWeek = dayOfWeek;
    DisplayJoy.setConfig = setConfig;
    DisplayJoy.identify = identify;
    //DisplayJoy.latency = latency;
    //DisplayJoy.setKey = setKey;
    //DisplayJoy.month = month;
    DisplayJoy.on = addAction;
    //DisplayJoy.ampm = ampm;
    //DisplayJoy.ping = ping;
    DisplayJoy.init = init;
    //DisplayJoy.hrs = hrs;
    //DisplayJoy.tp = tp;

    return function () {
        return DisplayJoy;
    };

})();
