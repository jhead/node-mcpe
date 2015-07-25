import dgram from 'dgram';
import { EventEmitter } from 'events';
import async from 'async';
import Protocol from './Protocol';
import { InternalMessage, DataMessage  } from './Message';
import Packet from './Packet';
import EncapsulatedPacket from './EncapsulatedPacket';

class NetworkHandler extends EventEmitter {

  constructor() {
    super();

    this.packetHandlers = [ ];
    this.messageQueue = { };
    this.mtu = 1466;

    this.socket = dgram.createSocket('udp4');

    this.socket.on('message', (message, rinfo) => {
      this.receiveMessage(message, rinfo);
    });

    this.ackInterval = 100;
    this.ackQueue = [ ];
    this.scheduleNextAck();
  }

  receiveMessage(rawMessage, rinfo) {
    let firstByte = rawMessage[0];
    let isEncapsulated = (firstByte >= 0x80 && firstByte <= 0x8F);

    if (isEncapsulated) {
      EncapsulatedPacket.fromBuffer(rawMessage, (err, packet) => {
        this.receiveEncapsulatedPacket(packet, rinfo);
      });

      return;
    }

    Packet.fromBuffer(rawMessage, (err, packets) => {
      if (!Array.isArray(packets)) {
        packets = [ packets ];
      }

      packets.forEach( (packet) => {
        this.receiveInternalPacket(packet, rinfo);
      });
    });
  }

  receiveInternalPacket(packet, rinfo) {
    let message = new InternalMessage(packet);

    this.processMessage(message, rinfo);
  }

  receiveEncapsulatedPacket(packet, rinfo) {
    let message;
    let shouldProcessMessage = true;

    if (packet.fragmented) {
      let fragmentID = packet.fragmentID;
      let messageInQueue = (typeof this.messageQueue[fragmentID] !== 'undefined');

      if (!messageInQueue) {
        message = this.messageQueue[fragmentID] = new DataMessage(packet);
        console.log(`Creating new message queue item: ${packet._id}`);
      } else {
        message = this.messageQueue[fragmentID];
        console.log(`Message already in queue; this is fragment ${packet.fragmentIndex}; there are ${packet.fragmentCount} total fragments`);
      }

      message.addPacket(packet);

      shouldProcessMessage = (packet.fragmentIndex >= packet.fragmentCount - 1);
    } else {
      message = new DataMessage(packet, packet.sequenceNumber, packet.messageIndex, this.mtu);
    }

    if (shouldProcessMessage) {
      this.ackQueue.push({ packet, rinfo });
      this.processMessage(message, rinfo);
    }
  }

  sendAck() {
    let sequences = { };

    while (this.ackQueue.length > 0) {
      let { packet, rinfo } = this.ackQueue.pop();
      let sequence = packet.sequenceNumber;

      console.log(`Sending ACK for sequence #${sequence} to ${rinfo.address}:${rinfo.port}`);

      let key = rinfo.address + ':' + rinfo.port;
      let seqList = sequences[key];

      if (typeof seqList === 'undefined') {
        seqList = sequences[key] = [ ];
      }

      seqList.push(sequence);
    }

    Object.keys(sequences).forEach( (client) => {
      let list = sequences[client];
      if (list.length === 0) return;

      let rinfo = {
        address: client.split(':')[0],
        port: client.split(':')[1]
      };

      let packet = Packet.create(Protocol.ACK, { payload: list });

      this.sendMessageTo(new InternalMessage(packet), rinfo);
    });

    this.scheduleNextAck();
  }

  scheduleNextAck() {
    setTimeout( () => {
      this.sendAck();
    }, this.ackInterval);
  }

  processMessage(message, rinfo) {
    message.getPackets( (err, packets) => {
      if (err) {
        throw err;
      } else if (packets === null || typeof packets === 'undefined' || packets.length === 0) {
        console.log('Message returned no packets');
        return;
      }

      packets.forEach( (packet) => {
        let packetHandlers = this.packetHandlers[packet.id];
        let isUnhandled = (typeof packetHandlers === 'undefined' || packetHandlers.length === 0);

        if (!isUnhandled) {
          async.eachSeries(packetHandlers, (handlerDefinition, next) => {
            let { handler, precondition } = handlerDefinition;
            let checkNecessary = (typeof precondition !== 'undefined' && precondition !== null);

            if (checkNecessary) {
              if (precondition(packet, rinfo) === true) {
                return handler(packet, rinfo, next);
              }
            }

            return handler(packet, rinfo, next);
          });

          this.emit('packet', packet, rinfo);
          return;
        }

        this.emit('unhandledPacket', packet, rinfo);
      });
    });
  }

  sendMessageTo(message, rinfo, mtu = 1466) {
    if (!this.ready) {
      console.log('Skipping message send, socket not ready');
      return;
    }

    if (message instanceof Packet) {
      message = new InternalMessage(message);
    }

    let buffers = message.encode(mtu);

    buffers.forEach( (buffer) => {
      this.socket.send(buffer, 0, buffer.length, rinfo.port, rinfo.address);
    });
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
    this.ready = false;
    this.socket.close();
  }

}

export default NetworkHandler;
