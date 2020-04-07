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
		this.status = 'disconnected';

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
	updateStatus(status = 'Disconnected', job = {}) {
		this.status = status;
		this.logger.updateJob({
			...job,
			status: this.status
		});
	}
	onConnect() {
		this.log('Connected to Master');
		this.id = this.client.id;
		this.updateStatus('Connected');
	}
	onError(err) {
		this.log(err);
		this.updateStatus('Error');
		this.launchIntervalConnect();
	}
	onDisconnect() {
		this.updateStatus('Disconnected');
		this.log('Connection closed');
	}
	onStart(job) {
		this.log(job.file);
		this.startJob(job);
	}
	downloadFile(file) {
		this.log(`Downloading File ${file}`);
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
	async startJob(job) {
		job.startTime = new Date();

		job.executorName = this.name;
		job.executorId = this.id;

		// reset the cache so no file problems
		this.clearCache();

		// get the file to rip into a local cache
		// console.log(job);
		this.log(job.file);
		job.localFile = await this.downloadFile(job.file);
		this.log('Starting job', job.file, job.pageRange);

		// create the job
		this.updateStatus('Running', job);

		// create the RIP
		this.rip = new RIP(this.name, this.logger);
		this.rip.on('error', err => {
			// console.error('ripping error', err);
			delete this.rip;
		});
		this.rip.on('complete', () => {
			this.endJob(job);
			delete this.rip;
		});

		// start the rip
		this.rip.rip(job);
		this.client.emit('complete', job);
	}
	endJob(job) {
		job.endTime = new Date();
		job.duration = job.endTime.getTime() - job.startTime.getTime();

		this.log(`Duration ${job.duration}ms`);
		this.log(`Job Complete`);
		this.client.emit('complete', job);
		this.updateStatus('Stopped');
		// this.clearCache();
	}
}

module.exports = Executor;
