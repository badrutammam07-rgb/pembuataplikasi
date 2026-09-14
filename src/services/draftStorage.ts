// Service for Managing User-Specific Draft and Project Storage
// Spec: Persistent local storage on device ensuring no lost work when continuing on the same device

export interface UserDraft {
  userId: string;
  userEmail: string;
  userName: string;
  code: string;
  messages: any[];
  config?: any;
  databasePreference?: any;
  savedAt: string; // ISO string
  updatedAt?: string; // ISO string
  charCount: number;
}

// Device-Level Persistent Storage Keys
export const DEVICE_PROJECT_KEY = "ghighais_device_project";
export const DEVICE_CODE_KEY = "ghighais_app_code";
export const DEVICE_CHAT_KEY = "ghighais_chat_history";
export const DEVICE_CONFIG_KEY = "ghighais_device_project_config";
export const DEVICE_DB_KEY = "ghighais_database_preference";
export const DEVICE_LAST_SAVED_KEY = "ghighais_device_last_saved";

// Admin Permanent System Branding Storage Key
export const ADMIN_PERMANENT_CONFIG_KEY = "ghighais_app_config";

// Save active project directly to current device storage
export function saveDeviceProject(data: {
  code: string;
  messages: any[];
  config?: any;
  databasePreference?: any;
}): boolean {
  if (typeof window === "undefined") return false;

  try {
    const nowIso = new Date().toISOString();
    const payload: UserDraft = {
      userId: "device_user",
      userEmail: "device_local@ghighais.ai",
      userName: "Pengguna Studio",
      code: data.code || "",
      messages: data.messages || [],
      config: data.config,
      databasePreference: data.databasePreference,
      savedAt: nowIso,
      updatedAt: nowIso,
      charCount: data.code ? data.code.length : 0,
    };

    const payloadJson = JSON.stringify(payload);

    // 1. Unified device project snapshot
    localStorage.setItem(DEVICE_PROJECT_KEY, payloadJson);
    localStorage.setItem(DEVICE_LAST_SAVED_KEY, nowIso);

    // 2. Individual key stores for instant access
    if (data.code !== undefined) {
      localStorage.setItem(DEVICE_CODE_KEY, data.code);
    }
    if (data.messages !== undefined) {
      localStorage.setItem(DEVICE_CHAT_KEY, JSON.stringify(data.messages));
    }
    if (data.config !== undefined) {
      localStorage.setItem(DEVICE_CONFIG_KEY, JSON.stringify(data.config));
    }
    if (data.databasePreference !== undefined) {
      localStorage.setItem(DEVICE_DB_KEY, JSON.stringify(data.databasePreference));
    }

    return true;
  } catch (err) {
    console.warn("Failed to save device project:", err);
    return false;
  }
}

// Retrieve active project from current device storage
export function getDeviceProject(): UserDraft | null {
  if (typeof window === "undefined") return null;

  try {
    // 1. Check primary unified device snapshot
    const rawProject = localStorage.getItem(DEVICE_PROJECT_KEY);
    if (rawProject) {
      const parsed = JSON.parse(rawProject);
      if (parsed && parsed.code) {
        return parsed;
      }
    }

    // 2. Fallback: reconstruct from individual keys
    const code = localStorage.getItem(DEVICE_CODE_KEY);
    if (code) {
      let messages: any[] = [];
      try {
        const rawChat = localStorage.getItem(DEVICE_CHAT_KEY);
        if (rawChat) messages = JSON.parse(rawChat);
      } catch {}

      let config: any = undefined;
      try {
        const rawConf = localStorage.getItem(DEVICE_CONFIG_KEY);
        if (rawConf) config = JSON.parse(rawConf);
      } catch {}

      let databasePreference: any = undefined;
      try {
        const rawDb = localStorage.getItem(DEVICE_DB_KEY);
        if (rawDb) databasePreference = JSON.parse(rawDb);
      } catch {}

      const lastSaved = localStorage.getItem(DEVICE_LAST_SAVED_KEY) || new Date().toISOString();

      return {
        userId: "device_user",
        userEmail: "device_local@ghighais.ai",
        userName: "Pengguna Studio",
        code,
        messages,
        config,
        databasePreference,
        savedAt: lastSaved,
        updatedAt: lastSaved,
        charCount: code.length,
      };
    }
  } catch (err) {
    console.warn("Failed to read device project:", err);
  }

  return null;
}

