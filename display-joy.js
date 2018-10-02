/**
 * DisplayJoy Client Library
 * @constructor
 * @example
 * var dj = new DisplayJoy();
 */
var DisplayJoy = (function DisplayJoy (obj) {

    window._djConfig = Object.assign({}, obj);
    var socket, streamTo = null, that = this;


    /**
     * @function setLocalStorage
     * @memberof DisplayJoy
     * @desc Safely set a local storage key to a specific value
     * @param {string} key - localStorage key to set
     * @param {string} value - new localStorage value
     * @returns {Boolean} - returns true/false if operation succeeded without error.
     * @example
     * setLocalStorage('foo', 'bar'); // sets localStorage key `foo` to 'bar'
     */
    function setLocalStorage (key, value) {
        if (!key || !value) return false;

        try { localStorage.setItem(key, value) } catch (e) {
            console.log(e);
            return false;
        }

        return true;
    }

    /**
     * @function getLocalStorage
     * @memberof DisplayJoy
     * @desc Safely get a value for a specific local storage key
     * @param {string} key - localStorage key to get
     * @returns {string} - returns the value of the localStorage key
     * @example
     * getLocalStorage('foo'); // returns 'bar'
     */
    function getLocalStorage (key) {
        var result = '';

        try { result = localStorage.getItem(key) } catch (e) {
            console.log(e);
            return result;
        }

        return result;
    }

    /**
     * @function getSearchParam
     * @memberof DisplayJoy
     * @desc Safely get a search (query) parameter
     * @param {string} key - key of location.search value to get
     * @returns {string} - returns the value of the requested query param
     * @example
     * getSearchParam('name'); // returns 'foo' where ?name=foo
     */
    function getSearchParam (key) {
        var val = false;
        if (location.search.indexOf(key) !== -1) val = location.search.split(key + '=')[1];
        if (val && val.indexOf('&') !== -1) val = val.split('&')[0];
        return val;
    }

    /**
     * @function coerceBoolean
     * @memberof DisplayJoy
     * @desc coerces a boolean value from an unknown variable type
     * @param ins - incoming variable
     * @returns {boolean} - returns the boolean value of the incoming value
     * @example
     * coerceBoolean('true') // returns true
     * @example
     * coerceBoolean('tru dat') // returns true
     * @example
     * coerceBoolean(1) // returns true
     * @example
     * coerceBoolean(true) // returns true
     * @example
     * coerceBoolean(0) // returns false
     * @example
     * coerceBoolean(NaN) // returns false
     */
    function coerceBoolean (ins) {
        if (typeof ins === 'boolean') return ins; // Just pass it back if it's already a BOOLEAN
        if (String(ins) == 1) return true; // 1 -> true
        if (String(ins) == 0) return false; // 0 -> false
        if (typeof ins === 'number' && String(ins) === 'NaN') return false; // NaN -> false
        if (typeof ins === 'number') return true; // Would have already returned if zero
        if (typeof ins === 'string' && ins.toLowerCase() !== 'false') return true; // Evaluates all strings not like 'false' to true
        return String(ins).toLowerCase() == 'true'; // Evaluates true / false / 'true' / 'false' / 'True' / 'False' / 'TRUE' / etc.
    }

    function tp (n) {
        return n > 9 ? "" + n: "0" + n;
    }

    function hrs (n) {
        if (displayConfig.twentyfour) return n;
        return (n === 0 || n === 24) ? 12 : (n > 12 ? n - 12 : n);
    }

    function ampm (n) {
        if (displayConfig.twentyfour) return '';
        return n >= 12 ? 'pm' : 'am';
    }

    function dayOfWeek (i) {
        return i18n.daysOfWeek[i];
    }

    function month (i) {
        return i18n.months[i];
    }

    function setConfig (config) {
        window.__deviceConfiguration = config;
    }

    function setKey (key, cb) {
        console.log('setKey to', key);
        window.__displayKey = key;
        identify(cb);
    }

    function handleUpdate (msg) {
        getConfiguration();
        console.log('getConfiguration', msg);
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

    function getScript (url, callback) {
        var script = document.createElement('script');
        script.src = url;
        document.head.appendChild(script);
        setTimeout(callback, 1000);
    }

    function identify (cb) {
        updateStatus({}, function () {
            console.log('identify');
            getConfiguration(cb);
        });
    }

    function updateStatus (obj, cb) {
        if (!window.__displayKey) return;

        if (!obj || typeof obj !== 'object') obj = {};

        if (socket) {
            obj.displayKey = window.__displayKey;
            if (__uptime) obj.uptime = __uptime;
            obj.site = location.hostname;

            socket.emit('identify', obj);
            console.log('update status', obj);
            if (cb && typeof cb === "function") cb();
        }
    }

    function initialize (cb) {
        getScript('https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.1.1/socket.io.js', function () {
            socket = io('https://msg.meetingroom365.com');

            // We've received a request to identify ourselves. Do it.
            socket.on('identifyRequest', identify);

            // We've received an update. Go get it.
            socket.on('update', handleUpdate);

            // Initialize uptime analytics
            clearInterval(window._calculateAnalyticsTimer);
            window._calculateAnalyticsTimer = setInterval(calculateAnalytics, 60 * 1000);
            calculateAnalytics();

            // Announce that we have arrived.
            if (window.__displayKey) identify();
            console.log('initialized');

            if (cb && typeof cb === "function") cb();
        });
    }

    function init (key, cb) {
        initialize(function () {
            setKey(key, cb);
        });
    }

    function getConfiguration (cb) {
        if (!window.__displayKey) return;

        var url = 'https://static.meetingroom365.com/config/key-' + window.__displayKey + '.json';

        getJSON(url, function (data) {
            if (data && typeof data === 'object') {

                if (window.applyConfiguration) applyConfiguration(data);
                else window.displayConfig = data;
                console.log('Device configuration:', data);
            }

            if (cb && typeof cb === "function") cb();
        });
    }

    function ping () {
        if (socket) socket.emit('ping', { to: streamTo, content: 'ping' });
        console.log('ping');
    }

    // Track uptime & analytics
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


    /**
     * Create / export globals
     */
    window.DisplayJoy = {};

    DisplayJoy.getConfiguration = getConfiguration;
    DisplayJoy.setLocalStorage = setLocalStorage;
    DisplayJoy.getLocalStorage = getLocalStorage;
    DisplayJoy.getSearchParam = getSearchParam;
    DisplayJoy.coerceBoolean = coerceBoolean;
    DisplayJoy.updateStatus = updateStatus;
    DisplayJoy.initialize = initialize;
    DisplayJoy.dayOfWeek = dayOfWeek;
    DisplayJoy.setConfig = setConfig;
    DisplayJoy.identify = identify;
    DisplayJoy.setKey = setKey;
    DisplayJoy.month = month;
    DisplayJoy.ampm = ampm;
    DisplayJoy.ping = ping;
    DisplayJoy.init = init;
    DisplayJoy.hrs = hrs;
    DisplayJoy.tp = tp;

    return function () {
        return DisplayJoy;
    };

})();
