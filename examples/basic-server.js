import { Server as PEServer } from '../index';
import Packet from '../lib/net/Packet';
import Protocol from '../lib/net/Protocol';

let server = new PEServer();

server.on('listen', () => {
  console.log('Listening on ' + server.localAddress + ':' + server.localPort);
});

// An example of a precondition for validating packets before processing them.
// Preconditions are completely optional and run prior to the handler function.
//
// This one should always return true.
function arbitraryPrecondition(packet, rinfo) {
  return (packet.fields.pingID > 0);
}

server.addPacketHandler(Protocol.CONNECTED_PING, arbitraryPrecondition, (packet, rinfo, next) => {
  let reply = Packet.create(Protocol.UNCONNECTED_PONG, {
    pingID: packet.fields.pingID,
    serverID: 0,
    magic: null,
    identifier: 'MCPE;Test Server;45 45;0.14.0;0;20'
  });

  server.sendMessageTo(reply, rinfo);

  next();
});

server.listen();
