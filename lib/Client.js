import NetworkHandler from './net/NetworkHandler';

class Client extends NetworkHandler {

  constructor(address, port) {
    super();

    this.ready = true;
    this.remoteAddress = address;
    this.remotePort = port;

    this.mtu = 1426;
    this.nextSequence = 0;
    this.nextMessage = 0;
  }

  sendMessage(message) {
    let { remoteAddress, remotePort } = this;

    this.sendMessageTo(message, { address: remoteAddress, port: remotePort });
  }

}

export default Client;
