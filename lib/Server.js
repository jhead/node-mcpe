import dgram from 'dgram';
import { EventEmitter } from 'events';
import Packet from './net/Packet';

class Server extends EventEmitter {

  constructor({ address = '0.0.0.0', port = 19132 } = { }) {
    super();

    this.localAddress = address;
    this.localPort = port;
  }

  listen(callback) {
    let { localAddress, localPort } = this;

    let socket = this.socket = dgram.createSocket('udp4');

    socket.on('message', (message, rinfo) => {
      this.processMessage(message, rinfo);
    });


    socket.bind(localPort, localAddress, () => {
      this.emit('listen');
    });
  }

  close() {
    this.socket.close();
  }

  processMessage(message, rinfo) {
    let packet = Packet.decode(message);

    this.emit('packet', packet, rinfo);
  }

  sendMessage(packet, rinfo) {
    this.socket.send(packet.encode(), 0, packet.size(), rinfo.port, rinfo.address);
  }

}

export default Server;
