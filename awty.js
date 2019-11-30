/**
 * AWTY.js (Are we there yet?)
 *
 * Example usage:
 * var awty = new Awty();
 * awty.addAction('update', function () { console.log('Get a new configuration!'); });
 * awty.init({ key: 'foo' });
 *
 */
var Awty = (function Awty () {
    var _debug = 0, _key, __interval, __timr, _defaultAction, __actions = {}, _server = 'https://hwm.mr365.co';

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

    function _poll (newConf) {
        if (typeof newConf == 'string') _key = newConf;
        if (!newConf || typeof newConf != 'object') newConf = {};
        if (newConf.defaultAction) _defaultAction = newConf.defaultAction;
        if (newConf.server) _server = newConf.server;
        if (newConf.debug) _debug = newConf.debug;
        if (newConf.key) _key = newConf.key;
        var _st = new Date().getTime();

        if (!_key) return console.warn('Cannot init without assigning a key.');
        if (!jQuery || !$) return console.warn('Requires jQuery.');


        // Skip request if received WebSocket ping in last 30s
        if (window.__lastPingTs > (+ new Date()) - 30000) {
            clearTimeout(__timr);
            return __timr = setTimeout(_poll, 15000);

        } else {

            /**
             * Attempt to Init WebSocket connection
             */
            var u = _server.replace('http', 'ws') + '/ws/' + _key;
            window.__ws = new WebSocket(u);

            window.__ws.onopen = function () {
                if (_debug) console.log('ws opened', arguments);
                window.__lastPingTs = + new Date();
            };

            window.__ws.onclose = function () {
                if (_debug) console.log('ws closed');
                window.__lastPingTs = 0;
            };

            window.__ws.onmessage = function (cmd) {
                if (_debug) console.log('ws cmd', cmd.data);

                window.__lastPingTs = + new Date();
                if (cmd.data == 'hb') return;

                // Process commands
                var cmds = cmd.data ? cmd.data.split(',') : [];

                cmds.forEach(function (command) {
                    if (__actions[command] && typeof __actions[command] == 'function') __actions[command]();
                });

                // Default action
                if (_defaultAction && typeof _defaultAction == 'function') _defaultAction(cmd);
            };
        }

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
