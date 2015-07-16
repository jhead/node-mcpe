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

  constructor() {
    super(16, MAGIC_VALUE);
  }

  encode() {
    return new Buffer(this.value);
  }

  static decode(buffer) {
    let value = new Buffer(buffer.slice(0, 8));

    return new Magic(value);
  }

}

class Int64 extends DataType {

  constructor(value) {
    super(8, value);
  }

  encode() {
    let buffer = this.allocateBuffer();

    // Skip 2 bytes and write a 48-bit Integer.
    // We're going to pretend this is a 64-bit Integer, but it will always start with 0x00 0x00
    buffer.writeIntBE(this.value, 2, 6);

    return buffer;
  }

  static decode(buffer) {
    // Read 48-bit Integer, skipping first two bytes (we can't store those)
    let value = buffer.readIntBE(2, 6);

    return new Int64(value);
  }

}

class PEString extends DataType {

  constructor(value) {
    super(value.length + 2, value);
  }

  encode() {
    let buffer = this.allocateBuffer();
    let { value } = this;

    buffer.writeIntBE(value.length, 0, 2);
    buffer.write(value, 2, value.length, 'ascii');

    return buffer;
  }

  static decode(buffer) {
    let length = buffer.readIntBE(0, 2);
    let value = buffer.toString('ascii', 2, 2 + length);

    return new PEString(value);
  }

}

export default {
  Magic,
  Int64,
  String: PEString
};
