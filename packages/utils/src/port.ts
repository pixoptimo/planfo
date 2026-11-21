import net from 'node:net';

function canConnectTo(port: number, host: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const socket = net.createConnection({ port, host });
    socket.setTimeout(200);

    socket.once('connect', () => {
      socket.destroy();
      resolve(true); // Occupied!
    });

    socket.once('error', () => {
      resolve(false);
    });

    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function canBind(port: number, host?: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const server = net.createServer();
    server.once('error', (err: NodeJS.ErrnoException) => {
      // If IPv6 is unavailable on this machine, ignore EADDRNOTAVAIL/EAFNOSUPPORT
      if (host === '::1' && (err.code === 'EADDRNOTAVAIL' || err.code === 'EAFNOSUPPORT')) {
        resolve(true);
        return;
      }
      resolve(false);
    });
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    try {
      if (host) {
        server.listen(port, host);
      } else {
        server.listen(port);
      }
    } catch {
      resolve(false);
    }
  });
}

/**
 * Checks if a specific port is currently available across both IPv4 and IPv6 loopback
 * and wildcard interfaces so multiple CMS instances never collide on the same port.
 */
export async function isPortAvailable(port: number, host = 'localhost'): Promise<boolean> {
  // 1. Active TCP connection checks on both IPv4 and IPv6 loopback
  const [v4Occupied, v6Occupied] = await Promise.all([
    canConnectTo(port, '127.0.0.1'),
    canConnectTo(port, '::1')
  ]);

  if (v4Occupied || v6Occupied) {
    return false;
  }

  // 2. Bind checks on wildcard, IPv4 loopback, and IPv6 loopback
  if (!(await canBind(port))) return false;
  if (!(await canBind(port, '127.0.0.1'))) return false;
  if (!(await canBind(port, '::1'))) return false;

  // 3. Specific custom host check if provided
  if (host !== '0.0.0.0' && host !== 'localhost' && host !== '127.0.0.1' && host !== '::1') {
    if (!(await canBind(port, host))) return false;
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
