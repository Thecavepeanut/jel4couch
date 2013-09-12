/*
    *********************************************************************************
    *               Javascript Error Logger for couchDB (jel4Couch)                 *
    *                       Code by Jake Grajewski                                  *
    *                                                                               *
    * jel4Couch is a very simple error logger to be used with your couchdb app.     *
    * It overrides window.onError so please remember this will catch ad and plugin  *
    * errors.  This will log all errors received by either window.onerror or by     *
    * error handling properly and using jel4Couch.logError.                         *
    *                                                                               *
    * NOTE: Please remember to override jel4Couch.dbName to the couchDb you want the *
    * jel  file stored in or it will be stashed in jel4CouchDbLog.                  *
    **********************************************************************************
 */
try{
    var _docId = "jel",

    //exposing jel4Couch to the globals so we can access it anywhere.

    jel4Couch = {
        dbName: "jel4couchdb_log",
        source : "FocusAndContext",
        suppressErrors : true,

        //**************************************************************************************************
        // Function:logError (err, event)
        //      input:  err = error log object (see example below), event to stop propagation of
        //      goal: To promote more error handling and to update the log with this new error.
        //
        //      EXAMPLE:: An error log object:
        //          err ={ errorMsg: e.message,
        //          queryString: document.location.search,
        //          url: document.location.pathname,
        //          referrer: document.referrer,
        //          userAgent: navigator.userAgent,
        //          stack: e.get_stack(),
        //          time: new Date().getTime()}

        //      goal: To save the given doc to the couchDb name set by jel4Couch.dbName.
        //
        // NOTE: jel4Couch.dbName is "jel4CouchDbLog" by default.
        //**************************************************************************************************

        logError : function (err, event){
            // if no error is supplied just exit.
            if (!err) return;

            //if an event is passed it must be stopped
            // or it will cause duplicate entries.
            //TODO Add actual duplication checking
            if(event){
                try{
                    event.stopPropagation();
                }
                catch(e){
                    var error = {
                        errorMsg: e.message,
                        queryString: document.location.search,
                        url: document.location.pathname,
                        referrer: document.referrer,
                        userAgent: navigator.userAgent,
                        time: new Date().getTime()
                    }
                    jel4Couch.logError(error,e);
                }
            }

            //log for the console because we want our errors and we want them NOW!
            console.log(err);

            $.couch.db(jel4Couch.dbName).openDoc(_docId, {
                success: function(doc){
                    //adding new data and saving
                    doc.data.push(err);
                    _saveDoc(doc);
                },

                error: function(status) {
                    var errors =[];
                    errors.push(err);

                    //TODO: JG add more cases
                    switch(status){
                        // the doc is not there lets create it
                        case (404):
                            var doc = {
                                _id : _docId,
                                souce : jel4Couch.source,
                                data : errors}

                            _saveDoc(doc);
                            break;
                        default:;
                    }

                }

            });

        }
    };

    //**************************************************************************************************
    // Function:_saveDoc
    //      input : couchDb document (JSON)
    //      goal: To save the given doc to the couchDb name set by jel4Couch.dbName.
    //
    // NOTE: jel4Couch.dbName is "jel4CouchDbLog" by default.
    //**************************************************************************************************

    function _saveDoc (doc){
        $.couch.db(jel4Couch.dbName).saveDoc(doc,{

            success:function (data) {
                //do nothing it is logged
            },

            error:function (status) {
                console.log("jel4Couch::Error: Failed to save " + _docId + " to "
                    + jel4Couch.dbName +  "! Http code: ", status);
            }
        })
    };

    //***************************************************************************************************
    // Function: window.onerror Override (ANON func)
    //      input: err = txt of error, url = url of error, line = line number of error
    //      goal: catch and log all errors when they reach the window.
    //***************************************************************************************************
    window.onerror = function(errorMsg, url, lineNumber) {
        //creating an error message, that I find useful for debugging
        //TODO:: Check out rolling something like stack.js in this to possibly get a stack. Kind of like Xmas in July.
        var error = {
            errorMsg: errorMsg,
            errorLine: lineNumber,
            queryString: document.location.search,
            url: document.location.pathname,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            time: new Date().getTime()
        }

        jel4Couch.logError(error);

        //suppress browser error messages
        return jel4Couch.suppressErrors;
    };


} catch(e) {
    //TODO hmm indeed what to do in this case?
}
