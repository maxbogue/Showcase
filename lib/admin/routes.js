var utils = require('../utils');

module.exports = function(admin, app) {
	admin.get = {
		admin: function(req, res) {
		    function getData(data, getters) {
		        var keys = Object.keys(getters);
		        if (keys.length > 0) {
		            var k = keys[0];
		            getters[k](function(err, v) {
		                data[k] = v;
		                delete getters[k];
		                getData(data, getters);
		            });
		        } else {
		            res.render('admin', {
		                'sections': admin.sections,
		                'sectionData': data,
		            });
		        }
		    }
			if (req.session.user) {
			    getData({}, utils.copy(admin.dataGetters));
			}
			else {
				res.redirect('/login');
			}
		},
	};
	admin.post = {};
	app.server.get('/admin', admin.get.admin);
}
