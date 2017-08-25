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

.constant('mmWSRequestSynchronizationStore', 'mm_core_sync')

.config(function($mmAppProvider, mmWSRequestSynchronizationStore) {
    var stores = [
        {
            name: mmWSRequestSynchronizationStore,
            keyPath: 'id'
        }
    ];
    $mmAppProvider.registerStores(stores);
})

/**
 * Common synchronization service.
 *
 * @module mm.core
 * @ngdoc service
 * @name $mmWsRequestOffline
 */
.factory('$mmWsRequestOffline', function($q, $log, $mmApp, mmWSRequestSynchronizationStore) {
    var self = {};
    $log = $log.getInstance('$mmWsRequestOffline');

    //Delete queued request from storage
    //used to clear request after successful sync
    self.deleteRequest = function(requestId) {
        console.log("Deleting request with ID "+requestId);
        return $mmApp.getDB().remove(mmWSRequestSynchronizationStore, requestId);
    };

    //save request being queued for sync later e.g when connectivity is available
    //see SitesFactory#write for description of request parameters
    self.saveRequest = function( method, data, preSets) {
        var now = new Date().getTime(),
            entry = {
                id:now,
                method: method,
                data: data,
                preSets: preSets
            };
        return $mmApp.getDB().insert(mmWSRequestSynchronizationStore, entry);
    };

    //retrieve all stored requests
    self.getRequests = function() {
        return $mmApp.getDB().getAll(mmWSRequestSynchronizationStore);
    };

    //convenient method to check whether there are any requests pending sync
    self.hasSavedRequests = function() {
        return self.getRequests().then(function(requests) {
            console.log("app  has "+requests.length+" queued requests");
            return !!requests.length;
        }).catch(function() {
            // Error, return false.
            console.log("Error  counting requests");
            return false;
        });
    };
    return self;
});
