var config = {};

config.user = process.env.ADMIN_USER;
config.password = process.env.ADMIN_PASS;

config.url = 'jdbc:oracle:thin:@lnxdb-dev-vm-241.cisco.com:1524:AS1DEV';
config.driver = 'oracle.jdbc.driver.OracleDriver';
config.jar = './db/ojdbc14.jar';


module.exports = config;
