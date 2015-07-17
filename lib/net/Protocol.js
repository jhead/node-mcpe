import DataTypes from './DataTypes';

let Protocol = {

  get: (id) => {
    let proto = Protocol[id];

    if (typeof proto === 'undefined' || proto === null) {
      proto = Protocol.UNSPECIFIED;
    }

    return proto;
  },

  UNSPECIFIED: { },
  CONNECTED_PING: { },
  UNCONNECTED_PONG: { },
  OPEN_CONNECTION_REQUEST: { },
  OPEN_CONNECTION_REPLY: { },
  OPEN_CONNECTION_REQUEST_2: { },
  OPEN_CONNECTION_REPLY_2: { },
  CLIENT_CONNECT: { }
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
    useSecurity: DataTypes.Boolean,
    cookie: DataTypes.Integer,
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
    clientPort: DataTypes.UShort,
    mtu: DataTypes.Short,
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

export default Protocol;
