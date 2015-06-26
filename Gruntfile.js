module.exports = function(grunt) {

	grunt.initConfig({

		jshint: {
			files: ['*.js', 'lib/*.js', 'public/js/*.js']
		}

	});

	grunt.loadNpmTasks('grunt-contrib-jshint');

	grunt.registerTask('test', ['jshint']);

	grunt.registerTask('default', ['jshint']);

};