module.exports = (grunt) ->
  require('load-grunt-config')(grunt)
  require('./grunt-po2crx')(grunt)

  grunt.registerTask 'chromium-manifest', ->
    manifest = grunt.file.readJSON('overlay/manifest.json')
    # 'downloads' removed from source manifest (SEC-003).
    grunt.file.write('tmp/manifest.json', JSON.stringify(manifest))
