# hhm-plugins

Repository of plugins for [Haxball Headless Manager](https://github.com/saviola777/haxball-headless-manager).

This repository offers following plugins:

- [tine2k/push-stats](src/tine2k/push-stats.js)
- [tine2k/stats](src/tine2k/stats.js)

## Usage

In [haxroomie-cli](https://www.npmjs.com/package/haxroomie-cli) config you can add the repository to the `repository` section.

e.g.

```js
repositories: [
    // ...
    {
        type: 'github',
        repository: 'tine2k/hhm-plugins',
    }
]
```

and add the following to the `config` section:

```js
pluginConfig: {
    // ...
    'tine2k/push-stats': {
        // this is the endpoint the plugin will POST game statistics to
        url: 'http://localhost:3000/stats' 
    }
}
```
Have a look at [this repo](https://github.com/tine2k/hax-stats) for a server that will store and show all games in a web UI.
