var path = require('path'),
	step = require('step'),
	ShowcaseModule = require('./../showcaseModule');

function createSlug(title) {
	slug = title.replace(/[^A-Za-z0-9']+/g, '-').toLowerCase();
	slug = slug.replace(/^-/, '').replace(/-$/, '');
	return slug;
}

function incSlug(slug, i) {
	if (i == 1) return slug;
	return slug + '-' + i;
}

function makeSlugUnique(db, slug, callback, i) {
	i = i || 1;
	db.projects.count({'slug': incSlug(slug, i)}, function(err, count) {
		if (count < 1) {
			callback(incSlug(slug, i));
		}
		else {
			makeSlugUnique(slug, callback, ++i);
		}
	});
}

function Projects(app) {
    // app.admin.addSection('blog/admin');
	this.prefix = app.settings.projectsPrefix;
	ShowcaseModule.call(this, path.basename(__dirname), app);
	var db = this.db;
	db.bind('projects', { 
		createUniqueSlug: function(title, callback) {
			makeSlugUnique(db, createSlug(title), callback);
		}
	});
}

Projects.prototype = new ShowcaseModule();

Projects.prototype.getProjects = function(callback) {
	this.db.collection('projects').find({}, {sort: [['date', 'desc']]})
		.toArray(callback);
}

Projects.prototype.createProject = function(project) {
	if (!project.title || !project.content) return;
	var that = this;
	step(
		function() {
			var slug = createSlug(project.title);
			makeSlugUnique(that.db, slug, this);
		},
		function(slug) {
			project.slug = slug;
			that.db.projects.insert([project]);
		}
	);
}

Projects.prototype.upsertProject = function(project) {
	var db = this.db;
	var upsert = function(slug) {
		db.projects.update({"slug": slug}, {$set: project}, {upsert: true})
	};
	if (!project.slug) {
		db.projects.createUniqueSlug(project.title, upsert);
	}
	else {
		upsert(project.slug);
	}
}

Projects.prototype.deleteProject = function(slug) {
	this.db.projects.remove({'slug': slug});
}

Projects.prototype.getProject = function(slug, callback) {
	this.db.projects.find({'slug': slug}).toArray(function(err, projects) {
		callback(err, projects[0]);
	});
}

module.exports = Projects;
