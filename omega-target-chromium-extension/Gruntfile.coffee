module.exports = (grunt) ->
  require('load-grunt-config')(grunt)
  require('./grunt-po2crx')(grunt)

  grunt.registerTask 'chromium-manifest', ->
    manifest = grunt.file.readJSON('overlay/manifest.json')
    # Note: 'downloads' permission was removed from the source manifest (SEC-003).
    # This task now just writes the manifest to tmp/ for the build pipeline.
    grunt.file.write('tmp/manifest.json', JSON.stringify(manifest))
