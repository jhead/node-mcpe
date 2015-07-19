import Protocol from './Protocol';

class Packet {

  constructor(id = 0, data) {
    this.id = id;

    this._id = id.toString(16);
    this._id = '0x' + (id < 16 ? '0' : '') + this._id;

    if (Buffer.isBuffer(data)) {
      this.data = new Buffer(data);
    } else {
      this.data = null;
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
    let buffer = new Buffer([ this.id ]);

    buffer = Buffer.concat([ buffer, this.data ]);

    return buffer;
  }

  static encodeFields(proto, fields) {
    let data = new Buffer(0);

    for (let fieldName in fields) {
      let dataType = proto.fields[fieldName];
      let fieldValue = fields[fieldName];

      let fieldData = new (dataType)(fieldValue);
      let encodedValue = fieldData.encode();

      data = Buffer.concat([ data, encodedValue ]);
    }

    return data;
  }

  static create(proto, fields) {
    let packet = new Packet(proto.id);
    let data = Packet.encodeFields(proto, fields);

    packet.fields = fields;
    packet.data = data;

    return packet;
  }

  static decode(data) {
    let id = data[0];
    data = data.slice(1);

    let packet = new Packet(id, data);

    let fieldNames = Object.keys(packet.protocol.fields);
    fieldNames.forEach( (fieldName) => {
      let dataType = packet.protocol.fields[fieldName];
      let result = dataType.decode(data);

      data = data.slice(result.size);

      packet.fields[fieldName] = result.value;
    });

    return packet;
  }

}

export default Packet;
