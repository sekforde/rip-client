const Executor = require('./Executor');
const config = require('../config');

class Client {
	constructor(count, dashboard) {
		this.executors = [];
		this.dashboard = dashboard;
		for (let i = 0; i < count; i++) {
			const name = `RIP-${i + 1}`;
			const logger = this.dashboard.addLog(name);
			this.executors.push(new Executor(config.host, config.port, name, logger));
		}
	}
}

module.exports = Client;
