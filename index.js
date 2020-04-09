const Client = require('./src/Client');
const Dashboard = require('./src/Dashboard');

const main = () => {
	const dashboard = new Dashboard();
	const client = new Client(1, dashboard);
}

main();