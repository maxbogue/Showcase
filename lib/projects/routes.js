var markdown = require('node-markdown').Markdown,
	path = require('path');

module.exports = function(projects, app) {

	function addPrefix(route) {
		return path.join('/', projects.path, route);
	}

	projects.get = {
		home: function(req, res) {
			projects.getProjects(function(err, projects) {
				projects.forEach(function(elem, i) {
					elem.renderedContent = markdown(elem.content, true);
				});
				res.local('projects', projects);
				res.render('projects/viewProjects');
			});
		},
		createProject: function(req, res) {
			res.render('projects/createProject');
		},
		editProject: function(req, res, next) {
			projects.getProject(req.params.slug, function(err, project) {
				if (project) {
					res.local('project', project);
					res.render('projects/editProject');
				}
				else {
					next();
				}
			});
		},
		deleteProject: function(req, res, next) {
			projects.getProject(req.params.slug, function(err, project) {
				if (project) {
					res.local('project', project);
					res.render('projects/deleteProject');
				}
				else {
					next();
				}
			});
		},
		viewProject: function(req, res, next) {
			projects.getProject(req.params.slug, function(err, project) {
				if (project) {
					project.renderedContent = markdown(project.content, true);
					res.local('project', project);
					res.render('projects/viewProject');
				}
				else {
					next();
				}
			});
		}
	}
	projects.post = {
		editProject: function(req, res) {
			if (req.body.slug) {
				projects.upsertProject({
					"slug": req.body.slug,
					"title": req.body.title,
					"content": req.body.content
				});
			}
			else {
				projects.upsertProject({
					"title": req.body.title,
					"content": req.body.content,
					"date": new Date()
				});
			}
			res.redirect(addPrefix(''));
		},
		deleteProject: function(req, res) {
			projects.deleteProject(req.params.slug);
			res.redirect(addPrefix(''));
		}
	};
	var reqLogin = app.decorators.loginRequired;
	app.server.get( addPrefix(''),             projects.get.home);
	app.server.get( addPrefix('create'),       reqLogin(projects.get.createProject));
	app.server.post(addPrefix('create'),       reqLogin(projects.post.editProject));
	app.server.get( addPrefix('edit/:slug'),   reqLogin(projects.get.editProject));
	app.server.post(addPrefix('edit/:slug'),   reqLogin(projects.post.editProject));
	app.server.get( addPrefix('delete/:slug'), reqLogin(projects.get.deleteProject));
	app.server.post(addPrefix('delete/:slug'), reqLogin(projects.post.deleteProject));
	app.server.get( addPrefix(':slug'),        projects.get.viewProject);
}
