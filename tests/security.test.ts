import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { safeResolvePath, sanitize, sanitizeFilename, renderBlockToHtml } from '@cms/utils';
import { RolePermissions } from '@cms/schemas';

describe('Security Layer & Hardening', () => {
  it('should block path traversal attempts', () => {
    const root = path.resolve('/var/www/storage');

    // Normal safe path
    expect(() => safeResolvePath(root, 'pages/about.json')).not.toThrow();

    // Traversal attempts
    expect(() => safeResolvePath(root, '../../etc/passwd')).toThrow(/Access Denied/);
    expect(() => safeResolvePath(root, '../../../root/.ssh/id_rsa')).toThrow(/Access Denied/);
    expect(() => safeResolvePath(root, 'content/../../../../etc/shadow')).toThrow(/Access Denied/);
  });

  it('should sanitize unsafe filenames', () => {
    expect(sanitizeFilename('../../evil.exe')).toBe('evil.exe');
    expect(sanitizeFilename('my image (1) #$.png')).toBe('my_image__1____.png');
    expect(sanitizeFilename('')).toMatch(/^file_\d+/);
  });

  it('should sanitize malicious HTML and XSS payloads in rich content', () => {
    const maliciousHtml = `
      <p>Normal text</p>
      <script>alert("XSS")</script>
      <img src="x" onerror="alert('Hacked!')" />
      <a href="javascript:alert(1)">Click here</a>
      <iframe src="https://evil.com"></iframe>
    `;

    const clean = sanitize(maliciousHtml);

    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('alert(');
    expect(clean).not.toContain('onerror');
    expect(clean).not.toContain('javascript:');
    expect(clean).not.toContain('<iframe');
    expect(clean).toContain('<p>Normal text</p>');
  });

  it('should correctly enforce RBAC permissions', () => {
    expect(RolePermissions.admin).toContain('users.create');
    expect(RolePermissions.admin).toContain('publish.all');
    expect(RolePermissions.admin).toContain('backups.create');

    expect(RolePermissions.editor).toContain('pages.create');
    expect(RolePermissions.editor).toContain('publish.all');
    expect(RolePermissions.editor).not.toContain('users.create');
    expect(RolePermissions.editor).not.toContain('backups.create');

    expect(RolePermissions.author).toContain('posts.create');
    expect(RolePermissions.author).not.toContain('pages.create');
    expect(RolePermissions.author).not.toContain('publish.all');
    expect(RolePermissions.author).not.toContain('users.create');
  });

  it('should escape dangerous characters when rendering structured blocks', () => {
    const maliciousHeading = renderBlockToHtml({
      id: '1',
      type: 'heading',
      level: 2,
      text: '<script>alert(1)</script>Safe Title'
    });

    expect(maliciousHeading).not.toContain('<script>');
    expect(maliciousHeading).toContain('&lt;script&gt;');
  });
});
