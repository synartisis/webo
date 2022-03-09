webo is a development server and a build tool for the web.

## installation
install webo as dev dependency

```console
$ npm i -D webo
```

## features

* live reloading when a resource is changed (saved)
* autopatching css styles without reloading when changing a css file
* building with optionally bundling, transpiling, minifying and cache busting


## usage

### development

if you have the following file structure:
```
  src
    client
      index.html
      styles.css
      ...
    server
      server.js
```
you can run (or put it in a package.json script wihtout npx)
```console
$ npx webo dev src/server/server.js -s src/server -c src/client
```
-s flag marks the directory as server-side content  
-c flag marks the directory as client-side content

### build

to build your project :  
```console
$ npx webo build --cachebust -s src/server -c src/client
```
the above will put the outputs in a ```dist/``` directory.

You can check all the command-line options in ```webo-config.js```
