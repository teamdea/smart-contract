import fs from "fs";
import path from "path";

// Minimal JSON-file-backed store. Repository method signatures (findAll,
// findById, create, update) are Firestore-shaped so swapping in real
// Firestore later only touches the repositories/* files, not services.
export class JsonStore<T extends Record<string, unknown[]>> {
  private readonly filePath: string;
  private data: T;

  constructor(filePath: string, initial: T) {
    this.filePath = filePath;
    this.data = this.load(initial);
  }

  private load(initial: T): T {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify(initial, null, 2));
      return initial;
    }
    const raw = fs.readFileSync(this.filePath, "utf-8");
    if (!raw.trim()) {
      return initial;
    }
    return { ...initial, ...JSON.parse(raw) };
  }

  get<K extends keyof T>(collection: K): T[K] {
    return this.data[collection];
  }

  set<K extends keyof T>(collection: K, records: T[K]): void {
    this.data[collection] = records;
    this.persist();
  }

  private persist(): void {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }
}
