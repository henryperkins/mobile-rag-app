type Row = Record<string, any>;

class MockDatabase {
  execSync(_sql: string): void {
    // noop
  }

  runSync(_sql: string, ..._params: any[]): void {
    // noop
  }

  getAllSync<T = Row>(_sql: string, ..._params: any[]): T[] {
    return [];
  }

  getFirstSync<T = Row>(_sql: string, ..._params: any[]): T | undefined {
    return undefined;
  }
}

export function openDatabaseSync(_name: string): MockDatabase {
  return new MockDatabase();
}
