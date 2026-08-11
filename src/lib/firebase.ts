import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
  signInWithEmailAndPassword,
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
  role: "Administrador" | "Operador" | "Diretor" | "Gerente" | "Recepção" | "Vendedoras" | "Tech FerTaise";
  photoUrl?: string;
  localPhotoUrl?: string;
  phone?: string;
  updatedAt?: string;
  lgpdAcceptedAt?: string;
  status?: "ATIVO" | "INATIVO";
  screens?: TeamMemberRecord["screens"];
}

export const LGPD_CONSENT_VERSION = "2026-08-10-v2";
const LOCAL_CONSENT_KEY = "uniodonto_lgpd_consent";

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
  accessPassword?: string;
  updatedAt?: string;
  screens?: {
    dashboard?: boolean;
    relatorios?: boolean;
    envio?: boolean;
    configuracoes?: boolean;
    comunicacoes?: boolean;
    appVendas?: boolean;
    crm?: boolean;
  };
}

export const toLoginEmail = (value: string) => {
  const trimmed = value.trim().toLowerCase();
  return trimmed.includes("@") ? trimmed : `${trimmed}@uniodonto.com`;
};

export const resolveRoleFromEmail = (email: string): AppUserProfile["role"] => {
  const lower = email.toLowerCase().trim();
  const normalized = lower.includes("@") ? lower : `${lower}@uniodonto.com`;
  if (normalized === "fertaisetech@gmail.com") return "Tech FerTaise";
  if (["elcio@uniodonto.com", "luiz@uniodonto.com", "luizfernando@uniodonto.com", "mateus@uniodonto.com"].includes(normalized)) return "Diretor";
  if (["janaina@uniodonto.com", "ge*****@uniodonto.com"].includes(normalized)) return "Gerente";
  if (normalized === "recepção@uniodonto.com" || normalized === "recepcao@uniodonto.com") return "Recepção";
  return normalized.includes("admin") || normalized.includes("diretoria")
    ? "Administrador"
    : "Operador";
};

export const resolveDisplayNameFromEmail = (email: string, fallback: string) => {
  const normalized = toLoginEmail(email);
  const knownNames: Record<string, string> = {
    "elcio@uniodonto.com": "Dr. Elcio Beraldo",
    "luiz@uniodonto.com": "Dr. Luiz Fernando",
    "luizfernando@uniodonto.com": "Dr. Luiz Fernando",
    "mateus@uniodonto.com": "Dr. Mateus José",
    "janaina@uniodonto.com": "Janaína Pádua",
    "fertaisetech@gmail.com": "FerTaise Tech",
    "admin@uniodonto.com": "Administrador Uniodonto",
    "recepção@uniodonto.com": "Recepção Uniodonto",
    "recepcao@uniodonto.com": "Recepção Uniodonto",
  };
  return knownNames[normalized] || fallback;
};

const PROFILE_COLLECTION = "users";

const withoutUndefined = <T extends object>(value: T): T =>
  Object.fromEntries(Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined)) as T;

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
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const firebaseUser = credential.user;
  const normalizedEmail = (firebaseUser.email || email).toLowerCase();

  const memberSnapshot = await getDocs(query(
    collection(db, "organizations", "uniodonto", "teamMembers"),
    orderBy("name", "asc"),
  ));
  const member = memberSnapshot.docs
    .map((entry) => entry.data() as TeamMemberRecord)
    .find((entry) => entry.id === firebaseUser.uid || entry.email.toLowerCase() === normalizedEmail);

  if (member?.status === "INATIVO") {
    await signOut(auth);
    throw new Error("Esta conta está inativa.");
  }

  const profileRef = doc(db, PROFILE_COLLECTION, firebaseUser.uid);
  const profileSnapshot = await getDoc(profileRef);
  const savedProfile = profileSnapshot.exists() ? profileSnapshot.data() as Partial<AppUserProfile> : {};
  const role = (member?.role || savedProfile.role || resolveRoleFromEmail(normalizedEmail)) as AppUserProfile["role"];
  const profile: AppUserProfile = {
    ...savedProfile,
    uid: firebaseUser.uid,
    email: normalizedEmail,
    name: member?.name || savedProfile.name || resolveDisplayNameFromEmail(normalizedEmail, firebaseUser.displayName || normalizedEmail.split("@")[0]),
    role,
    status: member?.status || savedProfile.status || "ATIVO",
    screens: member?.screens || savedProfile.screens,
    photoUrl: member?.photoUrl || savedProfile.photoUrl || firebaseUser.photoURL || undefined,
    updatedAt: new Date().toISOString(),
  };

  await setDoc(profileRef, withoutUndefined(profile), { merge: true });
  return profile;
};

export const recordConsentDecision = async (
  profile: Pick<AppUserProfile, "uid" | "email">,
  decision: "accepted" | "revoked",
) => {
  const record = {
    uid: profile.uid,
    email: profile.email,
    version: LGPD_CONSENT_VERSION,
    decision,
    recordedAt: new Date().toISOString(),
  };

  localStorage.setItem(`${LOCAL_CONSENT_KEY}_${profile.uid}`, JSON.stringify(record));

  try {
    await setDoc(
      doc(db, "organizations", "uniodonto", "consents", `${profile.uid}_${LGPD_CONSENT_VERSION}`),
      record,
      { merge: true },
    );
    return { ...record, remote: true };
  } catch {
    return { ...record, remote: false };
  }
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
    await setDoc(ref, withoutUndefined(fallbackProfile), { merge: true });
    return fallbackProfile;
  }

  const data = snap.data() as Partial<AppUserProfile>;
  const merged = {
    ...fallbackProfile,
    ...data,
  } as AppUserProfile;

  await setDoc(ref, withoutUndefined(merged), { merge: true });
  return merged;
};

