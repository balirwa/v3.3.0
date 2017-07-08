// (C) Copyright 2015 Martin Dougiamas
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

angular.module('mm.core')
/**
 * Common synchronization service.
 *
 * @module mm.core
 * @ngdoc service
 * @name $mmWsRequestSync
 */
.factory('$mmWsRequestSync', function($q, $log, $mmSite, $mmSync, $mmWsRequestOffline, $mmApp) {
    var self = $mmSync.createChild('mm.core', 300000);
    $log = $log.getInstance('$mmWsRequestSync');

    self.syncRequest = function(request){
        return $mmSite.write(request.method, request.data, request.preSets);
    }

    //function that is executed periodically to sync any queued requests
    self.syncRequests = function(){
        if (!$mmApp.isOnline()) {
            $log.debug('Cannot sync all requests because device is offline.');
            return $q.reject();
        }
        console.log("Syncing queued requests");
        var promises = [];
        if($mmWsRequestOffline.hasSavedRequests()){
            promises.push($mmWsRequestOffline.getRequests().then(function(requests) {
                angular.forEach(requests, function(request) {
                    console.log("Syncing request: "+JSON.stringify(request));
                    self.syncRequest(request).then(function(response) {
                        console.log("Sync response: "+JSON.stringify(response));
                        if(!!response.status){
                            $mmWsRequestOffline.deleteRequest(request.id).then(function(result){
                                console.log("Deleted request with ID "+requestId);
                            })
                        } else {
                            console.log("Something went wrong syncing queued request. Response: "+JSON.stringify(response));
                        }
                    }, function(error){
                        console.log("Error syncing request queued: "+JSON.stringify(error));
                    });
                });
            },function(error){
                console.log("Cannot retrieve queued requests. Error: "+JSON.stringify(error));
            }));
        } else {
            console.log("$mmApp has no queued requests to sync");
        }
        return $q.all(promises);
    }

    //Sync handler used to schedule periodic sync by moodle app cron task
    self.syncHandler = function() {

        var handlerself = {};
        handlerself.execute = function(siteId) {
            return self.syncRequests();
        };
        handlerself.getInterval = function() {
            return 600000; // 10 minutes.
        };
        handlerself.isSync = function() {
            return true;
        };
        handlerself.usesNetwork = function() {
            return true;
        };

        return handlerself;
    };

    return self;
});
