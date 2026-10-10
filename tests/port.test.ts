import { describe, it, expect } from 'vitest';
import net from 'node:net';
import { isPortAvailable, findAvailablePort } from '@cms/utils';

describe('Port Availability & Dynamic Discovery', () => {
  it('should detect when an unused port is available', async () => {
    // Port 19876 is almost certainly free in test environment
    const free = await isPortAvailable(19876);
    expect(free).toBe(true);
  });

  it('should detect when a port is in use and find the next available port', async () => {
    const basePort = 19880;

    // Occupy basePort
    const dummyServer = net.createServer();
    await new Promise<void>((resolve) => {
      dummyServer.listen(basePort, '127.0.0.1', () => resolve());
    });

    try {
      const isOccupied = await isPortAvailable(basePort, '127.0.0.1');
      expect(isOccupied).toBe(false);

      // findAvailablePort should skip basePort and pick basePort + 1
      const availablePort = await findAvailablePort(basePort, '127.0.0.1');
      expect(availablePort).toBe(basePort + 1);
    } finally {
      await new Promise<void>((resolve) => dummyServer.close(() => resolve()));
    }
  });

  it('should respect excluded ports list', async () => {
    const basePort = 19890;
    // Even if basePort is free, excluding it should return basePort + 1
    const chosen = await findAvailablePort(basePort, '127.0.0.1', [basePort]);
    expect(chosen).toBe(basePort + 1);
  });
});
