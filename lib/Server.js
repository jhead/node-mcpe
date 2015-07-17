import dgram from 'dgram';
import { EventEmitter } from 'events';
import Packet from './net/Packet';
import EncapsulatedPacket from './net/EncapsulatedPacket';
import async from 'async';

class Server extends EventEmitter {

  constructor({ address = '0.0.0.0', port = 19132 } = { }) {
    super();

    this.localAddress = address;
    this.localPort = port;
    this.packetHandlers = [ ];
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
    let packet, leadingByte = message[0];

    if (leadingByte >= 0x80 && leadingByte <= 0x8F) {
      packet = EncapsulatedPacket.decode(message);
    } else {
      packet = Packet.decode(message);
    }

    this.emit('packet', packet, rinfo);

    let packetHandlers = this.packetHandlers[packet.id];

    async.eachSeries(packetHandlers, (handlerDefinition, next) => {
      let { handler, precondition } = handlerDefinition;
      let checkNecessary = (typeof precondition !== 'undefined' && precondition !== null);

      if (checkNecessary) {
        if (precondition(packet, rinfo) === true) {
          handler(packet, rinfo, next);
        }
      } else {
        handler(packet, rinfo, next);
      }
    });
  }

  sendMessage(packet, rinfo) {
    this.socket.send(packet.encode(), 0, packet.size(), rinfo.port, rinfo.address);
  }

  addPacketHandler(protocol, precondition, handler) {
    let { packetHandlers } = this;
    let protoID = protocol.id;

    if (typeof handler !== 'function') {
      handler = precondition;
      precondition = null;
    }

    if (typeof packetHandlers[protoID] === 'undefined') {
      packetHandlers[protoID] = [ ];
    }

    packetHandlers[protoID].push({
      precondition,
      handler
    });
  }

}

export default Server;
