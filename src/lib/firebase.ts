import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, onSnapshot, query, setDoc, orderBy, deleteDoc } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

void setPersistence(auth, browserLocalPersistence);

const provider = new GoogleAuthProvider();
// Required Workspace scopes as per user config
provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export interface AppUserProfile {
  uid: string;
  email: string;
  name: string;
  role: "Administrador" | "Operador" | "Tech FerTaise";
  photoUrl?: string;
  localPhotoUrl?: string;
  phone?: string;
  updatedAt?: string;
  lgpdAcceptedAt?: string;
}

export interface TeamMemberRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "ATIVO" | "INATIVO";
  initials: string;
  avatarBgColor: string;
  isPhoto?: boolean;
  photoUrl?: string;
  localPhotoUrl?: string;
  updatedAt?: string;
}

export const toLoginEmail = (value: string) => {
  const trimmed = value.trim().toLowerCase();
  return trimmed.includes("@") ? trimmed : `${trimmed}@uniodonto.com`;
};

export const resolveRoleFromEmail = (email: string): "Administrador" | "Operador" | "Tech FerTaise" => {
  const lower = email.toLowerCase();
  if (lower === "fertaisetech@gmail.com") return "Tech FerTaise";
  return lower.includes("admin") || lower.includes("diretoria")
    ? "Administrador"
    : "Operador";
};

const sha256 = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const ACCOUNT_COLLECTION = "accounts";
const PROFILE_COLLECTION = "users";

export const userAccountRef = (email: string) => doc(db, ACCOUNT_COLLECTION, toLoginEmail(email));
const legacyUserAccountRef = (email: string) => doc(db, PROFILE_COLLECTION, toLoginEmail(email));
const LOCAL_ACCOUNTS_KEY = "uniodonto_local_accounts";

const readLocalAccounts = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || "{}") as Record<string, AppUserProfile & { passwordHash: string }>;
  } catch {
    return {};
  }
};

const writeLocalAccounts = (accounts: Record<string, AppUserProfile & { passwordHash: string }>) => {
  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
};

const stripPasswordHash = (account: AppUserProfile & { passwordHash?: string }) => {
  const { passwordHash: _passwordHash, ...publicProfile } = account;
  return publicProfile;
};

