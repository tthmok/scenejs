/**
 * SceneJS IOC service container
 */

SceneJS.Services = new (function() {

    this.NODE_LOADER_SERVICE_ID = "node-loader";

    this.COMMAND_SERVICE_ID = "command";

    this._services = {};

    this.addService = function(name, service) {
        this._services[name] = service;
    };

    this.hasService = function(name) {
        var service = this._services[name];
        return (service != null && service != undefined);
    };

    this.getService = function(name) {
        return this._services[name];
    };

    /*----------------------------------------------------
     * Install stub services
     *---------------------------------------------------*/

    this.addService(this.NODE_LOADER_SERVICE_ID, {
        loadNode: function(nodeId) {
        }
    });
})();