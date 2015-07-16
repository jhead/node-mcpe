import DataTypes from './DataTypes';

let Protocol = {
  CONNECTED_PING: { },
  UNCONNECTED_PONG: { }
};

function defineProtocol(proto, obj) {
  for (let prop in obj) {
    proto[prop] = obj[prop];
  }
}

defineProtocol(Protocol.CONNECTED_PING, {
  id: 0x01,
  reply: Protocol.UNCONNECTED_PONG,
  fields: {
    pingID: DataTypes.Int64,
    magic: DataTypes.Magic
  }
});

defineProtocol(Protocol.UNCONNECTED_PONG, {
  id: 0x1C,
  fields: {
    pingID: DataTypes.Int64,
    serverID: DataTypes.Int64,
    magic: DataTypes.Magic,
    identifier: DataTypes.String
  }
});

// Inject packet IDs as keys to allow for bidirectional lookup
Object.keys(Protocol).forEach(function (key) {
  let value = Protocol[key];
  Protocol[value.id] = value;
});

export default Protocol;
