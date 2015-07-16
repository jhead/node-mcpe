import { Server as PEServer } from '../index';
import Packet from '../lib/net/Packet';
import Protocol from '../lib/net/Protocol';

let server = new PEServer();

server.on('listen', () => {
  console.log('Listening on ' + server.localAddress + ':' + server.localPort);
});

server.on('packet', (packet, rinfo) => {

  if (packet.is(Protocol.CONNECTED_PING)) {
    let reply = Packet.create(Protocol.UNCONNECTED_PONG, {
      pingID: packet.fields.pingID,
      serverID: 0,
      magic: null,
      identifier: 'MCPE;Test Server;2 7;0.11.1;0;20'
    });

    server.sendMessage(reply, rinfo);
  }

});

server.listen();
