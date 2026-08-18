import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Todas as variáveis abaixo são públicas por natureza (prefixo NEXT_PUBLIC_) —
// a segurança dos dados é garantida pelas Firestore Security Rules, não por
// esconder essas chaves. Configure-as no seu `.env.local` (veja `.env.local.example`).
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function validarConfig(config: FirebaseOptions) {
  const faltando = Object.entries(config)
    .filter(([, valor]) => !valor)
    .map(([chave]) => chave);

  if (faltando.length > 0) {
    // Erro explícito em vez de uma falha silenciosa/confusa do SDK do Firebase.
    throw new Error(
      `Firebase: variáveis de ambiente ausentes: ${faltando.join(
        ", "
      )}. Confira o seu .env.local (veja .env.local.example).`
    );
  }
}

validarConfig(firebaseConfig);

// Evita reinicializar o app em hot-reload / múltiplos imports.
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
