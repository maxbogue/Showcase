var path = require('path'),
	ShowcaseModule = require('./../showcaseModule'),
	utils = require('../utils');

function Admin(app) {
	ShowcaseModule.call(this, path.basename(__dirname), app);
	this.sections = [];
	this.dataGetters = {};
}

Admin.prototype = new ShowcaseModule();

Admin.prototype.addSection = function(sectionTemplate, dataGetters) {
	this.sections.splice(0, 0, sectionTemplate);
	if (dataGetters) utils.extend(this.dataGetters, dataGetters);
}

module.exports = Admin;
