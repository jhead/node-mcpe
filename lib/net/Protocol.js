import DataTypes from './DataTypes';

let Protocol = {

  get: (id) => {
    let proto = Protocol[id];

    if (typeof proto === 'undefined' || proto === null) {
      proto = Protocol.UNSPECIFIED;
    }

    return proto;
  },

  UNSPECIFIED: { fields: { } },
  CONNECTED_PING: { },
  UNCONNECTED_PONG: { },
  OPEN_CONNECTION_REQUEST: { },
  OPEN_CONNECTION_REPLY: { },
  OPEN_CONNECTION_REQUEST_2: { },
  OPEN_CONNECTION_REPLY_2: { },
  CLIENT_CONNECT: { },
  SERVER_HANDSHAKE: { },
  CLIENT_HANDSHAKE: { },
  ACK: { }
};

function defineProtocol(protocol, protoDefinition) {
  for (let property in protoDefinition) {
    protocol[property] = protoDefinition[property];
  }

  Protocol[protoDefinition.id] = protocol;
}

defineProtocol(Protocol.CONNECTED_PING, {
  id: 0x01,
  reply: Protocol.UNCONNECTED_PONG,
  fields: {
    pingID: DataTypes.Long,
    magic: DataTypes.Magic
  }
});

defineProtocol(Protocol.UNCONNECTED_PONG, {
  id: 0x1C,
  fields: {
    pingID: DataTypes.Long,
    serverID: DataTypes.Long,
    magic: DataTypes.Magic,
    identifier: DataTypes.String
  }
});

defineProtocol(Protocol.OPEN_CONNECTION_REQUEST, {
  id: 0x05,
  reply: Protocol.OPEN_CONNECTION_REPLY,
  fields: {
    magic: DataTypes.Magic,
    protocolVersion: DataTypes.Byte,
    payload: DataTypes.NullPayload
  }
});

defineProtocol(Protocol.OPEN_CONNECTION_REPLY, {
  id: 0x06,
  fields: {
    magic: DataTypes.Magic,
    serverID: DataTypes.Long,
    useSecurity: DataTypes.Boolean,
    mtu: DataTypes.Short
  }
});

defineProtocol(Protocol.OPEN_CONNECTION_REQUEST_2, {
  id: 0x07,
  fields: {
    magic: DataTypes.Magic,
    serverAddress: DataTypes.Inet4Address,
    serverPort: DataTypes.UShort,
    mtu: DataTypes.Short,
    clientID: DataTypes.Long
  }
});

defineProtocol(Protocol.OPEN_CONNECTION_REPLY_2, {
  id: 0x08,
  fields: {
    magic: DataTypes.Magic,
    serverID: DataTypes.Long,
    clientAddress: DataTypes.Inet4Address,
    clientPort: DataTypes.UShort,
    mtu: DataTypes.UShort,
    useSecurity: DataTypes.Boolean
  }
});

defineProtocol(Protocol.CLIENT_CONNECT, {
  id: 0x09,
  fields: {
    clientID: DataTypes.Long,
    sessionID: DataTypes.Long,
    useSecurity: DataTypes.Boolean
  }
});

defineProtocol(Protocol.SERVER_HANDSHAKE, {
  id: 0x10,
  fields: {
    serverAddress: DataTypes.Inet4Address,
    useSecurity: DataTypes.Boolean,
    address1: DataTypes.Inet4Address,
    address2: DataTypes.Inet4Address,
    address3: DataTypes.Inet4Address,
    address4: DataTypes.Inet4Address,
    address5: DataTypes.Inet4Address,
    address6: DataTypes.Inet4Address,
    address7: DataTypes.Inet4Address,
    address8: DataTypes.Inet4Address,
    address9: DataTypes.Inet4Address,
    address10: DataTypes.Inet4Address,
    ping: DataTypes.Long,
    pong: DataTypes.Long
  }
});

defineProtocol(Protocol.CLIENT_HANDSHAKE, {
  id: 0x13,
  fields: {
    clientAddress: DataTypes.Inet4Address,
    address1: DataTypes.Inet4Address,
    address2: DataTypes.Inet4Address,
    address3: DataTypes.Inet4Address,
    address4: DataTypes.Inet4Address,
    address5: DataTypes.Inet4Address,
    address6: DataTypes.Inet4Address,
    address7: DataTypes.Inet4Address,
    address8: DataTypes.Inet4Address,
    address9: DataTypes.Inet4Address,
    address10: DataTypes.Inet4Address,
    ping: DataTypes.Long,
    pong: DataTypes.Long
  }
});

defineProtocol(Protocol.ACK, {
  id: 0xC0,
  fields: {
    payload: DataTypes.AckPayload
  }
});

export default Protocol;
