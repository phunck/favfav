declare module 'ico-endec' {
  export function encodeIco(buffers: Buffer[], format?: 'png' | 'bmp'): Buffer;
  export function decodeIco(buffer: Buffer): { width: number; height: number; data: Buffer }[];
}