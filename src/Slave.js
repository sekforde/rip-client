const socket = require('socket.io-client');
const RIP = require('./RIP');

class Slave {
	constructor(host, port, name) {
		this.host = host;
		this.port = port;
		this.name = name;
		this.address = `${host}:${port}`;
		this.job = {
			status: 'notrunning',
			file: null,
			pageRange: null
		};

		console.log('created slave', this.name);
		console.log('connecting to', this.address);

		this.client = socket(this.address);
		this.client.on('connect', this.onConnect.bind(this));
		this.client.on('error', this.onError.bind(this));
		this.client.on('disconnect', this.onDisconnect.bind(this));
		this.client.on('start', this.onStart.bind(this));
	}
	onConnect() {
		console.log(this.name, 'connected to server');
		this.id = this.client.id;
	}
	onError(err) {
		console.log(err);
		this.launchIntervalConnect();
	}
	onDisconnect() {
		console.log('Connection closed');
	}
	onStart(data) {
		console.log('onStart');
		this.startJob(data.file, data.pageRange);
	}
	startJob(file, pageRange) {
		console.log('starting job', file, pageRange, 'on', this.name, this.id);
		this.job.status = 'running';
		this.job.file = file;
		this.job.pageRange = pageRange;

		this.rip = new RIP();
		this.rip.on('error', err => {
			console.log('ripping error', err);
			delete this.rip;
		});
		this.rip.on('complete', () => {
			this.endJob();
			delete this.rip;
		});
		this.rip.rip(file, pageRange);
	}
	endJob() {
		console.log('Job Complete on ', this.name, this.id);
		this.client.emit('complete', this.job);
		this.job.status = 'notrunning';
		this.job.file = null;
		this.job.pageRange = null;
	}
}

module.exports = Slave;
