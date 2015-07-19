import dgram from 'dgram';
import { EventEmitter } from 'events';
import async from 'async';
import Packet from './Packet';
import EncapsulatedPacket from './EncapsulatedPacket';

class NetworkHandler extends EventEmitter {

  constructor() {
    super();

    this.packetHandlers = [ ];

    this.socket = dgram.createSocket('udp4');

    this.socket.on('message', (message, rinfo) => {
      this.processMessage(message, rinfo);
    });
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

  sendMessageTo(packet, rinfo) {
    let buffer = packet.encode();

    this.socket.send(buffer, 0, buffer.length, rinfo.port, rinfo.address);
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

  close() {
    this.socket.close();
  }

}

export default NetworkHandler;