const readRemoteAccount = async (email: string) => {
  const normalizedEmail = toLoginEmail(email);

  try {
    const currentSnap = await getDoc(userAccountRef(normalizedEmail));
    if (currentSnap.exists()) {
      return currentSnap.data() as AppUserProfile & { passwordHash?: string };
    }

    const legacySnap = await getDoc(legacyUserAccountRef(normalizedEmail));
    if (legacySnap.exists()) {
      return legacySnap.data() as AppUserProfile & { passwordHash?: string };
    }
  } catch {
    // If Firestore is protected by authenticated-only rules, fall back to local bootstrap.
  }

  return null;
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    // Validação de E-mail Autorizado (Mock/Exemplo)
    const email = result.user.email || "";
    if (!email.endsWith("@uniodonto.com")) {
      await signOut(auth);
      throw new Error("Unauthorized email domain or user.");
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const signInOrCreateWithPassword = async (emailOrUser: string, password: string) => {
  const email = toLoginEmail(emailOrUser);
  const normalizedEmail = email.toLowerCase();
  if (normalizedEmail === "fertaisetech@gmail.com" && password !== "#Ft739146") {
    throw new Error("Senha inválida.");
  }
  if (normalizedEmail === "fertaisetech@gmail.com") {
    try {
      await signInWithEmailAndPassword(auth, normalizedEmail, password);
    } catch (error: any) {
      if (error?.code === "auth/user-not-found" || error?.code === "auth/invalid-credential") {
        await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      } else {
        throw error;
      }
    }
  }
  const passwordHash = normalizedEmail === "fertaisetech@gmail.com"
    ? await sha256("#Ft739146")
    : await sha256(password);
  const displayName = emailOrUser.includes("@") ? emailOrUser.split("@")[0] : emailOrUser;
  const accounts = readLocalAccounts();
  let existing = accounts[email];

  if (!existing) {
    const remoteAccount = await readRemoteAccount(email);
    if (remoteAccount?.passwordHash) {
      existing = {
        uid: remoteAccount.uid || email,
        email: remoteAccount.email || email,
        name: remoteAccount.name || displayName || email.split("@")[0],
        role: remoteAccount.role || resolveRoleFromEmail(email),
        photoUrl: remoteAccount.photoUrl,
        phone: remoteAccount.phone,
        updatedAt: remoteAccount.updatedAt,
        lgpdAcceptedAt: remoteAccount.lgpdAcceptedAt,
        passwordHash: remoteAccount.passwordHash,
      };
      accounts[email] = existing;
      writeLocalAccounts(accounts);
    }
  }

  if (!existing) {
    const created: AppUserProfile & { passwordHash: string } = {
      uid: email,
      email,
      name: displayName || email.split("@")[0],
      role: resolveRoleFromEmail(email),
      updatedAt: new Date().toISOString(),
      passwordHash,
    };

    accounts[email] = created;
    writeLocalAccounts(accounts);

    const publicProfile = stripPasswordHash(created);
    void Promise.allSettled([
      setDoc(userAccountRef(email), created, { merge: true }),
      setDoc(userProfileRef(created.uid), publicProfile, { merge: true }),
    ]);
    return created;
  }

  if (existing.passwordHash !== passwordHash || (normalizedEmail === "fertaisetech@gmail.com" && password !== "#Ft739146")) {
    throw new Error("Senha inválida.");
  }

  const merged = {
    ...existing,
    updatedAt: new Date().toISOString(),
  };
  accounts[email] = merged;
  writeLocalAccounts(accounts);

  const publicProfile = stripPasswordHash(merged);
  void Promise.allSettled([
    setDoc(userAccountRef(email), merged, { merge: true }),
    setDoc(userProfileRef(merged.uid), publicProfile, { merge: true }),
  ]);
  return merged;
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export const userProfileRef = (uid: string) => doc(db, "users", uid);

export const ensureUserProfile = async (user: User): Promise<AppUserProfile> => {
  const ref = userProfileRef(user.uid);
  const snap = await getDoc(ref);
  const fallbackProfile: AppUserProfile = {
    uid: user.uid,
    email: user.email || "",
    name: user.displayName || (user.email ? user.email.split("@")[0] : "Usuário"),
    role: resolveRoleFromEmail(user.email || ""),
    photoUrl: user.photoURL || undefined,
    updatedAt: new Date().toISOString(),
  };

  if (!snap.exists()) {
    await setDoc(ref, fallbackProfile, { merge: true });
    return fallbackProfile;
  }

  const data = snap.data() as Partial<AppUserProfile>;
  const merged = {
    ...fallbackProfile,
    ...data,
  } as AppUserProfile;

  await setDoc(ref, merged, { merge: true });
  return merged;
};

export const saveUserProfile = async (profile: AppUserProfile) => {
  const nextProfile = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };

  const accounts = readLocalAccounts();
  const existing = accounts[toLoginEmail(profile.email)];
  if (existing) {
    accounts[toLoginEmail(profile.email)] = {
      ...existing,
      ...nextProfile,
      passwordHash: existing.passwordHash,
    };
    writeLocalAccounts(accounts);
  }

  localStorage.setItem(`uniodonto_profile_${profile.uid}`, JSON.stringify(nextProfile));

  try {
    const { localPhotoUrl: _localPhotoUrl, ...remoteProfile } = nextProfile;
    await setDoc(userProfileRef(profile.uid), remoteProfile, { merge: true });
  } catch {
    // Keep the local profile saved when Firebase is unavailable.
  }
};

export const observeUserProfile = (
  uid: string,
  onChange: (profile: AppUserProfile | null) => void,
  onError?: (error: Error) => void
) => {
  return onSnapshot(
    userProfileRef(uid),
    (snap) => {
      if (!snap.exists()) {
        onChange(null);
        return;
      }

      onChange(snap.data() as AppUserProfile);
    },
    (error) => {
      if (onError) {
        onError(error instanceof Error ? error : new Error("Falha ao ler o perfil do usuário no Firestore."));
      }
    }
  );
};

export const uploadUserProfilePhoto = async (uid: string, file: File) => {
  const fileName = `${Date.now()}-${file.name}`;
  const ref = storageRef(storage, `profile-photos/${uid}/${fileName}`);

  try {
    await uploadBytes(ref, file);
    return await getDownloadURL(ref);
  } catch {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
};

const TEAM_MEMBERS_COLLECTION = collection(db, "organizations", "uniodonto", "teamMembers");
const LOCAL_TEAM_MEMBERS_KEY = "uniodonto_local_team_members";

const readLocalTeamMembers = (): TeamMemberRecord[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_TEAM_MEMBERS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed as TeamMemberRecord[] : [];
  } catch {
    return [];
  }
};

const writeLocalTeamMembers = (members: TeamMemberRecord[]) => {
  localStorage.setItem(LOCAL_TEAM_MEMBERS_KEY, JSON.stringify(members));
};

const mergeTeamMembers = (remoteMembers: TeamMemberRecord[]) => {
  const byId = new Map(remoteMembers.map((member) => [member.id, member]));
  for (const localMember of readLocalTeamMembers()) {
    byId.set(localMember.id, localMember);
  }
  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
};

export const loadTeamMembers = async (): Promise<TeamMemberRecord[]> => {
  try {
    const snap = await getDocs(query(TEAM_MEMBERS_COLLECTION, orderBy("name", "asc")));
    return mergeTeamMembers(snap.docs.map((document) => document.data() as TeamMemberRecord));
  } catch {
    return readLocalTeamMembers().sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }
};

export const observeTeamMembers = (
  onChange: (members: TeamMemberRecord[]) => void,
  onError?: (error: Error) => void
) => {
  return onSnapshot(
    query(TEAM_MEMBERS_COLLECTION, orderBy("name", "asc")),
    (snap) => {
      onChange(mergeTeamMembers(snap.docs.map((document) => document.data() as TeamMemberRecord)));
    },
    (error) => {
      const localMembers = readLocalTeamMembers().sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      if (localMembers.length > 0) onChange(localMembers);
      if (onError) {
        onError(error instanceof Error ? error : new Error("Falha ao ler os membros da equipe no Firestore."));
      }
    }
  );
};

export const saveTeamMember = async (member: TeamMemberRecord) => {
  const nextMember = {
    ...member,
    updatedAt: new Date().toISOString(),
  };

  const localMembers = readLocalTeamMembers().filter((current) => current.id !== member.id);
  writeLocalTeamMembers([...localMembers, nextMember]);

  try {
    const { localPhotoUrl: _localPhotoUrl, ...remoteMember } = nextMember;
    await setDoc(doc(TEAM_MEMBERS_COLLECTION, member.id), remoteMember, { merge: true });
  } catch {
    // The local login can be active without a Firebase Auth session.
    // Keep the change available in this browser until remote access is restored.
  }
};

export const deleteTeamMember = async (memberId: string) => {
  writeLocalTeamMembers(readLocalTeamMembers().filter((member) => member.id !== memberId));
  try {
    await deleteDoc(doc(TEAM_MEMBERS_COLLECTION, memberId));
  } catch {
    // Local deletion is already complete when Firebase is unavailable.
  }
};

export const uploadTeamMemberPhoto = async (memberId: string, file: File) => {
  const fileName = `${Date.now()}-${file.name}`;
  const ref = storageRef(storage, `team-member-photos/${memberId}/${fileName}`);

  try {
    await uploadBytes(ref, file);
    return await getDownloadURL(ref);
  } catch {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
};
