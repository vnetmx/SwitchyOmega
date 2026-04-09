path = require('path')
module.exports =
  index:
    files:
      'index.js': 'index.coffee'
    options:
      transform: ['coffeeify']
      exclude: ['bluebird', 'switchyomega-pac', 'switchyomega-target']
      browserifyOptions:
        extensions: '.coffee'
        builtins: []
        standalone: 'index.coffee'
        debug: true
  browser:
    files:
      'omega_target_chromium_extension.min.js': 'index.coffee'
    options:
      alias: [
        './index.coffee:OmegaTargetChromium'
      ]
      transform: ['coffeeify']
      plugin:
        if process.env.BUILD == 'release'
          [['minifyify', {map: false}]]
        else
          []
      browserifyOptions:
        extensions: '.coffee'
        standalone: 'OmegaTargetChromium'
  omega_webext_proxy_script:
    files:
      'build/js/omega_webext_proxy_script.min.js':
        'src/js/omega_webext_proxy_script.js'
    options:
      alias:
        'switchyomega-pac': 'switchyomega-pac/omega_pac.min.js'
      plugin:
        if process.env.BUILD == 'release'
          [['minifyify', {map: false}]]
        else
          []
      browserifyOptions:
        noParse: [require.resolve('switchyomega-pac/omega_pac.min.js')]
