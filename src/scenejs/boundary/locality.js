/**
 *@class A scene node that defines inner and outer spheres of locality that are centered about the viewpoint.
 *<p>The subgraphs of contained {@link SceneJS.BoundingBox} nodes will only be rendered when their boundaries intersect
 *the inner radius (along with the view frustum).</p>
 *<p>You can have as many of these as neccessary throughout your scene.</p>
 * <p>When you don't specify a Locality node, SceneJS has default inner and outer radii of 100000
 * and 200000, respectively.</p>
 *<p><b>Example:</b></p><p>Defining a locality</b></p><pre><code>
 *  var locality = new SceneJS.Locality({
 *      inner: 100000,  // Default node values, override these where needed
 *      outer: 200000
 *      },
 *
 *      // ... child nodes containing SceneJS.BoundingBox nodes ...
 *  )
 *</pre></code>
 * @extends SceneJS.Node
 * @since Version 0.7.3
 * @constructor
 * Create a new SceneJS.Locality
 * @param {Object} [cfg] Static configuration object
 * @param {double} [cfg.inner = 100000] Inner radius
 * @param {double} [cfg.outer = 200000] Outer radius
 * @param {...SceneJS.Node} [childNodes] Child nodes
 */
SceneJS.Locality = SceneJS.createNodeType("locality");

// @private
SceneJS.Locality.prototype._init = function(params) {
    this.setInner(params.inner);  // TODO: reduntant
    this.setOuter(params.outer);
};

/**
 Sets the inner radius
 @function setInner
 @param {double} inner
 @returns {SceneJS.Locality} this
 @since Version 0.7.4
 */
SceneJS.Locality.prototype.setInner = function(inner) {
    this._attr.inner = inner || 100000;
    this._setDirty();
    return this;
};

/**
 Returns the inner radius
 @function {double} getInner
 @returns {double} Inner radius
 @since Version 0.7.4
 */
SceneJS.Locality.prototype.getInner = function() {
    return this._attr.inner;
};

/**
 Sets the outer radius
 @function setOuter
 @param {double} outer
 @returns {SceneJS.Locality} this
 @since Version 0.7.4
 */
SceneJS.Locality.prototype.setOuter = function(outer) {
    this._attr.outer = outer || 200000;
    this._setDirty();
    return this;
};

/**
 Returns the outer radius
 @function {double} getOuter
 @returns {double} Outer radius
 @since Version 0.7.4
 */
SceneJS.Locality.prototype.getOuter = function() {
    return this._attr.outer;
};

// @private
SceneJS.Locality.prototype._render = function(traversalContext, data) {
    if (!this._fixedParams) {
        this._init(this._getParams(data));
    }
    var prevRadii = SceneJS._localityModule.getRadii();
    SceneJS._localityModule.setRadii(this._attr);
    this._renderNodes(traversalContext, data);
    SceneJS._localityModule.setRadii(prevRadii);
};

