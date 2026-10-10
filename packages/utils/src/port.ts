import net from 'node:net';

/**
 * Checks if a specific port is currently available.
 * 
 * Performs a dual-check:
 * 1. Checks if another process is actively listening/responding on the port via TCP connection.
 * 2. Attempts binding to wildcard (0.0.0.0 / ::) and host to detect BSD socket collisions.
 */
export async function isPortAvailable(port: number, host = 'localhost'): Promise<boolean> {
  // 1. Connection check: if we can connect to 127.0.0.1:port, an active service is already running
  const canConnect = await new Promise<boolean>((resolve) => {
    const socket = net.createConnection({ port, host: '127.0.0.1' });
    socket.setTimeout(250);

    socket.once('connect', () => {
      socket.destroy();
      resolve(true); // Occupied!
    });

    socket.once('error', () => {
      resolve(false); // No listener
    });

    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });

  if (canConnect) {
    return false;
  }

  // 2. Wildcard bind check: prevents binding to ports where another app bound to wildcard
  const wildcardFree = await new Promise<boolean>((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    try {
      server.listen(port);
    } catch {
      resolve(false);
    }
  });

  if (!wildcardFree) {
    return false;
  }

  // 3. Specific host check if host is not localhost or 0.0.0.0
  if (host !== '0.0.0.0' && host !== 'localhost') {
    const hostFree = await new Promise<boolean>((resolve) => {
      const server = net.createServer();
      server.once('error', () => resolve(false));
      server.once('listening', () => {
        server.close(() => resolve(true));
      });
      try {
        server.listen(port, host);
      } catch {
        resolve(false);
      }
    });

    if (!hostFree) {
      return false;
    }
  }

  return true;
}

/**
 * Finds the first available port starting from `preferredPort`.
 * If `preferredPort` is in use, it will test preferredPort + 1, + 2, etc.
 * 
 * @param preferredPort The default port to try first
 * @param host Hostname/IP to check against (defaults to 'localhost')
 * @param excludePorts Set of ports already reserved by other internal servers
 * @param maxAttempts Maximum number of sequential ports to probe
 */
export async function findAvailablePort(
  preferredPort: number,
  host = 'localhost',
  excludePorts: number[] = [],
  maxAttempts = 50
): Promise<number> {
  for (let offset = 0; offset < maxAttempts; offset++) {
    const candidatePort = preferredPort + offset;

    if (excludePorts.includes(candidatePort)) {
      continue;
    }

    const available = await isPortAvailable(candidatePort, host);
    if (available) {
      return candidatePort;
    }
  }

  throw new Error(
    `No open port found starting from ${preferredPort} after ${maxAttempts} attempts on host ${host}`
  );
}
