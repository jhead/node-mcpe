import dgram from 'dgram';
import { EventEmitter } from 'events';
import async from 'async';
import { SinglePacketMessage, MultiPacketMessage } from './Message';
import Packet from './Packet';
import EncapsulatedPacket from './EncapsulatedPacket';

class NetworkHandler extends EventEmitter {

  constructor() {
    super();

    this.messageHandlers = [ ];
    this.messageQueue = { };

    this.socket = dgram.createSocket('udp4');

    this.socket.on('message', (message, rinfo) => {
      this.receiveMessage(message, rinfo);
    });

    this.ackInterval = 100;
    this.ackQueue = [ ];
    this.scheduleNextAck();
  }

  receiveMessage(rawMessage, rinfo) {
    let packet, message;
    let firstByte = rawMessage[0];
    let isEncapsulated = (firstByte >= 0x80 && firstByte <= 0x8F);
    let shouldProcessMessage = true;
    let ackNeeded = isEncapsulated;

    if (isEncapsulated) {
      packet = EncapsulatedPacket.decode(rawMessage);

      if (packet.fragmented) {
        let fragmentID = packet.fragmentID;
        let messageInQueue = (typeof this.messageQueue[fragmentID] !== 'undefined');

        if (!messageInQueue) {
          message = this.messageQueue[fragmentID] = new MultiPacketMessage(packet.id);
          console.log(`Creating new message queue item: ${packet._id}`);
        } else {
          message = this.messageQueue[fragmentID];
          console.log(`Message was already in queue; current fragment index is ${packet.fragmentIndex}; there are ${packet.fragmentCount} total fragments`);
        }

        message.addPacket(packet);
        shouldProcessMessage = (packet.fragmentIndex >= packet.fragmentCount - 1);
      } else {
        message = new SinglePacketMessage(packet);
      }
    } else {
      packet = Packet.decode(rawMessage);

      message = new SinglePacketMessage(packet);
    }

    if (shouldProcessMessage) {
      this.processMessage(message, rinfo);
    }

    if (ackNeeded) {
      this.ackQueue.push({ packet, rinfo });
    }

    this.emit('packet', packet, rinfo);
  }

  sendAck() {
    while (this.ackQueue.length > 0) {
      let { packet } = this.ackQueue.pop();
      console.log(`Sending ACK for fragment index ${packet.fragmentIndex}`);

      // TODO
    }

    this.scheduleNextAck();
  }

  scheduleNextAck() {
    setTimeout( () => {
      this.sendAck();
    }, this.ackInterval);
  }

  processMessage(message, rinfo) {
    let messageHandlers = this.messageHandlers[message.id];
    let isUnhandled = (typeof messageHandlers === 'undefined' || messageHandlers.length === 0);

    if (!isUnhandled) {
      async.eachSeries(messageHandlers, (handlerDefinition, next) => {
        let { handler, precondition } = handlerDefinition;
        let checkNecessary = (typeof precondition !== 'undefined' && precondition !== null);

        if (checkNecessary) {
          if (precondition(packet, rinfo) === true) {
            handler(message, rinfo, next);
          }
        } else {
          handler(message, rinfo, next);
        }
      });
    } else {
      this.emit('unhandledMessage', message, rinfo);
    }

    this.emit('message', message, rinfo);
  }

  sendMessageTo(message, rinfo, mtu = 1466) {
    if (message instanceof Packet) {
      message = new SinglePacketMessage(message);
    }

    let buffers = message.encode(mtu);

    buffers.forEach( (buffer) => {
      this.socket.send(buffer, 0, buffer.length, rinfo.port, rinfo.address);
    });
  }

  addMessageHandler(protocol, precondition, handler) {
    let { messageHandlers } = this;
    let protoID = protocol.id;

    if (typeof handler !== 'function') {
      handler = precondition;
      precondition = null;
    }

    if (typeof messageHandlers[protoID] === 'undefined') {
      messageHandlers[protoID] = [ ];
    }

    messageHandlers[protoID].push({
      precondition,
      handler
    });
  }

  close() {
    this.socket.close();
  }

}

export default NetworkHandler;