// Storage keys per user email
export function getUserDraftKey(email: string): string {
  const cleanEmail = (email || "").trim().toLowerCase().replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${cleanEmail}_drafts`;
}

export function getUserProjectsKey(email: string): string {
  const cleanEmail = (email || "").trim().toLowerCase().replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${cleanEmail}_projects`;
}

// Legacy key for backwards compatibility
export function getLegacyDraftKey(userIdOrEmail: string): string {
  if (!userIdOrEmail) return "ghighais_draft_anonymous";
  const cleanId = userIdOrEmail.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `ghighais_draft_${cleanId}`;
}

export function saveUserDraft(
  user: { id: string; email: string; name?: string },
  data: {
    code: string;
    messages: any[];
    config?: any;
    databasePreference?: any;
  }
): boolean {
  // Always save to device storage first
  saveDeviceProject(data);

  const email = (user?.email || user?.id || "").trim().toLowerCase();
  if (!email) return true;

  try {
    const draft: UserDraft = {
      userId: email,
      userEmail: email,
      userName: user.name || "Pengguna Studio",
      code: data.code,
      messages: data.messages || [],
      config: data.config,
      databasePreference: data.databasePreference,
      savedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      charCount: data.code ? data.code.length : 0,
    };

    const draftJson = JSON.stringify(draft);

    // 1. Primary: [email]_drafts
    localStorage.setItem(getUserDraftKey(email), draftJson);

    // 2. Also save to [email]_projects snapshot
    localStorage.setItem(getUserProjectsKey(email), draftJson);

    // 3. Backwards compatibility
    localStorage.setItem(getLegacyDraftKey(email), draftJson);

    return true;
  } catch (err) {
    console.warn("Failed to save user draft:", err);
    return false;
  }
}

export function getUserDraft(user: { id?: string; email?: string }): UserDraft | null {
  // 1. Check device-level project storage first
  const deviceProj = getDeviceProject();
  if (deviceProj && deviceProj.code) {
    return deviceProj;
  }

  const email = (user?.email || user?.id || "").trim().toLowerCase();
  if (!email) return null;

  try {
    // 2. Check primary key: [email]_drafts
    const rawDraft = localStorage.getItem(getUserDraftKey(email));
    if (rawDraft) {
      return JSON.parse(rawDraft);
    }

    // 3. Check [email]_projects
    const rawProject = localStorage.getItem(getUserProjectsKey(email));
    if (rawProject) {
      return JSON.parse(rawProject);
    }

    // 4. Check legacy key
    const rawLegacy = localStorage.getItem(getLegacyDraftKey(email));
    if (rawLegacy) {
      return JSON.parse(rawLegacy);
    }
  } catch (err) {
    console.warn("Failed to read user draft:", err);
  }

  return null;
}

export function deleteUserDraft(user: { id?: string; email?: string }): boolean {
  const email = (user?.email || user?.id || "").trim().toLowerCase();

  try {
    if (email) {
      localStorage.removeItem(getUserDraftKey(email));
      localStorage.removeItem(getUserProjectsKey(email));
      localStorage.removeItem(getLegacyDraftKey(email));
    }

    // Clean active device storage
    localStorage.removeItem(DEVICE_PROJECT_KEY);
    localStorage.removeItem(DEVICE_CODE_KEY);
    localStorage.removeItem(DEVICE_CHAT_KEY);
    localStorage.removeItem(DEVICE_CONFIG_KEY);
    localStorage.removeItem(DEVICE_DB_KEY);
    localStorage.removeItem(DEVICE_LAST_SAVED_KEY);
    return true;
  } catch (err) {
    console.warn("Failed to delete user draft:", err);
    return false;
  }
}

export function hasUserDraft(user: { id?: string; email?: string }): boolean {
  return getUserDraft(user) !== null || getDeviceProject() !== null;
}

// Format relative date / Indonesian timestamp
export function formatDraftTime(isoString?: string): string {
  if (!isoString) return "baru saja";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "baru saja";
    return d.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "baru saja";
  }
}
