module.exports =
  pac:
    files:
      # coffeelint: disable=max_line_length
      'build/js/omega_pac.min.js': 'node_modules/switchyomega-pac/omega_pac.min.js'
      # coffeelint: enable=max_line_length
  lib:
    expand: true
    cwd: 'lib'
    src: ['**/*']
    dest: 'build/lib/'
  img:
    expand: true
    cwd: 'img'
    src: ['**/*']
    dest: 'build/img/'
  popup:
    expand: true
    cwd: 'src/popup'
    src: ['**/*']
    dest: 'build/popup/'
