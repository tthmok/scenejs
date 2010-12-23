/** Backend module that creates bitmapp text textures
 *  @private
 */
SceneJS._bitmapTextModule = new (function() {

    SceneJS._eventModule.addListener(
            SceneJS._eventModule.INIT,
            function() {

            });

    function getHTMLColor(color) {
		var htmlColor = [];
        if (color.length != 4) {
            return color;
        }
        for (var i = 0; i < color.length-1; i++) {
            htmlColor[i] = color[i]*255;
        }
		// alpha value should be 0 to 1, not multiplied by 255
		htmlColor[3] = color[3];
		
        return 'rgba(' + htmlColor.join(',') + ')';
    }

    this.createText = function(font, size, text, color, makeBold) {
        var canvas = document.createElement("canvas");
        var cx = canvas.getContext('2d');

		var bold = "";
		
		if (makeBold) {
			bold = "bold ";
		}
		
        cx.font = bold + size + "px " + font;

        var width = cx.measureText(text).width;
        canvas.width = width;
        canvas.height = size*1.2;

        cx.font = bold + size + "px " + font;
        cx.textBaseline = "middle";
        cx.fillStyle = getHTMLColor(color);

        var x = 0;
        var y = (canvas.height / 2);
        cx.fillText(text, x, y);
		
        return {
            image: canvas,
            width: canvas.width,
            height: canvas.height
        };
    };
})();