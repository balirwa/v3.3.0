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
.factory('$mmWsRequestSync', function($q, $log, $mmSitesFactory, $mmSitesManager, $mmSite, $mmSync, $mmWsRequestOffline) {
    var self = $mmSync.createChild('mm.core', 300000);
    $log = $log.getInstance('$mmWsRequestSync');

    self.syncRequest = function(request){
        var retrying = true;
        console.log("Syncing request: "+JSON.stringify(request));
        return $mmSitesFactory.request(request.method, request.data, request.preSets, retrying);
    }

    self.syncRequests = function(){
        if (!$mmApp.isOnline()) {
            $log.debug('Cannot sync all requests because device is offline.');
            return $q.reject();
        }
        console.log("Syncing requests");
        var promise = $mmSitesManager.getSitesIds();
        return promise.then(function(siteIds) {
            var sitePromises = [];
            angular.forEach(siteIds, function(siteId) {
                if($mmWsRequestOffline.hasSavedRequests(siteId)){
                    sitePromises.push($mmWsRequestOffline.getRequests(siteId).then(function(requests) {
                        angular.forEach(requests, function(request) {
                            self.syncRequest(request).then(function(response) {
                                if(!!response.status){
                                    $mmWsRequestOffline.deleteRequest(request.id).then(function(result){
                                        console.log("Deleted request with ID "+requestId + " Result: "+JSON.stringify(result));
                                    })
                                } else {
                                    console.log("Something went wrong syncing request. Response: "+JSON.stringify(response));
                                }
                            });
                        });

                    }));
                } else {
                    console.log("Site has no requests to sync");
                }
            });
            return $q.all(sitePromises);
        });
    }

    self.syncHandler = function() {

        var handlerself = {};
        handlerself.execute = function(siteId) {
            return self.syncRequests();
        };
        handlerself.getInterval = function() {
            return 300000; // 5 minutes.
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