// Service for Managing User-Specific Draft and Project Storage
// Spec: Email as primary userId. Keys: [email]_drafts, [email]_projects

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
  const email = (user?.email || user?.id || "").trim().toLowerCase();
  if (!email) return false;

  try {
    const draft: UserDraft = {
      userId: email,
      userEmail: email,
      userName: user.name || email.split("@")[0],
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
  const email = (user?.email || user?.id || "").trim().toLowerCase();
  if (!email) return null;

  try {
    // 1. Check primary key: [email]_drafts
    const rawDraft = localStorage.getItem(getUserDraftKey(email));
    if (rawDraft) {
      return JSON.parse(rawDraft);
    }

    // 2. Check [email]_projects
    const rawProject = localStorage.getItem(getUserProjectsKey(email));
    if (rawProject) {
      return JSON.parse(rawProject);
    }

    // 3. Check legacy key
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
  if (!email) return false;

  try {
    localStorage.removeItem(getUserDraftKey(email));
    localStorage.removeItem(getUserProjectsKey(email));
    localStorage.removeItem(getLegacyDraftKey(email));

    // Also clean active workspace storage
    localStorage.removeItem("ghighais_app_code");
    localStorage.removeItem("ghighais_chat_history");
    return true;
  } catch (err) {
    console.warn("Failed to delete user draft:", err);
    return false;
  }
}

export function hasUserDraft(user: { id?: string; email?: string }): boolean {
  return getUserDraft(user) !== null;
}

// Format relative date / Indonesian timestamp
export function formatDraftTime(isoString: string): string {
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
