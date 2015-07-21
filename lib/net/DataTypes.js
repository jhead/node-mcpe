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
    let buffer = new Buffer(size);
    buffer.fill(0);

    super(size, buffer);
  }

  encode() {
    return new Buffer(this.value);
  }

  static decode(buffer) {
    return new NullPayload(buffer.length);
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
  NullPayload
};
