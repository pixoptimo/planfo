export type PublisherType = 'local' | 'server' | 'sftp' | 's3' | 'git';

export interface PublisherConfig {
  type: PublisherType;
  targetPath: string;
  options?: Record<string, unknown>;
}

export interface Publisher {
  readonly type: PublisherType;
  deploy(stagingDir: string, targetDir: string): Promise<boolean>;
  validate(targetDir: string): Promise<boolean>;
}
