import { beforeEach, describe, expect, it, vi } from "vitest";

const getDocMock = vi.fn();
const setDocMock = vi.fn();
const getDocsMock = vi.fn();
const signInWithEmailAndPasswordMock = vi.fn();
const uploadBytesMock = vi.fn();
const getDownloadURLMock = vi.fn();

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
    signInWithEmailAndPassword: signInWithEmailAndPasswordMock,
    sendPasswordResetEmail: vi.fn(),
  };
});

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn((...parts: unknown[]) => parts.join("/")),
  getDoc: getDocMock,
  getFirestore: vi.fn(() => ({})),
  getDocs: getDocsMock,
  onSnapshot: vi.fn(),
  query: vi.fn(),
  setDoc: setDocMock,
  orderBy: vi.fn(),
  deleteDoc: vi.fn(),
}));

vi.mock("firebase/storage", () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn((_storage, path) => path),
  uploadBytes: uploadBytesMock,
  getDownloadURL: getDownloadURLMock,
}));

describe("signInOrCreateWithPassword", () => {
  beforeEach(() => {
    localStorage.clear();
    getDocMock.mockReset();
    setDocMock.mockReset();
    getDocsMock.mockReset();
    signInWithEmailAndPasswordMock.mockReset();
    uploadBytesMock.mockReset();
    getDownloadURLMock.mockReset();
  });

  it("authenticates every account with Firebase and persists its profile", async () => {
    getDocMock.mockResolvedValue({ exists: () => false, data: () => null });
    getDocsMock.mockResolvedValue({ docs: [] });
    signInWithEmailAndPasswordMock.mockResolvedValue({
      user: { uid: "firebase-uid", email: "diretoria@uniodonto.com", displayName: "Diretoria", photoURL: null },
    });

    const { signInOrCreateWithPassword } = await import("./firebase");

    const created = await signInOrCreateWithPassword("diretoria", "Senha123");
    expect(created.email).toBe("diretoria@uniodonto.com");
    expect(created.uid).toBe("firebase-uid");
    expect(signInWithEmailAndPasswordMock).toHaveBeenCalledWith({}, "diretoria@uniodonto.com", "Senha123");
    expect(setDocMock).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ uid: "firebase-uid" }), { merge: true });
  });

  it("propagates an invalid Firebase password", async () => {
    signInWithEmailAndPasswordMock.mockRejectedValue(new Error("auth/invalid-credential"));

    const { signInOrCreateWithPassword } = await import("./firebase");

    await expect(signInOrCreateWithPassword("diretoria", "Senha000")).rejects.toThrow("auth/invalid-credential");
  });

  it("returns the persisted Storage URL for a team member photo", async () => {
    uploadBytesMock.mockResolvedValue({});
    getDownloadURLMock.mockResolvedValue("https://storage.example/member-photo.webp");
    const { uploadTeamMemberPhoto } = await import("./firebase");
    const file = new File(["image"], "photo.webp", { type: "image/webp" });

    await expect(uploadTeamMemberPhoto("member-uid", file)).resolves.toBe("https://storage.example/member-photo.webp");
    expect(uploadBytesMock).toHaveBeenCalledOnce();
  });

  it("does not pretend a failed photo upload was saved locally", async () => {
    uploadBytesMock.mockRejectedValue(new Error("storage/unauthorized"));
    const { uploadTeamMemberPhoto } = await import("./firebase");
    const file = new File(["image"], "photo.webp", { type: "image/webp" });

    await expect(uploadTeamMemberPhoto("member-uid", file)).rejects.toThrow("storage/unauthorized");
  });
});
