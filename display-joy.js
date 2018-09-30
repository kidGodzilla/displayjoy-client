/**
 * DisplayJoy Client Library
 * @constructor
 * @example
 * var dj = new DisplayJoy();
 */
var DisplayJoy = (function DisplayJoy () {

    var that = this;


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



    // Include MQTT client

    // Include or Require jQuery ?


    function init () {}

    function setId () {}

    function setKey () {}

    function ping () {}

    function setRegistry () {}


    function getConfiguration () {}

    function subscribeToConfigurationUpdates () {}































    // Create / export globals
    window.DisplayJoy = {};
    DisplayJoy.setLocalStorage = setLocalStorage;
    DisplayJoy.getLocalStorage = getLocalStorage;
    DisplayJoy.getSearchParam = getSearchParam;
    DisplayJoy.coerceBoolean = coerceBoolean;

    DisplayJoy.tp = tp;
    DisplayJoy.hrs = hrs;
    DisplayJoy.ampm = ampm;
    DisplayJoy.month = month;
    DisplayJoy.dayOfWeek = dayOfWeek;



    return function () {
        return DisplayJoy;
    };

})();
