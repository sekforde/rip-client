const EventEmitter = require('events');
const { exec } = require('child_process');

class RIP extends EventEmitter {
	constructor(name, logger) {
		super();
		this.name = name;
		this.logger = logger;
		this.log('created RIP');
	}
	log(...args) {
		this.logger.log(args);
	}
	rip(file, pageRange) {

		this.log('Starting RIPPING page', pageRange);

		const cmd = `gs -sDEVICE=tiffsep -dNOPAUSE -dBATCH -dSAFER -r100x100 -sPageList=${pageRange} -sOutputFile=output/${this.name}-p%04d.tiff ${file}`;

		this.log('executing ', cmd);

		exec(cmd, (err, stdout, stderr) => {
			if (err) {
				this.log('error');
				this.emit('error', err);
				return;
			}
			this.log('exec complete');
			this.emit('complete');
		});
	}
}

module.exports = RIP;
