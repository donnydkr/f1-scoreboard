import dgram from "node:dgram";

const DEFAULT_HOST = process.env.TELEMETRY_TEST_HOST || "127.0.0.1";
const DEFAULT_PORTS = (process.env.TELEMETRY_TEST_PORTS || "20777,20778")
  .split(",")
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isInteger(value) && value > 0);
const WAIT_MS = 120;
const PARTICIPANT_ENTRY_SIZE = 60;
const LAP_DATA_ENTRY_SIZE = 57;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv) {
  const options = {
    host: DEFAULT_HOST,
    ports: DEFAULT_PORTS.length > 0 ? DEFAULT_PORTS : [20777, 20778],
    consoles: 2,
    laps: 3
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--host" && argv[index + 1]) {
      options.host = argv[index + 1];
      index += 1;
    } else if (value === "--port" && argv[index + 1]) {
      options.ports = [Number(argv[index + 1])];
      index += 1;
    } else if (value === "--ports" && argv[index + 1]) {
      options.ports = argv[index + 1]
        .split(",")
        .map((part) => Number(part.trim()))
        .filter((part) => Number.isInteger(part) && part > 0);
      index += 1;
    } else if (value === "--consoles" && argv[index + 1]) {
      options.consoles = Math.max(1, Math.min(2, Number(argv[index + 1]) || 1));
      index += 1;
    } else if (value === "--laps" && argv[index + 1]) {
      options.laps = Math.max(1, Number(argv[index + 1]) || 1);
      index += 1;
    }
  }

  return options;
}

function writeHeader(buffer, { packetId, packetVersion = 1, sessionUid, sessionTime, frameIdentifier, playerCarIndex }) {
  buffer.writeUInt16LE(2024, 0);
  buffer.writeUInt8(24, 2);
  buffer.writeUInt8(1, 3);
  buffer.writeUInt8(0, 4);
  buffer.writeUInt8(packetVersion, 5);
  buffer.writeUInt8(packetId, 6);
  buffer.writeBigUInt64LE(BigInt(sessionUid), 7);
  buffer.writeFloatLE(sessionTime, 15);
  buffer.writeUInt32LE(frameIdentifier, 19);
  buffer.writeUInt32LE(frameIdentifier, 23);
  buffer.writeUInt8(playerCarIndex, 27);
  buffer.writeUInt8(255, 28);
}

function createSessionPacket(consoleState, frameIdentifier) {
  const buffer = Buffer.alloc(29 + 9);
  writeHeader(buffer, {
    packetId: 1,
    sessionUid: consoleState.sessionUid,
    sessionTime: consoleState.sessionTime,
    frameIdentifier,
    playerCarIndex: consoleState.playerCarIndex
  });

  buffer.writeUInt8(0, 29);
  buffer.writeInt8(32, 30);
  buffer.writeInt8(23, 31);
  buffer.writeUInt8(15, 32);
  buffer.writeUInt16LE(5412, 33);
  buffer.writeUInt8(18, 35);
  buffer.writeInt8(consoleState.trackId, 36);

  return buffer;
}

function createParticipantsPacket(consoleState, frameIdentifier) {
  const buffer = Buffer.alloc(30 + 22 * PARTICIPANT_ENTRY_SIZE);
  writeHeader(buffer, {
    packetId: 4,
    sessionUid: consoleState.sessionUid,
    sessionTime: consoleState.sessionTime,
    frameIdentifier,
    playerCarIndex: consoleState.playerCarIndex
  });

  buffer.writeUInt8(1, 29);

  const offset = 30 + consoleState.playerCarIndex * PARTICIPANT_ENTRY_SIZE;
  buffer.writeUInt8(0, offset);
  buffer.writeUInt8(255, offset + 1);
  buffer.writeUInt8(consoleState.networkId, offset + 2);
  buffer.writeUInt8(0, offset + 3);
  buffer.writeUInt8(0, offset + 4);
  buffer.writeUInt8(consoleState.carNumber, offset + 5);
  buffer.writeUInt8(34, offset + 6);
  Buffer.from(consoleState.driverName, "utf8").copy(buffer, offset + 7, 0, 48);
  buffer.writeUInt8(1, offset + 55);
  buffer.writeUInt8(1, offset + 56);
  buffer.writeUInt16LE(0, offset + 57);
  buffer.writeUInt8(3, offset + 59);

  return buffer;
}

