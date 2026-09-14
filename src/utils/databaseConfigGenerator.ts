import { DatabaseProvider, DatabaseCredentials, GeneratedConfigFiles } from "../types";

/**
 * Otomatis menghasilkan file konfigurasi (.env, config.js, schema.sql)
 * berdasarkan provider database dan kredensial yang dimasukkan oleh user.
 */
export function generateConfigFiles(
  provider: DatabaseProvider,
  creds: DatabaseCredentials
): GeneratedConfigFiles {
  switch (provider) {
    case "supabase": {
      const url = creds.supabaseUrl?.trim() || "https://your-project.supabase.co";
      const anonKey = creds.supabaseAnonKey?.trim() || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_anon_key_here";
      const serviceKey = creds.supabaseServiceRoleKey?.trim() || "";

      const env = `# ==============================================
# SUPABASE CONFIGURATION (.env)
# ==============================================
VITE_SUPABASE_URL="${url}"
VITE_SUPABASE_ANON_KEY="${anonKey}"
${serviceKey ? `SUPABASE_SERVICE_ROLE_KEY="${serviceKey}"\n` : ""}DATABASE_URL="postgresql://postgres:[PASSWORD]@${url.replace(/^https?:\/\//, "")}:5432/postgres"
`;

      const configJs = `// config.js - Supabase Client SDK Initialization
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '${url}';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '${anonKey}';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
`;

      const schemaSql = `-- schema.sql - Supabase PostgreSQL Schema & Security Rules
-- Aktifkan ekstensi UUID
create extension if not exists "uuid-ossp";

-- 1. Tabel Profil Pengguna (Sinkron dengan Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabel Item / Proyek Aplikasi
create table if not exists public.app_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  data jsonb default '{}'::jsonb,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Row Level Security (RLS) Mandatori
alter table public.profiles enable row level security;
alter table public.app_items enable row level security;

-- Kebijakan Akses: User hanya dapat melihat dan mengedit data mereka sendiri
create policy "User dapat melihat profil publik"
  on public.profiles for select using (true);

create policy "User hanya dapat mengedit profil sendiri"
  on public.profiles for update using (auth.uid() = id);

create policy "User dapat membaca item sendiri"
  on public.app_items for select using (auth.uid() = user_id);

create policy "User dapat membuat item baru"
  on public.app_items for insert with check (auth.uid() = user_id);

create policy "User dapat mengupdate item sendiri"
  on public.app_items for update using (auth.uid() = user_id);

create policy "User dapat menghapus item sendiri"
  on public.app_items for delete using (auth.uid() = user_id);
`;

      return { env, configJs, schemaSql };
    }

    case "firebase": {
      const apiKey = creds.firebaseApiKey?.trim() || "AIzaSyD_ExampleKey_ProductionToken99281";
      const authDomain = creds.firebaseAuthDomain?.trim() || "ghighais-app.firebaseapp.com";
      const projectId = creds.firebaseProjectId?.trim() || "ghighais-app-12345";
      const storageBucket = creds.firebaseStorageBucket?.trim() || "ghighais-app.appspot.com";
      const messagingSenderId = creds.firebaseMessagingSenderId?.trim() || "1029384756";
      const appId = creds.firebaseAppId?.trim() || "1:1029384756:web:abcdef123456";

      const env = `# ==============================================
# FIREBASE CONFIGURATION (.env)
# ==============================================
VITE_FIREBASE_API_KEY="${apiKey}"
VITE_FIREBASE_AUTH_DOMAIN="${authDomain}"
VITE_FIREBASE_PROJECT_ID="${projectId}"
VITE_FIREBASE_STORAGE_BUCKET="${storageBucket}"
VITE_FIREBASE_MESSAGING_SENDER_ID="${messagingSenderId}"
VITE_FIREBASE_APP_ID="${appId}"
`;

      const configJs = `// config.js - Firebase Modular SDK Initialization
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "${apiKey}",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "${authDomain}",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "${projectId}",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "${storageBucket}",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "${messagingSenderId}",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "${appId}"
};

// Mencegah re-initialization ganda
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
`;

      const schemaSql = `// schema.sql / firestore.rules - Aturan Keamanan & Koleksi Firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Fungsi helper keamanan
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Koleksi Profil Pengguna
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create, update: if isOwner(userId);
      allow delete: if false; // Proteksi akun dari penghapusan sembarangan
    }

    // Koleksi Dokumen / Data Aplikasi
    match /items/{itemId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }

    // Koleksi Log & Transaksi
    match /logs/{logId} {
      allow create: if isAuthenticated();
      allow read, update, delete: if false; // Hanya dapat dibaca via backend admin
    }
  }
}
`;

      return { env, configJs, schemaSql };
    }

    case "appwrite": {
      const endpoint = creds.appwriteEndpoint?.trim() || "https://cloud.appwrite.io/v1";
      const projectId = creds.appwriteProjectId?.trim() || "ghighais-project-main";
      const apiKey = creds.appwriteApiKey?.trim() || "appwrite_secret_key_xxxxxxxx";
      const databaseId = creds.appwriteDatabaseId?.trim() || "main_db";

      const env = `# ==============================================
# APPWRITE CONFIGURATION (.env)
# ==============================================
VITE_APPWRITE_ENDPOINT="${endpoint}"
VITE_APPWRITE_PROJECT_ID="${projectId}"
VITE_APPWRITE_DATABASE_ID="${databaseId}"
${apiKey ? `APPWRITE_API_KEY="${apiKey}"\n` : ""}`;

      const configJs = `// config.js - Appwrite Web SDK Initialization
import { Client, Account, Databases, Storage, Avatars } from "appwrite";

const client = new Client();
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || "${endpoint}")
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || "${projectId}");

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || "${databaseId}";

export default client;
`;

      const schemaSql = `-- schema.sql - Appwrite Collection & Attribute Definitions
-- Database ID: ${databaseId}

-- 1. Koleksi "users"
-- ID Koleksi: users
-- Atribut:
-- - email (string, size: 255, required: true)
-- - name (string, size: 128, required: true)
-- - avatar (string, size: 500, required: false)
-- - role (string, size: 50, default: 'member')

-- 2. Koleksi "projects"
-- ID Koleksi: projects
-- Atribut:
-- - title (string, size: 200, required: true)
-- - description (string, size: 2000, required: false)
-- - status (string, size: 50, default: 'active')
-- - user_id (string, size: 36, required: true)
-- - created_at (datetime, required: true)

-- Permission Matrix:
-- read: ["users", "any"]
-- write: ["users"]
`;

      return { env, configJs, schemaSql };
    }

    case "neon": {
      const connStr = creds.neonConnectionString?.trim() || "postgresql://neondb_owner:npg_secret@ep-cool-pool-12345.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
      const dbName = creds.neonDatabaseName?.trim() || "neondb";

      const env = `# ==============================================
# NEON TECH SERVERLESS POSTGRESQL (.env)
# ==============================================
DATABASE_URL="${connStr}"
PGDATABASE="${dbName}"
PGSSLMODE="require"
`;

      const configJs = `// config.js - Neon Tech Serverless PostgreSQL Driver
import { neon, neonConfig } from '@neondatabase/serverless';

// Aktifkan query caching otomatis untuk kecepatan maksimal
neonConfig.fetchConnectionCache = true;

const databaseUrl = process.env.DATABASE_URL || "${connStr}";
export const sql = neon(databaseUrl);

export async function queryDatabase(queryText, params = []) {
  try {
    const result = await sql(queryText, params);
    return { success: true, data: result };
  } catch (error) {
    console.error("Neon Query Error:", error);
    return { success: false, error: error.message };
  }
}

export default sql;
`;

      const schemaSql = `-- schema.sql - Neon Serverless PostgreSQL Optimized Schema
create table if not exists users (
  id serial primary key,
  uuid uuid default gen_random_uuid() unique not null,
  email varchar(255) unique not null,
  name varchar(255) not null,
  password_hash text not null,
  created_at timestamp with time zone default current_timestamp
);

create table if not exists records (
  id serial primary key,
  user_id integer references users(id) on delete cascade,
  title varchar(255) not null,
  payload jsonb default '{}'::jsonb,
  is_archived boolean default false,
  updated_at timestamp with time zone default current_timestamp,
  created_at timestamp with time zone default current_timestamp
);

-- Buat index GIN untuk pencarian JSON berkecepatan tinggi
create index if not exists idx_records_payload on records using gin (payload);
create index if not exists idx_records_user_id on records (user_id);
`;

      return { env, configJs, schemaSql };
    }

    case "pocketbase": {
      const serverUrl = creds.pocketBaseUrl?.trim() || "http://127.0.0.1:8090";
      const email = creds.pocketBaseAdminEmail?.trim() || "admin@example.com";

      const env = `# ==============================================
# POCKETBASE CONFIGURATION (.env)
# ==============================================
VITE_POCKETBASE_URL="${serverUrl}"
${email ? `POCKETBASE_ADMIN_EMAIL="${email}"\n` : ""}`;

      const configJs = `// config.js - PocketBase Client SDK Initialization
import PocketBase from 'pocketbase';

export const pb = new PocketBase(
  import.meta.env.VITE_POCKETBASE_URL || '${serverUrl}'
);

// Auto cancel duplicate pending requests
pb.autoCancellation(false);

export default pb;
`;

      const schemaSql = `-- schema.sql - PocketBase SQLite Collections Migration
-- PocketBase menyimpan struktur koleksi di db lokal.
-- Tabel Sistem Inti & Koleksi Aplikasi:

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  name TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  verified INTEGER DEFAULT 0,
  created TEXT DEFAULT (datetime('now')),
  updated TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS app_records (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  user TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  status TEXT DEFAULT 'published',
  tags TEXT DEFAULT '[]',
  created TEXT DEFAULT (datetime('now')),
  updated TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_records_user ON app_records(user);
CREATE INDEX IF NOT EXISTS idx_records_status ON app_records(status);
`;

      return { env, configJs, schemaSql };
    }

    case "sqlite":
    default: {
      const fileName = creds.sqliteFileName?.trim() || "database.sqlite";
      const mode = creds.sqliteJournalMode?.trim() || "WAL";

      const env = `# ==============================================
# LOCAL SQLITE DATABASE (.env)
# ==============================================
DATABASE_CLIENT="sqlite3"
SQLITE_DB_PATH="./data/${fileName}"
SQLITE_JOURNAL_MODE="${mode}"
SQLITE_FOREIGN_KEYS="true"
`;

      const configJs = `// config.js - Local SQLite (better-sqlite3 / sqlite3)
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.SQLITE_DB_PATH || path.resolve('./data/${fileName}');
const dir = path.dirname(dbPath);

// Pastikan folder penyimpanan database ada
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

export const db = new Database(dbPath, {
  verbose: process.env.NODE_ENV === 'development' ? console.log : null,
});

// Optimasi performa dan integritas database
db.pragma('journal_mode = ${mode}');
db.pragma('foreign_keys = ON');

export default db;
`;

      const schemaSql = `-- schema.sql - Local SQLite Schema
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_app_data_user_id ON app_data(user_id);
`;

      return { env, configJs, schemaSql };
    }
  }
}
