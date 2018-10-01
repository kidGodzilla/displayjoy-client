# Display Joy client library

Display Joy Digital Signage client library

## About

The Display Joy library works with your Display Joy account to handle device registration, profile management, authentication, configuration and status management.

Display Joy's developer libraries provide everything you need to provision, manage, and build displays- configuration management, uptime analytics, and authentication.


## Installation

### Client-side (CDN)

`https://unpkg.com/displayjoy-client@latest/display-joy.js`

`<script src="https://unpkg.com/displayjoy-client@latest/display-joy.js"></script>`

### NPM

Run `npm i -s displayjoy-client` to save locally via NPM


## Usage Examples
The following example registers a device with the display key **fooallbars**, gets it's **device configuration**, subscribes to updates, and sends regular status updates.

```
var dj = new DisplayJoy();
dj.init('fooallbars');
```


## References

### Website
> Website: https://kidgodzilla.github.io/displayjoy-client/

### Documentation
> Docs: https://kidgodzilla.github.io/displayjoy-client/docs/

> Doc comments: http://usejsdoc.org/
