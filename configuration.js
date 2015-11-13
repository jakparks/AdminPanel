var config = {};

config.user = process.env.ADMIN_USER;
config.password = process.env.ADMIN_PASS;

config.jar = './db/ojdbc14.jar';


module.exports = config;
