const ansiTerm = require('ansi-term');
const blessed = require('blessed');
const Canvas = require('blessed-contrib').canvas;

const Node = blessed.Node;

function Status(options) {
	if (!(this instanceof Node)) {
		return new Status(options);
	}

	options = options || {};
	this.options = options;
	this.options.status = options.status || 'Stopped';
	this.options.stroke = 'red';

	Canvas.call(this, options, ansiTerm);

	this.on('attach', () => this.setStatus(this.options.status));
}

Status.prototype = Object.create(Canvas.prototype);
Status.prototype.type = 'status';

Status.prototype.calcSize = function () {
	this.canvasSize = {
		width: this.width - 2,
		height: this.height
	};
};

Status.prototype.setStatus = function (status, color) {
	if (!this.ctx) {
		throw 'error: canvas context does not exist. setData() for gauges must be called after the gauge has been added to the screen via screen.append()';
	}

	const c = this.ctx;
	c.strokeStyle = color || this.options.stroke;
	c.fillStyle = 'white';
	c.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
	c.fillRect(0, 0, this.canvasSize.width, 5);
	c.fillText(status, 7, 2);
};

Status.prototype.getOptionsPrototype = function () {
	return {
		status: 'Stopped'
	};
};


module.exports = Status;
