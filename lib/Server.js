import NetworkHandler from './net/NetworkHandler';

class Server extends NetworkHandler {

  constructor({ address = '0.0.0.0', port = 19132 } = { }) {
    super();

    this.localAddress = address;
    this.localPort = port;
  }

  listen(callback) {
    let { socket, localAddress, localPort } = this;

    socket.bind(localPort, localAddress, () => {
      this.emit('listen');
    });
  }

}

export default Server;
