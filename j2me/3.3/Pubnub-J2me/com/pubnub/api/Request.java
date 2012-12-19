/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.pubnub.api;

import java.util.Enumeration;
import java.util.Vector;
import java.util.Hashtable;
import org.json.me.JSONArray;

/**
 *
 * @author Pubnub
 */
class Request {

    private String[] urlComponents;
    private Hashtable params;
    private String url;
    private String[] channels;
    ResponseHandler responseHandler;

    public String[] getChannels() {

        return this.channels;
    }

    public String getUrl() {

        if (url != null) {
            return url;
        }

        String url = PubnubUtil.joinString(urlComponents, "/");

        

        if (this.params != null) {
            StringBuffer sb = new StringBuffer();
            sb.append(url).append("?");


            Enumeration paramsKeys = this.params.keys();

            while (paramsKeys.hasMoreElements()) {
                String key = (String) paramsKeys.nextElement();
                sb.append(PubnubUtil.urlEncode((String)key)).append("=")
                  .append(PubnubUtil.urlEncode((String)this.params.get(key)));
            }

            url = sb.toString();
        }
        this.url = url;
        
        return this.url;
    }

    public Request(String[] urlComponents, String[] channels, ResponseHandler responseHandler) {
        this.channels = channels;
        this.responseHandler = responseHandler;
        this.urlComponents = urlComponents;

    }

    public Request(String[] urlComponents, Hashtable params, String[] channels, ResponseHandler responseHandler) {
        this.channels = channels;
        this.responseHandler = responseHandler;
        this.params = params;
        this.urlComponents = urlComponents;
    }

    public Request(String[] urlComponents, String channel, ResponseHandler responseHandler) {

        this.channels = new String[]{channel};
        this.responseHandler = responseHandler;
        this.urlComponents = urlComponents;
    }

    public Request(String[] urlComponents, Hashtable params, String channel, ResponseHandler responseHandler) {

        this.channels = new String[]{channel};
        this.responseHandler = responseHandler;
        this.params = params;
        this.urlComponents = urlComponents;

    }
}
