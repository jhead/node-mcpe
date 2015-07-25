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

  getUnderlyingPackets() {
    // TODO: support batch packets

    return [ Packet.decode(this.data) ];
  }

  encode() {
    let headerBuffer = new Buffer(25);
    let headerOffset = 0;

    headerBuffer.fill(0);

    headerBuffer.writeUInt8(0x84, headerOffset);
    headerOffset += 1;

    headerBuffer.writeIntLE(this.sequence, headerOffset, 3);
    headerOffset += 3;

    let flags = this.reliability << 5;
    flags |= (0b00010000 & ((this.fragmented ? 1 : 0) << 4));
    // ...
    // TODO

    headerBuffer.writeInt8(flags, headerOffset);
    headerOffset += 1;

    headerBuffer.writeInt16BE(this.data.length * 8, headerOffset);
    headerOffset += 2;

    if (this.reliability >= 2 && this.reliability !== 5) {
      headerBuffer.writeIntLE(this.messageIndex, headerOffset, 3);
      headerOffset += 3;
    }

    if (this.reliability <= 4 && this.reliability !== 2) {
      headerBuffer.writeIntLE(this.orderIndex, headerOffset, 3);
      headerOffset += 3;

      headerBuffer.writeInt8(this.orderChannel, headerOffset);
      headerOffset += 1;
    }

    if (this.fragmented) {
      headerBuffer.writeInt32BE(this.fragmentCount, headerOffset);
      headerOffset += 4;

      headerBuffer.writeInt16BE(this.fragmentID, headerOffset);
      headerOffset += 2;

      headerBuffer.writeInt32BE(this.fragmentIndex, headerOffset);
      headerOffset += 4;
    }

    headerBuffer = headerBuffer.slice(0, headerOffset);

    let finalBuffer = Buffer.concat([ headerBuffer, this.data ]);
    return finalBuffer;
  }

  static fromBuffer(buffer, callback) {
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

    if (packetOptions.reliability > 0 && packetOptions.reliability <= 4 && packetOptions.reliability !== 2) {
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

    callback(null, new EncapsulatedPacket(packetID, packetOptions));
  }

}

export default EncapsulatedPacket;
