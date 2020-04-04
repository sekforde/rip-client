const Slave = require('./src/Slave');
const config = require('./config');

const main = () => {
	console.clear();
	const slave1 = new Slave(config.host, config.port, 'slave1');
	const slave2 = new Slave(config.host, config.port, 'slave2');
	const slave3 = new Slave(config.host, config.port, 'slave3');
	const slave4 = new Slave(config.host, config.port, 'slave4');
}

main();