/**
 * @class A scene node that interpolates a scalar value by interpolating within a sequence of key values.
 * <p>This node begins interpolating as a function of the system clock as soon as it is rendered, sending its output
 * to a property of a selected target node each time.</p>
 * <p><b>Example Usage</b></p><p>This example defines a {@link SceneJS.Cube} with rotation that is animated by
 * a SceneJS.Interpolator.
 * If we thought of <em>alpha</em> as elapsed seconds, then this cube will rotate 360 degrees over one second, then
 * rotate 180 in the reverse direction over the next 0.5 seconds. In this example however, the alpha is actually fixed,
 * where the cube is stuck at 180 degrees - you would need to vary the "alpha" property on the WithData node to actually
 * animate it.</p><pre><code>
 *
 * // ...
 *
 *      new SceneJS.Rotate({
 *              id: "myRotate",
 *              angle 0.0
 *          },
 *          new SceneJS.Cube())),
 *
 *      new SceneJS.Interpolator({
 *              mode:"linear",   // or 'cosine', 'cubic' or 'constant'
 *              target: "myRotate",
 *              targetProperty: "angle",
 *              keys: [0.0, 1.0, 1.5],       // Instants in time in seconds
 *              values: [0.0, 360.0, 180.0]
 *          })
 *
 * // ...
 *
 *  </pre></code>
 *
 * A SceneJS.Interpolator will do nothing while the time is outside its range of time key values.
 * @extends SceneJS.Node
 * @since Version 0.7.4
 * @constructor
 * Create a new SceneJS.Interpolator
 * @param {Object} [cfg] Static configuration object
 * @param {String} [cfg.mode="linear"] Interpolation mode - "linear", "cosine", "cubic" or "constant"
 * @param {String} [cfg.target] ID of target node whose property we'll interpolate
 * @param {String} [cfg.targetProperty] Name of target property on target node
 * @param {double[]} [cfg.keys=[]] Time key values in seconds
 * @param {double[]} [cfg.values=[]] Output key values
 * @param {...SceneJS.Node} [childNodes] Child nodes
 */
SceneJS.Interpolator = SceneJS.createNodeType("interpolator");


// @private
SceneJS.Interpolator.prototype._init = function(params) {
    this._timeStarted = null;
    this._target = params.target;
    this._targetProperty = params.targetProperty;
    this._outputValue = null;

    /* Whether to remove this node when finished or keep in scene
     */
    this._once = params.once;

    /* Keys and values - verify them if supplied
     */
    if (params.keys) {
        if (!params.values) {
            throw SceneJS._errorModule.fatalError(
                    new SceneJS.errors.InvalidNodeConfigException(
                            "SceneJS.Interpolator configuration incomplete: " +
                            "keys supplied but no values - must supply a value for each key"));
        }
        for (var i = 1; i < params.keys.length; i++) {
            if (params.keys[i - 1] >= params.keys[i]) {
                throw SceneJS._errorModule.fatalError(
                        new SceneJS.errors.InvalidNodeConfigException(
                                "SceneJS.Interpolator configuration invalid: " +
                                "two invalid keys found ("
                                        + (i - 1) + " and " + i + ") - key list should contain distinct values in ascending order"));
            }
        }
    } else if (params.values) {
        throw SceneJS._errorModule.fatalError(
                new SceneJS.errors.InvalidNodeConfigException(
                        "SceneJS.Interpolator configuration incomplete: " +
                        "values supplied but no keys - must supply a key for each value"));
    }
    this._keys = params.keys || [];
    this._values = params.values || [];
    this._key1 = 0;
    this._key2 = 1;

    /* Interpolation mode
     */
    params.mode = params.mode || 'linear';
    switch (params.mode) {
        case 'linear':
            break;
        case 'constant':
            break;
        case 'cosine':
            break;
        case 'cubic':
            if (params.keys.length < 4) {
                throw SceneJS._errorModule.fatalError(
                        new SceneJS.errors.InvalidNodeConfigException(
                                "SceneJS.Interpolator configuration invalid: minimum of four keyframes " +
                                "required for cubic - only "
                                        + params.keys.length
                                        + " are specified"));
            }
            break;
        case 'slerp':
            break;
        default:
            throw SceneJS._errorModule.fatalError(
                    new SceneJS.errors.InvalidNodeConfigException(
                            "SceneJS.Interpolator configuration invalid:  mode not supported - " +
                            "only 'linear', 'cosine', 'cubic', 'constant' and 'slerp' are supported"));
        /*


         case 'hermite':
         break;
         */
    }
    this._mode = params.mode;
    this._once = params.once;
};

// @private
SceneJS.Interpolator.prototype.STATE_OUTSIDE = "outside";    // Alpha outside of key sequence

// @private
SceneJS.Interpolator.prototype.STATE_BEFORE = "pending";     // Alpha before first key

// @private
SceneJS.Interpolator.prototype.STATE_AFTER = "complete";     // Alpha after last key

// @private
SceneJS.Interpolator.prototype.STATE_RUNNING = "running";    // Found keys before and after alpha

