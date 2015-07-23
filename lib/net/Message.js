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

  getPackets() {
    return this.packets;
  }

  /*
  encode(mtu) {
    let data = this.getEncodedPackets();
    let numPackets = Math.ceil(data.length / mtu);
    let buffers = [];
    let bufferStart, bufferEnd, bufferSize = (data.length / numPackets);

    for (let packetIndex = 0; packetIndex < numPackets; packetIndex++) {
      bufferStart = bufferSize * packetIndex;

      bufferEnd = bufferStart + bufferSize;
      if (bufferEnd >= data.length) {
        bufferEnd = data.length - 1;
      }

      buffers[packetIndex] = data.slice(bufferStart, bufferEnd);
    }

    return buffers;
  }
  */

}

class SinglePacketMessage extends Message {

  constructor(packet) {
    super(packet.id, 'SinglePacketMessage');

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

  encode() {
    let packetBuffers = [ ];

    this.packets.forEach( (ePacket) => {
      packetBuffers.push(ePacket.encode());
    });

    return packetBuffers;
  }

  getPackets() {
    if (this.packets.length === 0) {
      return [ ];
    }

    // Fragmented packets are already inserted into message in order by
    // fragment index. No additional sorting is needed!
    let fragmented = this.packets[0].fragmented;
    let fragmentCount = this.packets[0].fragmentCount;

    if (fragmented) {
      if (this.packets.length !== fragmentCount) {
        throw new Error('Trying to reassemble split packets without all the fragments');
      }

      let fullPacketBuffer = new Buffer(0);
      this.packets.forEach( (packet) => {
        fullPacketBuffer = Buffer.concat([ fullPacketBuffer, packet.data ]);
      });

      let reassembledPacket = Packet.decode(fullPacketBuffer);

      return [ reassembledPacket ];
    }

    let packets = [ ];

    this.packets.forEach( (packet) => {
      packets = packets.concat(packet.getUnderlyingPackets());
    });

    return packets;
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

export default {
  SinglePacketMessage,
  DataMessage
};
