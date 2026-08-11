import "dotenv/config";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const writeEnabled = process.argv.includes("--escrever");
const projectId = process.env.GOOGLE_PROJECT_ID;
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  throw new Error("Credenciais administrativas ausentes. Nenhum usuário foi alterado.");
}

if (!getApps().length) {
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

const directory: Record<string, { name: string; role: string }> = {
  "admin@uniodonto.com": { name: "Administrador Uniodonto", role: "Administrador" },
  "elcio@uniodonto.com": { name: "Dr. Elcio Beraldo", role: "Diretor" },
  "fertaisetech@gmail.com": { name: "FerTaise Tech", role: "Tech FerTaise" },
  "janaina@uniodonto.com": { name: "Janaína Pádua", role: "Gerente" },
  "luizfernando@uniodonto.com": { name: "Dr. Luiz Fernando", role: "Diretor" },
  "mateus@uniodonto.com": { name: "Dr. Mateus José", role: "Diretor" },
  "recepção@uniodonto.com": { name: "Recepção Uniodonto", role: "Recepção" },
};

const colors = ["bg-[#A60069]", "bg-[#0088CC]", "bg-purple-600", "bg-emerald-600", "bg-orange-600"];
const initials = (name: string) => name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
const initialPassword = (email: string) => `${email.split("@")[0]}123`;
const users = (await getAuth().listUsers(1000)).users
  .filter((user) => user.email && directory[user.email.toLowerCase()])
  .map((user, index) => {
    const email = user.email!.toLowerCase();
    const mapped = directory[email];
    return {
      id: user.uid,
      uid: user.uid,
      email,
      name: mapped.name,
      role: mapped.role,
      status: user.disabled ? "INATIVO" : "ATIVO",
      initials: initials(mapped.name),
      avatarBgColor: colors[index % colors.length],
    };
  });

process.stdout.write(`${JSON.stringify(users, null, 2)}\n`);

if (!writeEnabled) {
  process.stdout.write("\nValidação concluída. Use --escrever após revisar os usuários acima.\n");
  process.exit(0);
}

const database = getFirestore();
const batch = database.batch();
for (const user of users) {
  const { uid, ...member } = user;
  batch.set(database.doc(`organizations/uniodonto/teamMembers/${uid}`), {
    ...member,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  batch.set(database.doc(`users/${uid}`), {
    uid,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  if (user.email !== "fertaisetech@gmail.com") {
    batch.set(database.doc(`organizations/uniodonto/teamCredentials/${uid}`), {
      accessPassword: initialPassword(user.email),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }
}
await batch.commit();
process.stdout.write(`\n${users.length} usuários sincronizados com o Firestore.\n`);
