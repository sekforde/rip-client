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
	rip(job) {
		const { localFile, pageRange, dpi = 100 } = job;

		this.log(`RIP Start: ${pageRange} ${dpi}`);

		const cmd = `gs -sDEVICE=tiffsep -dNOPAUSE -dBATCH -dSAFER -r${dpi}x${dpi} -sPageList=${pageRange} -sOutputFile=output/${this.name}-p%04d.tiff ${localFile}`;

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
