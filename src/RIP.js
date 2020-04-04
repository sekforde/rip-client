const EventEmitter = require('events');
const { exec } = require('child_process');

class RIP extends EventEmitter {
	constructor(name) {
		super();
		this.name = name;
		console.log('created RIP:', name);
	}
	rip(file, pageRange) {

		console.log('Starting RIPPING page', pageRange);

		const cmd = `gs -sDEVICE=tiffsep -dNOPAUSE -dBATCH -dSAFER -r100x100 -sPageList=${pageRange} -sOutputFile=output/${this.name}-p%04d.tiff ${file}`;

		console.log('executing ', cmd);

		exec(cmd, (err, stdout, stderr) => {
			if (err) {
				console.log('error');
				this.emit('error', err);
				return;
			}
			console.log('exec complete');
			this.emit('complete');
		});
	}
}

module.exports = RIP;
