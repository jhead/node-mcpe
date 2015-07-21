import NetworkHandler from './net/NetworkHandler';

class Client extends NetworkHandler {

  constructor(address, port) {
    super();

    this.remoteAddress = address;
    this.remotePort = port;
  }

  sendMessage(message) {
    let { remoteAddress, remotePort } = this;

    this.sendMessageTo(message, { address: remoteAddress, port: remotePort });
  }

}

export default Client;
