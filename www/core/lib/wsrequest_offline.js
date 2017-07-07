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

.constant('mmWSRequestSynchronizationStore', 'ws_core_sync')

.config(function($mmSitesFactoryProvider, mmWSRequestSynchronizationStore) {
    var stores = [
        {
            name: mmWSRequestSynchronizationStore,
            keyPath: 'id'
        }
    ];
    $mmSitesFactoryProvider.registerStores(stores);
})

/**
 * Common synchronization service.
 *
 * @module mm.core
 * @ngdoc service
 * @name $mmWsRequestOffline
 */
.factory('$mmWsRequestOffline', function($q, $log, $mmSitesManager, $mmSite) {
    var self = {};
    $log = $log.getInstance('$mmWsRequestOffline');
    //delete Request
    self.deleteRequest = function(requestId,  siteId) {
        console.log("Deleting request with ID "+requestId);
        return $mmSitesManager.getSite(siteId).then(function(site) {
            requestId = (requestId = parseInt(requestId, 10)) > 0 ? requestId : 0;
            return site.getDb().remove(mmWSRequestSynchronizationStore, requestId);
        });
    };

    self.saveRequest = function(siteId, method, data, preSets) {
        console.log("Saving request");
        return $mmSitesManager.getSite(siteId).then(function(site) {
            var now = new Date().getTime(),
                entry = {
 		            id:now,
                    method: method,
                    data: data,
                    preSets: preSets
                };
            console.log("Saving request: "+JSON.stringify(entry));
            return site.getDb().insert(mmWSRequestSynchronizationStore, entry);
        });
    };

    self.getRequests = function(siteId) {
        return $mmSitesManager.getSite(siteId).then(function(site) {
            return site.getDb().getAll(mmWSRequestSynchronizationStore);
        });
    };

    self.hasSavedRequests = function(siteId) {
        return self.getRequests(siteId).then(function(requests) {
            return !!requests.length;
        }).catch(function() {
            // Error, return false.
            return false;
        });
    };
return self;
});
