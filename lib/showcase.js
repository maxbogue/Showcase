var express = require('express'),
    path = require('path'),
	mongoStore = require('connect-mongodb'),
	Server = require('mongodb').Server,
	utils = require('./utils'),
    dateFormat = require('./dateFormat.js');

function showcase(settings, module_list) {
	if (settings === undefined || !('secret' in settings))
		throw "Must provide the \"secret\" setting."
	if (module_list === undefined)
		module_list = ['blog', 'projects'];
	module_list = ['admin', 'auth'].concat(module_list)

	var defaults = {
		dbName: 'showcase',
		dbServer: 'localhost',
		dbPort: 27017,
		dir: __dirname + "/../..",
		port: 80,
		defaultUsername: 'Showcase user',
		defaultPassword: 'guest', // Archer anyone?
		blogHome: '/',
		blogPath: 'posts',
		projectsPath: 'projects',
		customRoutes: {},
	};

	settings = utils.extend(defaults, settings);
	settings.blogHome = path.join('/', settings.blogHome);
	settings.blogPath = path.join('/', settings.blogPath);
	settings.projectsPath = path.join('/', settings.projectsPath);

	var server = express.createServer();
	var app = {
		server: server,
		settings: settings,
		start: function() {
			server.listen(settings.port);
		},
		errors: {
			NotFound: function(msg) {
			    this.name = 'NotFound';
			    Error.call(this, msg);
			    Error.captureStackTrace(this, arguments.callee);
			},
			Unauthorized: function(msg) {
				this.name = 'Unauthorized';
			    Error.call(this, msg);
			    Error.captureStackTrace(this, arguments.callee);
			},
		},
		decorators: {
			loginRequired: function(f) {
				return function(req, res, next) {
					if (req.session.user) {
						f(req, res, next);
					}
					else {
						throw app.errors.Unauthorized();
					}
				};
			},
		},
	};

	server.configure(function() {
		this.enable('strict routing');
		this.use(express.cookieParser());
		this.use(express.bodyParser());
		this.use(express.session({
			store: new mongoStore({
				server_config: new Server(settings.dbServer, settings.dbPort, {
					auto_reconnect: true, 
					native_parser: true
				}),
				dbname: settings.dbName,
				collection: 'sessions',
				reapInterval: 60000 * 10 
			}),
			secret: settings.secret
		}));
		this.use(express.methodOverride());
		this.use(this.router);

		this.set("view engine", "html");
		this.set("views", settings.dir + "/views");
		this.set('view options', {
			layout: settings.dir + '/views/layout'
		});

		this.register(".html", require("jqtpl").express);
		this.dynamicHelpers({
			user: function(req, res) {
				return req.session && req.session.user;
			},
			settings: function(req, res) {
			    return app.settings;
			},
		});

		// Static files and 404 handling.
		this.use(express.static(settings.dir + '/public'));
		this.use(function() {
			throw new app.errors.NotFound();
		});
		this.error(function(err, req, res, next) {
		    if (err instanceof app.errors.NotFound) {
		        res.render('404', { status: 404 });
		    } else {
		        next(err);
		    }
		});
	});

	module_list.forEach(function(m) {
		var M = require('./' + m);
		app[m] = new M(app);
	});

	for (var k in settings.customRoutes) {
	    (function(v) {
		    server.get(k, function(req, res) {
			    res.render(v);
		    });
		})(settings.customRoutes[k]);
	}

	return app;
}

module.exports = showcase;
