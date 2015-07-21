class Message {

  constructor(id, type) {
    this.id = id;
    this.type = type;

    this.packets = [ ];
  }

  addPacket(packet) {
    this.packets[packet.fragmentIndex] = packet;

    if (packet.fragmentIndex === 0) {
      this.id = packet.id;
    }
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

  decode() {
    this.fields = this.packet.fields;
  }

  encode() {
    return [ this.packet.encode() ];
  }

}

class MultiPacketMessage extends Message {

  constructor(id) {
    super(id, 'MultiPacketMessage');
  }

  encode() {
    throw new Error('MultiPacketMessage encoding not yet implemented');
  }

  decode() {
    throw new Error('MultiPacketMessage decoding not yet implemented');
  }

}

export default {
  SinglePacketMessage,
  MultiPacketMessage
};