export const saveUserProfile = async (profile: AppUserProfile) => {
  const nextProfile = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };

  const { localPhotoUrl: _localPhotoUrl, ...remoteProfile } = nextProfile;
  await setDoc(userProfileRef(profile.uid), withoutUndefined(remoteProfile), { merge: true });
  localStorage.setItem(`uniodonto_profile_${profile.uid}`, JSON.stringify(nextProfile));
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

  await uploadBytes(ref, file);
  return await getDownloadURL(ref);
};

const TEAM_MEMBERS_COLLECTION = collection(db, "organizations", "uniodonto", "teamMembers");
const TEAM_CREDENTIALS_COLLECTION = collection(db, "organizations", "uniodonto", "teamCredentials");
const LOCAL_TEAM_MEMBERS_KEY = "uniodonto_local_team_members";
const ROLE_SCREENS_COLLECTION = collection(db, "organizations", "uniodonto", "roleScreens");

export const loadRoleScreens = async (): Promise<Record<string, Record<string, boolean>> | null> => {
  try {
    const snap = await getDocs(ROLE_SCREENS_COLLECTION);
    const result: Record<string, Record<string, boolean>> = {};
    snap.docs.forEach((entry) => { result[entry.id] = entry.data() as Record<string, boolean>; });
    return result;
  } catch {
    return null;
  }
};

export const saveRoleScreens = async (permissions: Record<string, Record<string, boolean>>) => {
  await Promise.all(Object.entries(permissions).map(([role, screens]) => setDoc(doc(ROLE_SCREENS_COLLECTION, role), screens, { merge: true })));
};

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

const mergeTeamMembers = (remoteMembers: TeamMemberRecord[]) =>
  [...remoteMembers].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

const attachMemberPasswords = async (members: TeamMemberRecord[]) => {
  try {
    const credentials = await getDocs(TEAM_CREDENTIALS_COLLECTION);
    const passwords = new Map(credentials.docs.map((entry) => [entry.id, String(entry.data().accessPassword || "")]));
    const missing = members.filter((member) => !passwords.has(member.id) && member.email.toLowerCase() !== "fertaisetech@gmail.com");
    await Promise.all(missing.map((member) => {
      const accessPassword = `${member.email.split("@")[0]}123`;
      passwords.set(member.id, accessPassword);
      return setDoc(doc(TEAM_CREDENTIALS_COLLECTION, member.id), {
        accessPassword,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }));
    return members.map((member) => ({ ...member, accessPassword: passwords.get(member.id) || member.accessPassword }));
  } catch {
    return members;
  }
};

export const loadTeamMembers = async (): Promise<TeamMemberRecord[]> => {
  try {
    const snap = await getDocs(query(TEAM_MEMBERS_COLLECTION, orderBy("name", "asc")));
    const members = mergeTeamMembers(await attachMemberPasswords(snap.docs.map((document) => document.data() as TeamMemberRecord)));
    writeLocalTeamMembers(members);
    return members;
  } catch (error) {
    const cached = readLocalTeamMembers();
    if (cached.length > 0) return mergeTeamMembers(cached);
    throw error;
  }
};

export const observeTeamMembers = (
  onChange: (members: TeamMemberRecord[]) => void,
  onError?: (error: Error) => void
) => {
  return onSnapshot(
    query(TEAM_MEMBERS_COLLECTION, orderBy("name", "asc")),
    async (snap) => {
      const members = mergeTeamMembers(await attachMemberPasswords(snap.docs.map((document) => document.data() as TeamMemberRecord)));
      if (members.length > 0) writeLocalTeamMembers(members);
      onChange(members.length > 0 ? members : mergeTeamMembers(readLocalTeamMembers()));
    },
    (error) => {
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

  const { localPhotoUrl: _localPhotoUrl, accessPassword, ...remoteMember } = nextMember;
  const writes: Promise<unknown>[] = [
    setDoc(doc(TEAM_MEMBERS_COLLECTION, member.id), remoteMember, { merge: true }),
    setDoc(userProfileRef(member.id), {
      uid: member.id,
      email: member.email,
      name: member.name,
      role: member.role,
      status: member.status,
      screens: member.screens,
      photoUrl: member.photoUrl || null,
      updatedAt: nextMember.updatedAt,
    }, { merge: true }),
  ];
  if (accessPassword !== undefined) {
    writes.push(setDoc(doc(TEAM_CREDENTIALS_COLLECTION, member.id), {
      accessPassword,
      updatedAt: nextMember.updatedAt,
    }, { merge: true }));
  }
  await Promise.all(writes);
  const localMembers = readLocalTeamMembers().filter((current) => current.id !== member.id);
  writeLocalTeamMembers([...localMembers, nextMember]);
};

export const deleteTeamMember = async (memberId: string) => {
  await deleteDoc(doc(TEAM_MEMBERS_COLLECTION, memberId));
  writeLocalTeamMembers(readLocalTeamMembers().filter((member) => member.id !== memberId));
};

export const uploadTeamMemberPhoto = async (memberId: string, file: File) => {
  const fileName = `${Date.now()}-${file.name}`;
  const ref = storageRef(storage, `team-member-photos/${memberId}/${fileName}`);

  await uploadBytes(ref, file);
  return await getDownloadURL(ref);
};
