import Packet from './Packet';

const RELIABILITY_MASK = 0b11100000;
const FLAG_FRAGMENTED  = 0b00010000;
const FLAG_ACK_NEEDED  = 0b00001000;

class EncapsulatedPacket extends Packet {

  constructor(id = 0, { data = null, fields = { }, sequence = 0, reliability = 0, messageIndex = 0, ackNeeded = false, fragmented = false, fragmentIndex = 0, fragmentCount = 0, fragmentID = 0, orderIndex = 0, orderChannel = 0 } = { }) {
    super(id, data);

    this.fields = fields;
    this.encapsulated = true;

    this.sequence = sequence;
    this.reliability = reliability;
    this.ackNeeded = ackNeeded;
    
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

    let packetID = buffer.readInt8(0);
    offset += 1;

    packetOptions.sequence = buffer.readIntLE(offset, 3);
    offset += 3;

    let flags = buffer.readInt8(offset);
    offset += 1;

    packetOptions.reliability =  (flags & RELIABILITY_MASK) >> 5;
    packetOptions.fragmented  = ((flags & FLAG_FRAGMENTED)  >> 4) === 1;
    packetOptions.ackNeeded   = ((flags & FLAG_ACK_NEEDED)  >> 3) === 1;

    let innerDataLength = buffer.readInt16BE(offset) / 8;
    offset += 2;

    if (packetOptions.reliability >= 2 && packetOptions.reliability !== 5) {
      packetOptions.messageIndex = buffer.readIntLE(offset, 3);
      offset += 3;
    }

    if (packetOptions.reliability <= 4 && packetOptions.reliability !== 2) {
      packetOptions.orderIndex = buffer.readIntLE(offset, 3);
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
    packetOptions.data = innerData;

    if (!packetOptions.fragmented) {
      packetID = innerData[0];
    } else if (packetOptions.fragmented && packetOptions.fragmentIndex === 0) {
      packetID = innerData[0];
    }

    return new EncapsulatedPacket(packetID, packetOptions);
  }

}

export default EncapsulatedPacket;
