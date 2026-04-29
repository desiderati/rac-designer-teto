export class HouseManagerNotifier {
  private listeners = new Set<() => void>();

  addInternalListener(listener: () => void): void {
    this.listeners.add(listener);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(): void {
    this.listeners.forEach((listener) => listener());
  }
}
