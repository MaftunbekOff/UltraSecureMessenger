
import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

export class MessageCompression {
  static async compressMessage(content: string): Promise<string> {
    if (content.length < 100) return content; // Don't compress small messages
    
    try {
      const compressed = await gzip(Buffer.from(content, 'utf8'));
      return compressed.toString('base64');
    } catch (error) {
      return content; // Fallback to original
    }
  }

  static async decompressMessage(content: string): Promise<string> {
    try {
      const buffer = Buffer.from(content, 'base64');
      const decompressed = await gunzip(buffer);
      return decompressed.toString('utf8');
    } catch (error) {
      return content; // Assume it's not compressed
    }
  }

  static shouldCompress(content: string): boolean {
    return content.length > 100;
  }
}
