import Protocol from './Protocol';

class Packet {

  constructor(id = 0, data) {
    this.id = id;

    this._id = id.toString(16);
    this._id = '0x' + (id < 16 ? '0' : '') + this._id;

    if (Buffer.isBuffer(data)) {
      this.data = new Buffer(data);
    } else {
      this.data = new Buffer(0);
    }

    this.fields = { };
    this.protocol = Protocol.get(id);
  }

  is(proto) {
    return (Protocol.get(this.id) === proto);
  }

  size() {
    return (this.data !== null ? this.data.length : 0) + 1;
  }

  encode() {
    return new Buffer(this.data);
  }

  static create(proto, fields) {
    let data = new Buffer(1);

    data.writeUInt8(proto.id);
    data = Buffer.concat([ data, Protocol.encodeFields(proto, fields) ]);

    let packet = new Packet(proto.id, data);
    packet.fields = fields;

    return packet;
  }

  static fromBuffer(buffer, callback) {
    let isBatchPacket = (buffer[0] === Protocol.BATCH.id);

    if (isBatchPacket) {
      Packet.batchPacketFromBuffer(buffer, callback);
    }

    Packet.singlePacketFromBuffer(buffer, callback);
  }

  static batchPacketFromBuffer(buffer, callback) {
    let packets = [ ];

    console.log('Got batch packet');
    //

    callback(null, packets);
  }

  static singlePacketFromBuffer(buffer, callback) {
    let id = buffer[0];
    buffer = buffer.slice(1);

    let packet = new Packet(id, buffer);
    let fieldNames = Object.keys(packet.protocol.fields);

    fieldNames.forEach( (fieldName) => {
      let dataType = packet.protocol.fields[fieldName];
      let result = dataType.decode(buffer);

      buffer = buffer.slice(result.size);

      packet.fields[fieldName] = result.value;
    });

    callback(null, packet);
  }

}

export default Packet;
