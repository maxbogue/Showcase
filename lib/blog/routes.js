var markdown = require('node-markdown').Markdown,
	path = require('path');

module.exports = function(blog, app) {
	function addPrefix(route) {
		return path.join(blog.path, route);
	}
	blog.get = {
		home: function(req, res) {
			blog.getPosts(function(err, posts) {
				posts.forEach(function(elem, i) {
					elem.renderedContent = markdown(elem.content, true);
				});
				res.local('posts', posts);
				res.render('blog/viewPosts');
			});
		},
		createPost: function(req, res) {
			res.render('blog/createPost');
		},
		editPost: function(req, res, next) {
			blog.getPost(req.params.slug, function(err, post) {
				if (post) {
					res.local('post', post);
					res.render('blog/editPost');
				}
				else {
					next();
				}
			});
		},
		deletePost: function(req, res, next) {
			blog.getPost(req.params.slug, function(err, post) {
				if (post) {
					res.local('post', post);
					res.render('blog/deletePost');
				}
				else {
					next();
				}
			});
		},
		viewPost: function(req, res, next) {
			blog.getPost(req.params.slug, function(err, post) {
				if (post) {
					post.renderedContent = markdown(post.content, true);
					res.local('post', post);
					res.render('blog/viewPost');
				}
				else {
					next();
				}
			});
		},
		manage: function(req, res) {
			if (req.session.user) {
				blog.getPosts(function(err, posts) {
					res.local('posts', posts);
					res.render('blog/manage');
				});
			}
			else {
				res.redirect('/login')
			}
		}
	}
	blog.post = {
		editPost: function(req, res) {
			if (req.body.slug) {
				blog.upsertPost({
					"slug": req.body.slug,
					"title": req.body.title,
					"content": req.body.content
				});
			}
			else {
				blog.upsertPost({
					"title": req.body.title,
					"content": req.body.content,
					"date": new Date()
				});
			}
			res.redirect('/');
		},
		deletePost: function(req, res) {
			blog.deletePost(req.params.slug);
			res.redirect('/');
		}
	};
	var reqLogin = app.decorators.loginRequired;
	app.server.get( path.join('/', blog.home), blog.get.home);
	app.server.get( addPrefix('manage'),       blog.get.manage);
	app.server.get( addPrefix('create'),       reqLogin(blog.get.createPost));
	app.server.post(addPrefix('create'),       reqLogin(blog.post.editPost));
	app.server.get( addPrefix('edit/:slug'),   reqLogin(blog.get.editPost));
	app.server.post(addPrefix('edit/:slug'),   reqLogin(blog.post.editPost));
	app.server.get( addPrefix('delete/:slug'), reqLogin(blog.get.deletePost));
	app.server.post(addPrefix('delete/:slug'), reqLogin(blog.post.deletePost));
	app.server.get( addPrefix(':slug'),  blog.get.viewPost);
}
