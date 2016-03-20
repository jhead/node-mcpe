import { Client as PEClient } from '../index';
import Packet from '../lib/net/Packet';
import { DataMessage } from '../lib/net/Message';
import Protocol from '../lib/net/Protocol';
import GameState from '../lib/GameState';

class BasicClient extends PEClient {

  constructor(address, port) {
    super(address, port);

    this.id = 123456789;
    this.sessionID = 12121212;
    this.gameState = GameState.INIT;

    this.on('packet', (packet, rinfo) => {
      console.log(`Got packet with ID ${packet.id}`);
    });

    this.on('unhandledPacket', (packet, rinfo) => {
      console.log(packet, packet.size());
    });

    this.bindPacketHandlers();
  }

  connect() {
    // Begin login process
    this.sendMessage(Packet.create(Protocol.OPEN_CONNECTION_REQUEST, {
      magic: null,
      protocolVersion: 5,
      payload: this.mtu
    }));
  }

  bindPacketHandlers() {

    this.addPacketHandler(Protocol.ACK, (packet) => {
      console.log('Got ACK');
    });

    // Login - stage 2
    this.addPacketHandler(Protocol.OPEN_CONNECTION_REPLY, (packet) => {
      this.sendMessage(Packet.create(Protocol.OPEN_CONNECTION_REQUEST_2, {
        magic: null,
        serverAddress: [ 127, 0, 0, 1 ],
        serverPort: this.remotePort,
        mtu: packet.fields.mtu,
        clientID: this.id
      }));
    });

    // Login - stage 3
    this.addPacketHandler(Protocol.OPEN_CONNECTION_REPLY_2, (packet) => {
      this.localPort = packet.clientPort;

      this.sendMessage(new DataMessage(Packet.create(Protocol.CLIENT_CONNECT, {
        clientID: this.id,
        sessionID: this.sessionID,
        useSecurity: false
      }), this.nextSequence++, this.nextMessage++, this.mtu));
    });

    // Login - stage 4
    this.addPacketHandler(Protocol.SERVER_HANDSHAKE, (packet) => {
      console.log(packet.fields);
      this.sendMessage(new DataMessage(Packet.create(Protocol.CLIENT_HANDSHAKE, {
        serverAddress: this.remoteAddress.split('.'),
        serverPort: this.remotePort,
        address1: [ 0x3f, 0x57, 0xfe, 0xfd ],
        port1: 0,
        address2: [ 255, 255, 255, 255 ],
        port2: 0,
        address3: [ 255, 255, 255, 255 ],
        port3: 0,
        address4: [ 255, 255, 255, 255 ],
        port4: 0,
        address5: [ 255, 255, 255, 255 ],
        port5: 0,
        address6: [ 255, 255, 255, 255 ],
        port6: 0,
        address7: [ 255, 255, 255, 255 ],
        port7: 0,
        address8: [ 255, 255, 255, 255 ],
        port8: 0,
        address9: [ 255, 255, 255, 255 ],
        port9: 0,
        address10: [ 255, 255, 255, 255 ],
        port10: 0,
        ping: packet.fields.ping,
        pong: packet.fields.pong
      }), this.nextSequence++, this.nextMessage++, this.mtu));;
    });

    this.addPacketHandler(Protocol.DISCONNECT, (packet) => {
      console.log('Disconnected from server');

      this.close();
      process.exit(0);
    });
  }
}

///

let args = process.argv.slice(2);

if (args.length < 1) {
  console.log('Usage: node basic-client.js <address> [port]');
  process.exit(1);
} else if (args.length === 1) {
  args[1] = 19132;
}

let [ address, port ] = args;

new BasicClient(address, port).connect();
