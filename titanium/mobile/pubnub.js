/* ---------------------------------------------------------------------------
WAIT! - This file depends on instructions from the PUBNUB Cloud.
http://www.pubnub.com/account
--------------------------------------------------------------------------- */

/* ---------------------------------------------------------------------------
PubNub Real-time Cloud-Hosted Push API and Push Notification Client Frameworks
Copyright (c) 2011 TopMambo Inc.
http://www.pubnub.com/
http://www.pubnub.com/terms
--------------------------------------------------------------------------- */

/* ---------------------------------------------------------------------------
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
--------------------------------------------------------------------------- */

(function() {

/**
 * UTIL LOCALS
 */
var NOW    = 1
,   MAGIC  = /\$?{([\w\-]+)}/g
,   URLBIT = '/'
,   XHRTME = 140000;

/**
 * UNIQUE
 * ======
 * var timestamp = unique();
 */
function unique() { return'x'+ ++NOW+''+(+new Date) }

/**
 * LOG
 * ===
 * log('message');
 */
function log(message) { Ti.API.info(message) }

/**
 * EACH
 * ====
 * each( [1,2,3], function(item) { console.log(item) } )
 */
function each( o, f ) {
    if ( !o || !f ) return;

    if ( typeof o[0] != 'undefined' ) for ( var i = 0, l = o.length; i < l; )
        f.call( o[i], o[i], i++ );
    else for ( var i in o )
        o.hasOwnProperty    &&
        o.hasOwnProperty(i) &&
        f.call( o[i], i, o[i] );
}

/**
 * MAP
 * ===
 * var list = map( [1,2,3], function(item) { return item + 1 } )
 */
function map( list, fun ) {
    var fin = [];
    each( list || [], function( k, v ) { fin.push(fun( k, v )) } );
    return fin;
}

/**
 * GREP
 * ====
 * var list = grep( [1,2,3], function(item) { return item % 2 } )
 */
function grep( list, fun ) {
    var fin = [];
    each( list || [], function(l) { fun(l) && fin.push(l) } );
    return fin
}

/**
 * SUPPLANT
 * ========
 * var text = supplant( 'Hello {name}!', { name : 'John' } )
 */
function supplant( str, values ) {
    return str.replace( MAGIC, function( _, match ) {
        return ''+values[match] || ''
    } );
}

/**
 * timeout
 * =======
 * timeout( function(){}, 100 );
 */
function timeout( fun, wait ) { return setTimeout( fun, wait ) }

/**
 * jsonp_cb
 * ========
 * var callback = jsonp_cb();
 */
function jsonp_cb() { return '0' }

/**
 * ENCODE
 * ======
 * var encoded_path = encode('path');
 */
function encode(path) {
    return map( (''+path).split(''), function(chr) {
        return " ~`!@#$%^&*()+=[]\\{}|;':\",./<>?".indexOf(chr) > -1 ?
               "%"+chr.charCodeAt(0).toString(16).toUpperCase()      : chr
    } ).join('');
}

/**
 * Titanium TCP Sockets
 * ====================
 *  xdr({
 *     url     : ['http://www.blah.com/url'],
 *     success : function(response) {},
 *     fail    : function() {}
 *  });
 */
function xdr(setup) {
    var url      = setup.url.join(URLBIT)
    ,   body     = []
    ,   data     = ""
    ,   rbuffer  = Ti.createBuffer({ length : 2048 })
    ,   wbuffer  = Ti.createBuffer({ value : "GET " + url + " HTTP/1.0\n\n"})
    ,   fail     = setup.fail    || function(){}
    ,   success  = setup.success || function(){}
    ,   sock     = Ti.Network.Socket.createTCP({
        host      : url.split(URLBIT)[2],
        port      : 80,
        mode      : Ti.Network.READ_WRITE_MODE,
        timeout   : XHRTME,
        error     : fail,
        connected : function() {
            sock.write(wbuffer);
            read();
        }
    });

    function read() {
        Ti.Stream.read( sock, rbuffer, function(stream) { 
            if (+stream.bytesProcessed > -1) {
                data = Ti.Codec.decodeString({
                    source : rbuffer,
                    length : +stream.bytesProcessed
                });

                body.push(data);
                rbuffer.clear();

                return timeout( read, 1 );
            }

            try {
                data = JSON['parse'](
                    body.join('').split('\r\n').slice(-1)
                );
            }
            catch (r) { 
                return fail();
            }

            sock.close();
            success(data);
        } );
    }
 
    try      { sock.connect() }
    catch(k) { return fail()  }
}


/* =-====================================================================-= */
/* =-====================================================================-= */
/* =-=========================     PUBNUB     ===========================-= */
/* =-====================================================================-= */
/* =-====================================================================-= */

var DEMO          = 'demo'
,   LIMIT         = 1700
,   CREATE_PUBNUB = function(setup) {
    var CHANNELS      = {}
    ,   PUBLISH_KEY   = setup['publish_key']   || DEMO
    ,   SUBSCRIBE_KEY = setup['subscribe_key'] || DEMO
    ,   SSL           = setup['ssl'] ? 's' : ''
    ,   ORIGIN        = 'http' + SSL + '://' +
                        (setup['origin'] || 'pubsub.pubnub.com')
    ,   SELF          = {
        /*
            PUBNUB.history({
                channel  : 'my_chat_channel',
                limit    : 100,
                callback : function(messages) { console.log(messages) }
            });
        */
        'history' : function( args, callback ) {
            var callback = args['callback'] || callback 
            ,   limit    = args['limit'] || 100
            ,   channel  = args['channel'];

            // Make sure we have a Channel
            if (!channel)  return log('Missing Channel');
            if (!callback) return log('Missing Callback');

            // Send Message
            xdr({
                url      : [
                    ORIGIN, 'history',
                    SUBSCRIBE_KEY, encode(channel),
                    0, limit
                ],
                success  : function(response) { callback(response) },
                fail     : function(response) { log(response) }
            });
        },

        /*
            PUBNUB.time(function(time){ console.log(time) });
        */
        'time' : function(callback) {
            xdr({
                url      : [ORIGIN, 'time', 0],
                success  : function(response) { callback(response[0]) },
                fail     : function() { callback(0) }
            });
        },

        /*
            PUBNUB.uuid(function(uuid) { console.log(uuid) });
        */
        'uuid' : function(callback) {
            xdr({
                url      : [
                    'http' + SSL +
                    '://pubnub-prod.appspot.com/uuid?callback=0'
                ],
                success  : function(response) { callback(response[0]) },
                fail     : function() { callback(0) }
            });
        },

        /*
            PUBNUB.publish({
                channel : 'my_chat_channel',
                message : 'hello!'
            });
        */
        'publish' : function( args, callback ) {
            var callback = callback || args['callback'] || function(){}
            ,   message  = args['message']
            ,   channel  = args['channel'];

            if (!message)     return log('Missing Message');
            if (!channel)     return log('Missing Channel');
            if (!PUBLISH_KEY) return log('Missing Publish Key');

            // If trying to send Object
            message = JSON['stringify'](message);

            // Make sure message is small enough.
            if (message.length > LIMIT) return log('Message Too Big');

            // Send Message
            xdr({
                success  : function(response) { callback(response) },
                fail     : function() { callback([ 0, 'Disconnected' ]) },
                url      : [
                    ORIGIN, 'publish',
                    PUBLISH_KEY, SUBSCRIBE_KEY,
                    0, encode(channel),
                    0, encode(message)
                ]
            });
        },

        /*
            PUBNUB.unsubscribe({ channel : 'my_chat' });
        */
        'unsubscribe' : function(args) {
            var channel = args['channel'];

            // Leave if there never was a channel.
            if (!(channel in CHANNELS)) return;

            // Disable Channel
            CHANNELS[channel].connected = 0;

            // Abort and Remove Script
            CHANNELS[channel].done && 
            CHANNELS[channel].done(0);
        },

        /*
            PUBNUB.subscribe({
                channel  : 'my_chat'
                callback : function(message) { console.log(message) }
            });
        */
        'subscribe' : function( args, callback ) {

            var channel   = args['channel']
            ,   timetoken = 0
            ,   connected = 0
            ,   callback  = callback        || args['callback']
            ,   error     = args['error']   || function(){}
            ,   connect   = args['connect'] || function(){};

            // Make sure we have a Channel
            if (!channel)       return log('Missing Channel');
            if (!callback)      return log('Missing Callback');
            if (!SUBSCRIBE_KEY) return log('Missing Subscribe Key');

            if (!(channel in CHANNELS)) CHANNELS[channel] = {};

            // Make sure we have a Channel
            if (CHANNELS[channel].connected) return log('Already Connected');
                CHANNELS[channel].connected = 1;

            // Recurse Subscribe
            function pubnub() {
                // Stop Connection
                if (!CHANNELS[channel].connected) return;

                // Connect to PubNub Subscribe Servers
                CHANNELS[channel].done = xdr({
                    url      : [
                        ORIGIN, 'subscribe',
                        SUBSCRIBE_KEY, encode(channel),
                        0, timetoken
                    ],
                    fail : function() {
                        timeout( pubnub, 1000 );
                        SELF['time'](function(success){
                            success || error();
                        });
                    },
                    success : function(message) {
                        if (!CHANNELS[channel].connected) return;

                        if (!connected) {
                            connected = 1;
                            connect();
                        }

                        timetoken = message[1];
                        timeout( pubnub, 10 );
                        each( message[0], function(msg) { callback(msg) } );
                    }
                });
            }

            // Begin Recursive Subscribe
            pubnub();
        },

        // Expose PUBNUB Functions
        'each'     : each,
        'map'      : map,
        'supplant' : supplant,
        'now'      : unique,
        'init'     : CREATE_PUBNUB
    };

    return SELF;
};

PUBNUB = CREATE_PUBNUB({
    'publish_key'   : 'demo',
    'subscribe_key' : 'demo',
    'ssl'           : false,
    'origin'        : 'pubsub.pubnub.com'
});

})();
