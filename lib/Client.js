import NetworkHandler from './net/NetworkHandler';

class Client extends NetworkHandler {

  constructor(address, port) {
    super();

    this.remoteAddress = address;
    this.remotePort = port;
  }

  sendMessage(packet) {
    let { remoteAddress, remotePort } = this;
    
    this.sendMessageTo(packet, { address: remoteAddress, port: remotePort });
  }

}

export default Client;
