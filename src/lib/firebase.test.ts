import { beforeEach, describe, expect, it, vi } from "vitest";

const getDocMock = vi.fn();
const setDocMock = vi.fn();

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock("firebase/auth", () => {
  class GoogleAuthProviderMock {
    addScope() {}
    static credentialFromResult() {
      return null;
    }
  }

  return {
    getAuth: vi.fn(() => ({})),
    signInWithPopup: vi.fn(),
    GoogleAuthProvider: GoogleAuthProviderMock,
    onAuthStateChanged: vi.fn(),
    signOut: vi.fn(),
    browserLocalPersistence: {},
    setPersistence: vi.fn(),
  };
});

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn((...parts: unknown[]) => parts.join("/")),
  getDoc: getDocMock,
  getFirestore: vi.fn(() => ({})),
  getDocs: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  setDoc: setDocMock,
  orderBy: vi.fn(),
  deleteDoc: vi.fn(),
}));

vi.mock("firebase/storage", () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}));

describe("signInOrCreateWithPassword", () => {
  beforeEach(() => {
    localStorage.clear();
    getDocMock.mockReset();
    setDocMock.mockReset();
  });

  it("accepts a valid password and persists the local account", async () => {
    getDocMock.mockResolvedValue({ exists: () => false, data: () => null });

    const { signInOrCreateWithPassword } = await import("./firebase");

    const created = await signInOrCreateWithPassword("diretoria", "Senha123");
    expect(created.email).toBe("diretoria@uniodonto.com");
    expect(setDocMock).toHaveBeenCalled();

    const accepted = await signInOrCreateWithPassword("diretoria", "Senha123");
    expect(accepted.email).toBe("diretoria@uniodonto.com");
  });

  it("rejects an invalid password for an existing account", async () => {
    getDocMock.mockResolvedValue({ exists: () => false, data: () => null });

    const { signInOrCreateWithPassword } = await import("./firebase");

    await signInOrCreateWithPassword("diretoria", "Senha123");
    await expect(signInOrCreateWithPassword("diretoria", "Senha000")).rejects.toThrow("Senha inválida.");
  });
});
