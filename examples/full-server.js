import { Server as PEServer } from '../index';
import Packet from '../lib/net/Packet';
import Protocol from '../lib/net/Protocol';

let server = new PEServer();

server.on('listen', () => {
  console.log('Listening on ' + server.localAddress + ':' + server.localPort);
});

server.addPacketHandler(Protocol.CONNECTED_PING, (packet, rinfo, next) => {
  let reply = Packet.create(Protocol.UNCONNECTED_PONG, {
    pingID: packet.fields.pingID,
    serverID: 0,
    magic: null,
    identifier: 'MCPE;Test Server;45 45;0.14.0;0;20'
  });

  server.sendMessageTo(reply, rinfo);

  next();
});

server.addPacketHandler(Protocol.OPEN_CONNECTION_REQUEST, (packet, rinfo, next) => {
  let reply = Packet.create(Protocol.OPEN_CONNECTION_REPLY, {
    magic: null,
    serverID: 0,
    useSecurity: false,
    mtu: packet.fields.payload.length
  });

  server.sendMessageTo(reply, rinfo);

  next();
});

server.addPacketHandler(Protocol.OPEN_CONNECTION_REQUEST_2, (packet, rinfo, next) => {
  let reply = Packet.create(Protocol.OPEN_CONNECTION_REPLY_2, {
    magic: null,
    serverID: 0,
    clientPort: rinfo.port,
    mtu: packet.fields.mtu,
    useSecurity: false
  });

  server.sendMessageTo(reply, rinfo);

  next();
});

server.on('packet', (packet, rinfo) => {
  console.log(packet);
});

server.listen();
