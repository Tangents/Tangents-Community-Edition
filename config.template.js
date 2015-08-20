var config = module.exports = {};

// HP IDOL OnDemand
config.iod = {
	"apikey": "{{ Enter your API key for IDOL OnDemand }}"
};

// IBM Bluemix AlchemyAPI
config.alchemyapi = {
	"apikey": "{{ Enter your API key for AlchemyAPI }}"
};

// Respoke
config.respoke = {
	"appId": "{{ Enter the AppID of your Respoke application }}",
	"appSecret": "{{ Enter the App-Secret of your Respoke application }}",
	"userRoleId": "{{ Enter the RoleID assigned to the users of your Respoke application }}"
};

// express-session
config.session = {
	"secret": "{{ Enter a secret string for visitor sessions }}"
};
