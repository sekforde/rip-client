const fsExtra = require('fs-extra')
const tmp = require('tmp');
const socket = require('socket.io-client');
const axios = require('axios');
const RIP = require('./RIP');
const config = require('../config');

class Executor {
	constructor(host, port, name, logger) {
		this.host = host;
		this.port = port;
		this.name = name;
		this.address = `${host}:${port}`;
		this.logger = logger;
		this.job = {
			name: this.name,
			status: 'Connected',
			file: null,
			pageRange: null
		};

		this.log('Client created');
		this.log(`Connecting to ${this.address}`);

		this.client = socket(this.address);
		this.client.on('connect', this.onConnect.bind(this));
		this.client.on('error', this.onError.bind(this));
		this.client.on('disconnect', this.onDisconnect.bind(this));
		this.client.on('start', this.onStart.bind(this));
	}
	log(...args) {
		this.logger.log(args);
	}
	updateJob() {
		this.logger.updateJob(this.job);
	}
	onConnect() {
		this.log('Connected to Master');
		this.id = this.client.id;
		this.job.status = 'Connected';
		this.updateJob();
	}
	onError(err) {
		this.log(err);
		this.resetJob();
		this.launchIntervalConnect();
	}
	onDisconnect() {
		this.log('Connection closed');
		this.resetJob();
	}
	onStart(data) {
		this.startJob(data.file, data.pageRange);
	}
	downloadFile(file) {
		return new Promise((resolve, reject) => {
			// create a local temporary file
			const tmpobj = tmp.fileSync();
			this.log(`Saving to ${tmpobj.name}`)
			const writeStream = fsExtra.createWriteStream(tmpobj.name);
			writeStream.on('close', () => {
				this.log('Download Complete');
				resolve(tmpobj.name);
			});

			// download the file from master
			const url = `${config.host}:${config.port}/${file}`;
			this.log(`Downloading ${url}`);
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
		this.log('Clearing cache');
		fsExtra.emptyDirSync('./output');
	}
	async startJob(file, pageRange) {
		// get the file to rip into a local cache
		const localFile = await this.downloadFile(file);
		this.log('Starting job', file, pageRange);

		// create the job
		this.job.status = 'Running';
		this.job.localFile = localFile;
		this.job.pageRange = pageRange;
		this.updateJob();

		// create the RIP
		this.rip = new RIP(this.name, this.logger);
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
		this.client.emit('complete', this.job);
	}
	resetJob() {
		this.job.status = 'Stopped';
		this.job.file = null;
		this.job.pageRange = null;
		this.updateJob();
	}
	endJob() {
		this.log('Job Complete', this.id, this.job.name);
		this.client.emit('complete', { name: this.job.name });
		this.resetJob();
		// this.clearCache();
	}
}

module.exports = Executor;