// @private
SceneJS.Interpolator.prototype._render = function(traversalContext) {

    /* Not bound to a target node setter mode yet.
     *
     * Attempt to bind - if target not found, just try again
     * next render, since it might appear in the scene later.
     */

    if (!this._target) {
        throw SceneJS._errorModule.fatalError(
                new SceneJS.errors.NodeConfigExpectedException(
                        "SceneJS.Interpolator config expected: target"));
    }

    if (!this._targetProperty) {
        throw SceneJS._errorModule.fatalError(
                new SceneJS.errors.NodeConfigExpectedException(
                        "SceneJS.Interpolator config expected: targetProperty"));
    }

    /* Generate next value
     */
    if (!this._timeStarted) {
        this._timeStarted = SceneJS._timeModule.getTime();
    }
    this._update((SceneJS._timeModule.getTime() - this._timeStarted) * 0.001);

    if (this._outputValue != null// Null when interpolation outside of time range
            && SceneJS.nodeExists(this._target)) {
        SceneJS.withNode(this._target).set(this._targetProperty, this._outputValue);
    }

    /* Render child nodes
     */
    this._renderNodes(traversalContext);
};

// @private
SceneJS.Interpolator.prototype._update = function(key) {
    switch (this._findEnclosingFrame(key)) {
        case this.STATE_OUTSIDE:
            break;

        case this.STATE_BEFORE:                            // Before first key
            this._setDirty();                               // Need at least one more scene render to find first key
            break;                                          // Time delay before interpolation begins

        case this.STATE_AFTER:
            this._outputValue = null;
            //this._outputValue = this._values[this._values.length - 1];
            if (this._once) {
                this.destroy();
            }
            break;

        case this.STATE_RUNNING:                                   // Found key pair
            this._outputValue = this._interpolate((key));   // Do interpolation
            this._setDirty();                               // Need at least one more scene render to apply output
            break;
        default:
            break;
    }
};

// @private
SceneJS.Interpolator.prototype._findEnclosingFrame = function(key) {
    if (this._keys.length == 0) {
        return this.STATE_OUTSIDE;
    }
    if (key < this._keys[0]) {
        return this.STATE_BEFORE;
    }
    if (key > this._keys[this._keys.length - 1]) {
        return this.STATE_AFTER;
    }
    while (this._keys[this._key1] > key) {
        this._key1--;
        this._key2--;
    }
    while (this._keys[this._key2] < key) {
        this._key1++;
        this._key2++;
    }
    return this.STATE_RUNNING;
};

// @private
SceneJS.Interpolator.prototype._interpolate = function(k) {
    switch (this._mode) {
        case 'linear':
            return this._linearInterpolate(k);
        case 'cosine':
            return this._cosineInterpolate(k);
        case 'cubic':
            return this._cubicInterpolate(k);
        case 'constant':
            return this._constantInterpolate(k);
        case 'slerp':
            return this._slerp(k);
        default:
            throw SceneJS._errorModule.fatalError(
                    new SceneJS.errors.InternalException("SceneJS.Interpolator internal error - interpolation mode not switched: '"
                            + this._mode + "'"));
    }
};

// @private
SceneJS.Interpolator.prototype._linearInterpolate = function(k) {
    var u = this._keys[this._key2] - this._keys[this._key1];
    var v = k - this._keys[this._key1];
    var w;

    if ( typeof this._values[this._key1] === 'number') {
        w = this._values[this._key2] - this._values[this._key1];
        w = this._values[this._key1] + ((v / u) * w);
    } else {
        // If the values are in an object then we must interpolate each of them separately
        w = {};
        for (var valueKey in this._values[this._key1]) {
            // Ensure key is actual property of the object and not from the prototype
            if (this._values[this._key1].hasOwnProperty(valueKey)
                && this._values[this._key2].hasOwnProperty(valueKey)) {
                w[valueKey] = this._values[this._key2][valueKey] - this._values[this._key1][valueKey];
                w[valueKey] = this._values[this._key1][valueKey] + ((v / u) * w[valueKey]);
            }
        }
    }
    return w;
};

// @private
SceneJS.Interpolator.prototype._constantInterpolate = function(k) {
    if (Math.abs((k - this._keys[this._key1])) < Math.abs((k - this._keys[this._key2]))) {
        return this._keys[this._key1];
    } else {
        return this._keys[this._key2];
    }
};

// @private
SceneJS.Interpolator.prototype._cosineInterpolate = function(k) {
    var mu2 = (1 - Math.cos(k * Math.PI) / 2.0);
    return (this._keys[this._key1] * (1 - mu2) + this._keys[this._key2] * mu2);
};

// @private
SceneJS.Interpolator.prototype._cubicInterpolate = function(k) {
    if (this._key1 == 0 || this._key2 == (this._keys.length - 1)) {

        /* Between first or last pair of keyframes - need four keyframes for cubic, so fall back on cosine
         */
        return this._cosineInterpolate(k);
    }
    var y0 = this._keys[this._key1 - 1];
    var y1 = this._keys[this._key1];
    var y2 = this._keys[this._key2];
    var y3 = this._keys[this._key2 + 1];
    var mu2 = k * k;
    var a0 = y3 - y2 - y0 + y1;
    var a1 = y0 - y1 - a0;
    var a2 = y2 - y0;
    var a3 = y1;
    return (a0 * k * mu2 + a1 * mu2 + a2 * k + a3);
};

// @private
SceneJS.Interpolator.prototype._slerp = function(k) {
    var u = this._keys[this._key2] - this._keys[this._key1];
    var v = k - this._keys[this._key1];
    return SceneJS._math_slerp((v / u), this._values[this._key1], this._values[this._key2]);
};


// @private
SceneJS.Interpolator.prototype._changeState = function(newState, params) {
    params = params || {};
    params.oldState = this._state;
    params.newState = newState;
    this._state = newState;
    if (this._listeners["state-changed"]) {
        this._fireEvent("state-changed", params);
    }
};