function createLapDataPacket(consoleState, frameIdentifier, lapIndex) {
  const buffer = Buffer.alloc(29 + 22 * LAP_DATA_ENTRY_SIZE);
  writeHeader(buffer, {
    packetId: 2,
    sessionUid: consoleState.sessionUid,
    sessionTime: consoleState.sessionTime,
    frameIdentifier,
    playerCarIndex: consoleState.playerCarIndex
  });

  const offset = 29 + consoleState.playerCarIndex * LAP_DATA_ENTRY_SIZE;
  const lapTimeMs = consoleState.baseLapMs - lapIndex * 245 + consoleState.playerCarIndex * 80;
  const currentLapNum = lapIndex + 1;

  buffer.writeUInt32LE(lapTimeMs, offset);
  buffer.writeUInt32LE(18234, offset + 4);
  buffer.writeFloatLE(5412.5, offset + 20);
  buffer.writeFloatLE(5412.5 * currentLapNum, offset + 24);
  buffer.writeFloatLE(0, offset + 28);
  buffer.writeUInt8(consoleState.position, offset + 32);
  buffer.writeUInt8(currentLapNum, offset + 33);
  buffer.writeUInt8(0, offset + 34);
  buffer.writeUInt8(0, offset + 35);
  buffer.writeUInt8(2, offset + 36);
  buffer.writeUInt8(0, offset + 37);
  buffer.writeUInt8(0, offset + 38);
  buffer.writeUInt8(0, offset + 39);
  buffer.writeUInt8(0, offset + 40);
  buffer.writeUInt8(0, offset + 41);
  buffer.writeUInt8(0, offset + 42);
  buffer.writeUInt8(consoleState.position, offset + 43);
  buffer.writeUInt8(1, offset + 44);
  buffer.writeUInt8(2, offset + 45);
  buffer.writeUInt8(0, offset + 46);
  buffer.writeUInt16LE(0, offset + 47);
  buffer.writeUInt16LE(0, offset + 49);
  buffer.writeUInt8(0, offset + 51);
  buffer.writeFloatLE(318.4, offset + 52);
  buffer.writeUInt8(currentLapNum, offset + 56);

  return buffer;
}

async function sendPacket(socket, packet, host, port) {
  await new Promise((resolve, reject) => {
    socket.send(packet, port, host, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  const targetPorts = options.ports.length > 0 ? options.ports : [20777, 20778];
  const consoles = [
    {
      label: "PS1",
      driverName: "Virtual PS1 Driver",
      sessionUid: 9100001n,
      playerCarIndex: 0,
      networkId: 11,
      carNumber: 11,
      trackId: 26,
      baseLapMs: 76234,
      position: 1,
      sessionTime: 0,
      targetPort: targetPorts[0] || targetPorts[targetPorts.length - 1]
    },
    {
      label: "PS2",
      driverName: "Virtual PS2 Driver",
      sessionUid: 9100002n,
      playerCarIndex: 1,
      networkId: 22,
      carNumber: 22,
      trackId: 7,
      baseLapMs: 77520,
      position: 2,
      sessionTime: 0,
      targetPort: targetPorts[1] || targetPorts[targetPorts.length - 1]
    }
  ].slice(0, options.consoles);

  const sockets = await Promise.all(
    consoles.map(
      () =>
        new Promise((resolve, reject) => {
          const socket = dgram.createSocket("udp4");
          socket.bind(0, "127.0.0.1", (error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve(socket);
          });
        })
    )
  );

  try {
    let frameIdentifier = 1;

    for (let index = 0; index < consoles.length; index += 1) {
      const consoleState = consoles[index];
      const socket = sockets[index];

      await sendPacket(socket, createParticipantsPacket(consoleState, frameIdentifier), options.host, consoleState.targetPort);
      consoleState.sessionTime += 0.5;
      frameIdentifier += 1;
      await sleep(WAIT_MS);

      await sendPacket(socket, createSessionPacket(consoleState, frameIdentifier), options.host, consoleState.targetPort);
      consoleState.sessionTime += 0.5;
      frameIdentifier += 1;
      await sleep(WAIT_MS);
    }

    for (let lapIndex = 1; lapIndex <= options.laps; lapIndex += 1) {
      for (let index = 0; index < consoles.length; index += 1) {
        const consoleState = consoles[index];
        const socket = sockets[index];

        await sendPacket(
          socket,
          createLapDataPacket(consoleState, frameIdentifier, lapIndex),
          options.host,
          consoleState.targetPort
        );

        consoleState.sessionTime += 1.25;
        frameIdentifier += 1;
        await sleep(WAIT_MS);
      }
    }

    console.log(
      `Sent telemetry test packets to ${consoles.map((consoleState) => `udp://${options.host}:${consoleState.targetPort}`).join(" and ")} for ${consoles.length} virtual console(s).`
    );
  } finally {
    await Promise.all(
      sockets.map(
        (socket) =>
          new Promise((resolve) => {
            socket.close(() => resolve());
          })
      )
    );
  }
}

run().catch((error) => {
  console.error("Telemetry test sender failed:", error);
  process.exitCode = 1;
});
