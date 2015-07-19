import Packet from './Packet';

class EncapsulatedPacket extends Packet {

  constructor(id = 0, { data = null, fields = { }, sequence = 0, reliability = 0, messageIndex = 0, fragmented = false, fragmentIndex = 0, fragmentCount = 0, fragmentID = 0, orderIndex = 0, orderChannel = 0 } = { }) {
    super(id, data);

    this.fields = fields;
    this.encapsulated = true;

    this.sequence = sequence;
    this.reliability = reliability;
    this.messageIndex = messageIndex;

    this.fragmented = fragmented;
    this.fragmentIndex = fragmentIndex;
    this.fragmentCount = fragmentCount;
    this.fragmentID = fragmentID;

    this.orderIndex = orderIndex;
    this.orderChannel = orderChannel;
  }

  static decode(buffer) {
    let packetOptions = { };
    let offset = 0;

    buffer = buffer.slice(1);

    packetOptions.sequence = buffer.readIntLE(offset, 3);
    offset += 3;

    let flags = buffer.readInt8(offset);
    offset += 1;

    packetOptions.reliability = (flags & 0b11100000) >> 5;
    packetOptions.fragmented = ((flags & 0b00010000) > 0) === 1;

    let innerDataLength = buffer.readInt16BE(offset) / 8;
    offset += 2;

    if ([ 2, 3, 4, 6, 7 ].indexOf(packetOptions.reliability) >= 0) {
      packetOptions.fragmentIndex = buffer.readIntBE(offset, 3);
      offset += 3;
    }

    if ([ 1, 3, 4, 7 ].indexOf(packetOptions.reliability) >= 0) {
      packetOptions.orderIndex = buffer.readIntBE(offset, 3);
      offset += 3;

      packetOptions.orderChannel = buffer.readInt8(offset);
      offset += 1;
    }

    if (packetOptions.fragmented) {
      packetOptions.fragmentCount = buffer.readInt32BE(offset);
      offset += 4;

      packetOptions.fragmentID = buffer.readInt16BE(offset);
      offset += 2;

      packetOptions.fragmentIndex = buffer.readInt32BE(offset);
      offset += 4;
    }

    let innerData = buffer.slice(offset, offset + innerDataLength);
    let innerPacket = Packet.decode(innerData);

    packetOptions.data = innerPacket.data;
    packetOptions.fields = innerPacket.fields;

    return new EncapsulatedPacket(innerPacket.id, packetOptions);
  }

}

export default EncapsulatedPacket;
