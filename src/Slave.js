const fsExtra = require('fs-extra')
const tmp = require('tmp');
const socket = require('socket.io-client');
const axios = require('axios');
const RIP = require('./RIP');
const config = require('../config');

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
	downloadFile(file) {
		return new Promise((resolve, reject) => {
			// create a local temporary file
			const tmpobj = tmp.fileSync();
			console.log(`Saving to ${tmpobj.name}`)
			const writeStream = fsExtra.createWriteStream(tmpobj.name);
			writeStream.on('close', () => {
				console.log('download Complete');
				resolve(tmpobj.name);
			});

			// download the file from master
			const url = `${config.host}:${config.port}/${file}`;
			console.log(`Downloading ${url}`);
			axios({
				url,
				method: 'GET',
				responseType: 'stream',
			}).then(response => {
				response.data.pipe(writeStream);
			});
		});
	}
	clearCache() {
		console.log('clearing cache');
		fsExtra.emptyDirSync('./output');
	}
	async startJob(file, pageRange) {
		// get the file to rip into a local cache
		const localFile = await this.downloadFile(file);
		console.log('starting job', file, pageRange, 'on', this.name, this.id);

		// create the job
		this.job.status = 'running';
		this.job.localFile = localFile;
		this.job.pageRange = pageRange;

		// create the RIP
		this.rip = new RIP(this.name);
		this.rip.on('error', err => {
			console.log('ripping error', err);
			delete this.rip;
		});
		this.rip.on('complete', () => {
			this.endJob();
			delete this.rip;
		});
		// start the rip
		this.rip.rip(localFile, pageRange);
	}
	endJob() {
		console.log('Job Complete on ', this.name, this.id);
		this.client.emit('complete', this.job);
		this.job.status = 'notrunning';
		this.job.file = null;
		this.job.pageRange = null;
		// this.clearCache();
	}
}

module.exports = Slave;
