# node-mcpe
A Node.js library for interacting with Minecraft Pocket Edition clients and servers.

## Installation
Please note that this project uses ECMAScript 2015 syntax and, therefore, it's recommended that you use [Babel](https://babeljs.io) to transpile the source or to run the examples.

```sh
$ npm install -g babel
$ npm install jhead/node-mcpe
```

## Running the examples
```sh
$ babel-node examples/basic-server.js
```

## Use cases
It's probably not practical to use this library to write/run your own Pocket Edition server. With that said, I aim to provide a library that's suitable for testing Pocket Edition clients and servers through manipulation of the protocol. There are many possible use cases in addition to testing, such as creating bots.

## Status
This project is in a very early stage with minimal features and functionality. My goal is to eventually cover and support the entire MCPE protocol, both from the server and client side. I'm usually pretty busy, so I offer no guarantee that I'll ever reach that goal or even come close.
