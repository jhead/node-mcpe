const MAGIC_VALUE = [ 0x00, 0xff, 0xff, 0x00, 0xfe, 0xfe, 0xfe, 0xfe, 0xfd, 0xfd, 0xfd, 0xfd, 0x12, 0x34, 0x56, 0x78 ];

class DataType {

  constructor(size = 0, value) {
    this.size = size;
    this.value = value;
  }

  allocateBuffer() {
    let buffer = new Buffer(this.size);
    buffer.fill(0);

    return buffer;
  }

}

class Magic extends DataType {

  constructor(value = MAGIC_VALUE) {
    if (value === null) {
      value = MAGIC_VALUE;
    }

    super(16, value);
  }

  encode() {
    return new Buffer(this.value);
  }

  static decode(buffer) {
    let value = new Buffer(buffer.slice(0, 16));

    return new Magic(value);
  }

}

class Byte extends DataType {

  constructor(value) {
    super(1, value);
  }

  encode() {
    let buffer = this.allocateBuffer();

    buffer.writeInt8(this.value, 0);

    return buffer;
  }

  static decode(buffer) {
    let value = buffer.readInt8(0);

    return new Byte(value);
  }

}

class PEBoolean extends DataType {

  constructor (value) {
    super(1, value);
  }

  encode() {
    let buffer = this.allocateBuffer();

    buffer.writeInt8(this.value ? 1 : 0, 0);

    return buffer;
  }

  static decode(buffer) {
    let value = (buffer.readInt8(0) === 1);

    return new PEBoolean(value);
  }

}

class Short extends DataType {

  constructor(value, signed = true) {
    super(2, value);

    this.signed = signed;
  }

  encode() {
    let buffer = this.allocateBuffer();
    let { value, signed } = this;

    if (signed) {
      buffer.writeInt16BE(value, 0);
    } else {
      buffer.writeUInt16BE(value, 0);
    }

    return buffer;
  }

  static decode(buffer, signed = true) {
    let value;

    if (signed) {
      value = buffer.readInt16BE(0);
    } else {
      value = buffer.readUInt16BE(0);
    }

    return new Short(value, signed);
  }

}

class UShort extends Short {

  constructor(value) {
    super(value, false);
  }

  static decode(buffer) {
    return Short.decode(buffer, false);
  }

}

class Integer extends DataType {

  constructor(value) {
    super(4, value);
  }

  encode() {
    let buffer = this.allocateBuffer();

    buffer.writeInt32BE(this.value, 0);

    return buffer;
  }

  static decode(buffer) {
    let value = buffer.readInt32BE(0);

    return new Integer(value);
  }

}

class Long extends DataType {

  constructor(value) {
    super(8, value);
  }

  encode() {
    let buffer = this.allocateBuffer();

    // Skip 2 bytes and write a 48-bit Integer.
    // We're going to pretend this is a 64-bit Integer, but it will always start with 0x00 0x00
    buffer.writeUIntBE(this.value, 2, 6);

    return buffer;
  }

  static decode(buffer) {
    // Read 48-bit Integer, skipping first two bytes (we can't store those)
    let value = buffer.readUIntBE(2, 6);

    return new Long(value);
  }

}

class PEString extends DataType {

  constructor(value) {
    super(value.length + 2, value);
  }

  encode() {
    let buffer = this.allocateBuffer();
    let { value } = this;

    buffer.writeUInt16BE(value.length, 0);
    buffer.write(value, 2, value.length, 'ascii');

    return buffer;
  }

  static decode(buffer) {
    let length = buffer.readUInt16BE(0);
    let value = buffer.toString('ascii', 2, 2 + length);

    return new PEString(value);
  }

}

class NullPayload extends DataType {

  constructor(size) {
    let buffer = new Buffer(Array(size));

    super(size, buffer);
  }

  encode() {
    return new Buffer(Array(this.size));
  }

  static decode(buffer) {
    return new NullPayload(buffer.length);
  }

}

class Inet4Address extends DataType {

  constructor(value) {
    super(5, value);
  }

  encode() {
    let buffer = this.allocateBuffer();

    buffer.writeInt8(4, 0);

    this.value.forEach( (part, index) => {
      buffer.writeInt8(part, index + 1);
    });

    return buffer;
  }

  static decode(buffer) {
    let parts = [ ];

    // IP version
    buffer.readInt8(0);

    // 32-bit IP address (bits inverted)
    parts[0] = ~buffer.readInt8(1);
    parts[1] = ~buffer.readInt8(2);
    parts[2] = ~buffer.readInt8(3);
    parts[3] = ~buffer.readInt8(4);

    return new Inet4Address(parts);
  }

}

class AckPayload extends DataType {

  constructor(sequences, byteLength) {
    sequences.sort( (a, b) => {
      return a - b;
    });

    if (typeof byteLength === 'undefined') {
      byteLength = AckPayload.calculateByteLength(sequences);
    }

    super(byteLength, sequences);
  }

  encode() {
    let sequences = this.value;
    let buffer;

    if (sequences.length === 1) {
      buffer = new Buffer(6);

      buffer.writeInt16BE(sequences.length, 0);
      buffer.writeInt8(0x01, 2);
      buffer.writeIntLE(sequences[0], 3, 3);

      return buffer;
    }

    throw new Error('ACK encoding for multiple packets not yet implemented');
  }

  static decode(buffer) {
    let offset = 0;
    let sequences = [ ];

    let count = buffer.readInt16BE(offset);
    offset += 2;

    while (count-- > 0) {

      let flag = buffer.readInt8(offset);
      offset += 1;

      if (flag === 0) {
        let start = buffer.readIntLE(offset, 3);
        offset += 3;

        let end = buffer.readIntLE(offset, 3);
        offset += 3;

        for (let i = start; i < end; i++) {
          sequences.push(i);
        }
      } else {
        sequences.push(buffer.readIntLE(offset, 3));
        offset += 3;
      }
    }

    return new AckPayload(sequences, offset);
  }

  static calculateByteLength(sequences) {
    if (sequences.length === 1) {
      return 6;
    }

    let length = 2;

    let pointer = 1;
    let start = sequences[0], last = start;

    while (pointer < sequences.length) {
      let current = sequences[pointer];
      let diff = current - last;

      if (diff === 1) {
        last = current;
      } else if (diff > 1) {
        if (start === last) {
          length += 4;
        } else {
          length += 7;
          start = last = current;
        }
      }
    }

    return length;
  }

}

export default {
  Magic,
  Boolean: PEBoolean,
  Byte,
  Short,
  UShort,
  Integer,
  Long,
  String: PEString,
  NullPayload,
  Inet4Address,
  AckPayload
};
