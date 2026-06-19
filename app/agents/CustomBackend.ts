import {
  type BackendProtocolV2,
  type LsResult,
  type ReadResult,
  type WriteResult,
} from "deepagents";

class MyCustomBackend implements BackendProtocolV2 {
  async ls(path: string): Promise<LsResult> {
  }

  async read(filePath: string, offset?: number, limit?: number): Promise<ReadResult> {
  }

  async write(filePath: string, content: string | Uint8Array): Promise<WriteResult> {
  }

  // Implement other required methods: readRaw, edit, glob, grep, etc.
}