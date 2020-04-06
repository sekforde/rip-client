const blessed = require('blessed');
const contrib = require('blessed-contrib');
const Status = require('./Status');

class ProcessLogger {
	constructor(index, grid, name) {
		this.grid = grid;
		this.colorMap = {
			'Stopped': 'red',
			'Connected': 'cyan',
			'Running': 'green'
		};

		const left = index * 12 / 4;

		this.statusGauge = this.grid.set(0, left, 2, 3, Status, {
			label: 'Status',
			status: 'Stopped'
		});

		this.rollingLog = this.grid.set(2, left, 8, 3, contrib.log, {
			fg: "green",
			selectedFg: "green",
			label: `Thread: ${name}`
		});

		this.jobTable = this.grid.set(9, left, 2, 3, contrib.table, {
			keys: true,
			fg: 'green',
			label: 'Active Job',
			columnSpacing: 1,
			columnWidth: [15, 20]
		});

		this.updateJob({
			name: '',
			status: 'Stopped',
			pageRange: ''
		});
	}
	log(args) {
		this.rollingLog.log(...args);
	}
	updateJob(job) {
		this.statusGauge.setStatus(job.status, this.colorMap[job.status]);
		const data = [
			['Name:', job.name || ''],
			['Status:', job.status || 'Stopped'],
			['Page Range:', job.pageRange || '']
		];
		this.jobTable.setData({ headers: ['', ''], data });
	}
}

class Dashboard {
	constructor() {
		this.screen = blessed.screen({
			// smartCSR: true
		});

		this.grid = new contrib.grid({
			rows: 12,
			cols: 12,
			screen: this.screen
		});

		this.screen.key(['escape', 'q', 'C-c'], (ch, key) => process.exit(0));
		this.logCount = 0;
		this.screen.render();
	}
	addLog(name) {
		const logger = new ProcessLogger(this.logCount, this.grid, name);
		this.logCount++;
		this.screen.render();
		return logger;
	}
}

module.exports = Dashboard;
