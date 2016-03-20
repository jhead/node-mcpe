import Packet from './Packet';
import EncapsulatedPacket from './EncapsulatedPacket';

class Message {

  constructor(id, type) {
    this.id = id;
    this.type = type;

    this.packets = [ ];
  }

  addPacket(packet) {
    if (packet.encapsulated) {
      this.packets[packet.fragmentIndex] = packet;

      if (packet.fragmentIndex === 0) {
        this.id = packet.id;
      }
    } else {
      this.packets.push(packet);
    }
  }

  getPackets(callback) {
    return callback(null, this.packets);
  }

}

class InternalMessage extends Message {

  constructor(packet) {
    super(packet.id, 'InternalMessage');

    this.addPacket(packet);
    this.packet = packet;

    this.decode();
  }

  encode() {
    return [ this.packet.encode() ];
  }

  decode() {
    this.fields = this.packet.fields;
  }

}

class DataMessage extends Message {

  constructor(packet, sequenceNumber = 0, messageIndex = 0, maxPacketSize = 1466) {
    super(packet.id, 'DataMessage');

    this.maxPacketSize = maxPacketSize;

    if (packet instanceof EncapsulatedPacket) {
      this.addPacket(packet);
    } else {
      let packets = DataMessage.encapsulatePacket(packet, {
        sequenceNumber,
        messageIndex,
        maxPacketSize
      });

      packets.forEach( (packet) => {
        this.addPacket(packet);
      });
    }
  }

  addPacket(packet) {
    if (!packet.fragmented && this.packets.length > 0) {
      throw new Error('Cannot add more than one nonfragmented packet to DataMessage. Maybe you meant to use BatchMessage?');
    }

    super.addPacket(packet);
  }

  encode() {
    let packetBuffers = [ ];
    let data = new Buffer(0);

    this.packets.forEach( (ePacket) => {
      data = Buffer.concat([ data, ePacket.encode() ]);
    });

    let numPackets = Math.ceil(data.length / this.maxPacketSize);
    console.log(`Splitting into ${numPackets} packets`);

    let bufferStart, bufferEnd, bufferSize = (data.length / numPackets);

    for (let packetIndex = 0; packetIndex < numPackets; packetIndex++) {
      bufferStart = bufferSize * packetIndex;

      bufferEnd = bufferStart + bufferSize;
      if (bufferEnd >= data.length) {
        bufferEnd = data.length - 1;
      }

      packetBuffers[packetIndex] = data.slice(bufferStart, bufferEnd);
    }

    return packetBuffers;
  }

  getPackets(callback) {
    if (this.packets.length === 0) {
      return [ ];
    }

    if (typeof this.packets[0] === 'undefined') {
      throw new Error('Missing first packet/fragment');
    }

    let packetBuffer;

    // Fragmented packets are already inserted into message in order by
    // fragment index. No additional sorting is needed!
    let fragmented = this.packets[0].fragmented;
    let fragmentCount = this.packets[0].fragmentCount;

    if (fragmented) {
      if (this.packets.length !== fragmentCount) {
        throw new Error('Trying to reassemble split packets without all the fragments');
      }

      // Combine all the fragmented data into a single buffer
      packetBuffer = new Buffer(0);
      this.packets.forEach( (packet) => {
        packetBuffer = Buffer.concat([ packetBuffer, packet.data ]);
      });
    } else {
      // If it's not fragmented, we should only have one packet
      if (this.packets.length > 1) {
        throw new Error('More than one packet in message');
      }

      packetBuffer = this.packets[0].data;
    }

    // After reassembly, this packet could be single or a batch packet.
    // If it's a batch packet, this will return all decoded packets.
    Packet.fromBuffer(packetBuffer, (err, packets) => {
      if (err) return callback(err);

      if (!Array.isArray(packets)) {
        packets = [ packets ];
      }

      return callback(null, packets);
    });
  }

  static encapsulatePacket(packet, { sequenceNumber, messageIndex, maxPacketSize }) {
    let packetOptions = { };

    packetOptions.sequenceNumber = sequenceNumber;
    packetOptions.messageIndex = messageIndex;

    packetOptions.reliability = 3; // TODO

    packetOptions.fragmented = (packet.size() > maxPacketSize);

    // TODO
    packetOptions.ackNeeded = false;
    packetOptions.orderIndex = 0;
    packetOptions.orderChannel = 0;

    if (packetOptions.fragmented) {
      // TODO
      throw new Error('Fragmentation not yet implemented');
    }

    packetOptions.fragmentIndex = 0;
    packetOptions.fragmentCount = 0;
    packetOptions.fragmentID = 0;

    packetOptions.data = packet.data;

    let ePacket = new EncapsulatedPacket(packet.id, packetOptions);

    return [ ePacket ];
  }

}

export {
  InternalMessage as InternalMessage,
  DataMessage as DataMessage
};
