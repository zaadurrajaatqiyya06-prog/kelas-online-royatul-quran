"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
export type UserRole = "murid" | "guru" | "walas" | "admin";
export type StatusPengumpulan = "belum" | "sudah" | "dinilai" | "ditolak";
export type JenisTugas = "esai" | "pg" | "foto" | "video" | "file";

export interface CurrentUser {
  id: string;
  nama: string;
  role: UserRole;
  nis?: string | null;
  nip?: string | null;
  nisn?: string | null;
  noWa?: string | null;
  fotoUrl?: string | null;
  kelasId?: string | null;
  kelasNama?: string | null;
  penugasan?: Assignment[];
}

export interface User {
  id: string;
  nama: string;
  role: UserRole;
  nis?: string | null;
  nip?: string | null;
  nisn?: string | null;
  nik?: string | null;
  noKK?: string | null;
  noKk?: string | null;
  jenisKelamin?: "L" | "P" | string | null;
  statusKenaikan?: string | null;
  noWa?: string | null;
  fotoUrl?: string | null;
  kelasId?: string | null;
  kelasNama?: string | null;
  penugasan?: Assignment[];
}

export interface Kelas {
  id: string;
  nama: string;
  jenjang: number;
  tingkat: number;
  rombel?: string | null;
  waliId?: string | null;
  waliNama?: string;
  totalMurid: number;
}

export interface Mapel {
  id: string;
  nama: string;
  kode?: string | null;
  guruId?: string | null;
  guruNama?: string | null;
  telegramTopic?: string | null;
  telegramTopicId?: string | null;
}


export interface Assignment {
  id?: string;
  guruId?: string;
  guruNama?: string;
  mapelId: string;
  mapelNama: string;
  kelasId: string;
  kelasNama: string;
}

export interface SoalPG {
  id: string;
  nomor: number;
  pertanyaan: string;
  opsiA: string;
  opsiB: string;
  opsiC?: string | null;
  opsiD?: string | null;
  kunciJawaban: "A" | "B" | "C" | "D";
}

export interface SoalEsai {
  id: string;
  nomor: number;
  pertanyaan: string;
}

export interface Tugas {
  id: string;
  judul: string;
  mapelId: string;
  mapelNama: string;
  kelasId: string;
  kelasNama: string;
  guruId: string;
  guruNama: string;
  jenis: JenisTugas;
  instruksi: string;
  deadline: string;
  soalPGList?: SoalPG[];
  soalEsaiList?: SoalEsai[];
  isManualOffline?: boolean;
  tanggalPenilaian?: string | null;
  gdriveFolderId?: string | null;
  driveFolderUrl?: string | null;
  createdAt?: string;
}

export interface Pengumpulan {
  id: string;
  tugasId: string;
  muridId: string;
  muridNama?: string;
  muridNis?: string;
  status: StatusPengumpulan;
  jawabanTeks?: string | null;
  jawabanPG?: Record<number, "A" | "B" | "C" | "D"> | null;
  jawabanEsaiList?: Record<number, string> | null;
  fileName?: string | null;
  fileSizeMb?: number | null;
  isLargeVideo?: boolean;
  autoNilai?: number | null;
  pdfUrl?: string | null;
  gdriveFileUrl?: string | null;
  telegramFileId?: string | null;
  nilai?: number | null;
  catatanGuru?: string | null;
  dinilaiOleh?: string | null;
  waktuNilai?: string | null;
  alasanTolak?: string | null;
  waktuTolak?: string | null;
  waktuSubmit?: string;
}

export interface NilaiManualScore {
  muridId: string;
  nilai: number;
  catatan: string;
}

export interface NilaiManual {
  id: string;
  guruId: string;
  kelasId: string;
  kelasNama?: string;
  mapelId: string;
  mapelNama?: string;
  judul: string;
  judulTugas?: string;
  tanggalPenilaian: string;
  scores: NilaiManualScore[];
  nilaiList?: any[];
  createdAt?: string;
}

// ─── Context Interface ────────────────────────────────────────────────────────
interface AppContextType {
  // Auth
  currentUser: CurrentUser | null;
  isLoading: boolean;
  isDataLoading: boolean;
  login: (identifier: string, pin: string) => Promise<{ error?: string; needsSetupPin?: boolean; userId?: string; nama?: string; user?: CurrentUser }>;
  logout: () => void;
  setupPin: (userId: string, pin: string) => Promise<{ error?: string }>;

  // Data
  usersList: User[];
  kelasList: Kelas[];
  mapelList: Mapel[];
  assignmentList: Assignment[];
  tugasList: Tugas[];
  pengumpulanList: Pengumpulan[];
  nilaiManualList: NilaiManual[];

  // Tugas actions
  createTugas: (data: Omit<Tugas, "id" | "createdAt">) => Promise<void>;
  addTugas: (data: Omit<Tugas, "id" | "createdAt">) => Promise<void>;
  deleteTugas: (id: string) => Promise<void>;

  // Pengumpulan actions
  submitTugas: (data: Omit<Pengumpulan, "id" | "status" | "waktuSubmit" | "muridId"> & { muridId?: string }) => Promise<void>;
  inputNilai: (pengumpulanId: string, nilai: number, catatan: string, guruId: string) => Promise<void>;
  nilaiTugas: (pengumpulanId: string, nilai: number, catatan?: string) => Promise<void>;
  tolakTugas: (pengumpulanId: string, alasan: string) => Promise<void>;
  deletePengumpulan: (id: string) => Promise<void>;

  // Nilai manual
  inputNilaiManualBatch: (data: any) => Promise<void>;

  // Admin: users
  addUser: (data: Omit<User, "id"> & { pin?: string }) => Promise<void>;
  updateUser: (idOrData: any, data?: any) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  bulkImportUsers: (users: any[]) => Promise<{ inserted: number }>;
  importUsersBatch: (users: any[]) => Promise<{ inserted: number }>;
  gantiPinUser: (userId: string, newPin: string) => Promise<void>;

  // Admin: kelas
  addKelas: (dataOrNama: any, jenjang?: number, waliId?: string) => Promise<void>;
  updateKelas: (data: Partial<Kelas> & { id: string }) => Promise<void>;
  deleteKelas: (id: string) => Promise<void>;
  naikKelas: (mode: "serempak" | "manual" | "pengecualian", kelasAsalId: string, kelasTargetId: string, muridIds?: string[], pengecualianIds?: string[]) => Promise<{ moved: number }>;
  naikKelasSerempak: (kelasAsalId: string, kelasTargetId: string, muridTinggalIds?: string[]) => Promise<any>;
  pindahKelasManual: (muridId: string, keKelasId: string) => Promise<any>;
  kelulusanSiswa: (muridIds: string[]) => Promise<any>;

  // Admin: mapel
  addMapel: (data: any) => Promise<void>;
  deleteMapel: (id: string) => Promise<void>;

  // Admin: assignments
  addAssignment: (data: Omit<Assignment, "id">) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  updatePenugasanGuru: (guruId: string, penugasan: any[]) => Promise<void>;

  // Refresh data
  refreshData: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────
const AppContext = createContext<AppContextType | undefined>(undefined);

const SESSION_KEY = "korq_session";

// ─── Helper: API fetch ────────────────────────────────────────────────────────
async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request gagal.");
  return json;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);       // Auth loading
  const [isDataLoading, setIsDataLoading] = useState(false); // Data loading

  const [usersList, setUsersList] = useState<User[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<Mapel[]>([]);
  const [assignmentList, setAssignmentList] = useState<Assignment[]>([]);
  const [tugasList, setTugasList] = useState<Tugas[]>([]);
  const [pengumpulanList, setPengumpulanList] = useState<Pengumpulan[]>([]);
  const [nilaiManualList, setNilaiManualList] = useState<NilaiManual[]>([]);

  // Restore session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const user = JSON.parse(saved) as CurrentUser;
        setCurrentUser(user);
      } catch { /* ignore */ }
    }
    setIsLoading(false);
  }, []);

  // Fetch all data after login
  const refreshData = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const data = await apiFetch("/api/data/master");
      setUsersList(data.users || []);
      setKelasList((data.kelas || []).map((k: any) => ({ ...k, tingkat: k.tingkat ?? k.jenjang })));
      setMapelList(data.mapel || []);
      setAssignmentList(data.assignments || []);
      setTugasList(data.tugasList || []);
      setPengumpulanList(data.pengumpulanList || []);
      setNilaiManualList(data.nilaiManualList || []);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  // Load data when user logs in
  useEffect(() => {
    if (currentUser) refreshData();
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Auth ────────────────────────────────────────────────────────────────
  const login = useCallback(async (identifier: string, pin: string) => {
    try {
      const result = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, pin }),
      });

      if (result.needsSetupPin) {
        return { needsSetupPin: true, userId: result.userId, nama: result.nama };
      }

      const user: CurrentUser = result.user;
      setCurrentUser(user);
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return { user };
    } catch (err: any) {
      return { error: err.message };
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(SESSION_KEY);
    setUsersList([]);
    setKelasList([]);
    setMapelList([]);
    setAssignmentList([]);
    setTugasList([]);
    setPengumpulanList([]);
    setNilaiManualList([]);
  }, []);

  const setupPin = useCallback(async (userId: string, pin: string) => {
    try {
      await apiFetch("/api/auth/setup-pin", { method: "POST", body: JSON.stringify({ userId, pin }) });
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  }, []);

  // ─── Tugas ───────────────────────────────────────────────────────────────
  const createTugas = useCallback(async (data: Omit<Tugas, "id" | "createdAt">) => {
    const result = await apiFetch("/api/guru/tugas", { method: "POST", body: JSON.stringify(data) });
    await refreshData();
    return result;
  }, [refreshData]);

  const deleteTugas = useCallback(async (id: string) => {
    await apiFetch(`/api/guru/tugas?id=${id}`, { method: "DELETE" });
    setTugasList((prev) => prev.filter((t) => t.id !== id));
    setPengumpulanList((prev) => prev.filter((p) => p.tugasId !== id));
  }, []);

  // ─── Pengumpulan ─────────────────────────────────────────────────────────
  const submitTugas = useCallback(async (data: Omit<Pengumpulan, "id" | "status" | "waktuSubmit" | "muridId"> & { muridId?: string }) => {
    const payload = {
      ...data,
      muridId: data.muridId || currentUser?.id || "",
    };
    const result = await apiFetch("/api/tugas/submit", { method: "POST", body: JSON.stringify(payload) });
    await refreshData();
    return result;
  }, [currentUser, refreshData]);

  const inputNilai = useCallback(async (pengumpulanId: string, nilai: number, catatan: string, guruId: string) => {
    await apiFetch("/api/guru/nilai", { method: "POST", body: JSON.stringify({ pengumpulanId, nilai, catatan, guruId }) });
    setPengumpulanList((prev) =>
      prev.map((p) =>
        p.id === pengumpulanId
          ? { ...p, nilai, catatanGuru: catatan, status: "dinilai" as StatusPengumpulan, dinilaiOleh: guruId, waktuNilai: new Date().toISOString() }
          : p
      )
    );
  }, []);

  const nilaiTugas = useCallback(async (pengumpulanId: string, nilai: number, catatan: string = "") => {
    await inputNilai(pengumpulanId, nilai, catatan, currentUser?.id || "");
  }, [inputNilai, currentUser]);

  const tolakTugas = useCallback(async (pengumpulanId: string, alasan: string) => {
    await apiFetch("/api/guru/tolak", { method: "POST", body: JSON.stringify({ pengumpulanId, alasan }) });
    setPengumpulanList((prev) =>
      prev.map((p) =>
        p.id === pengumpulanId
          ? { ...p, status: "ditolak" as StatusPengumpulan, alasanTolak: alasan, waktuTolak: new Date().toISOString(), nilai: undefined, catatanGuru: undefined }
          : p
      )
    );
  }, []);

  const deletePengumpulan = useCallback(async (id: string) => {
    await apiFetch(`/api/guru/pengumpulan?id=${id}`, { method: "DELETE" });
    setPengumpulanList((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // ─── Nilai Manual ────────────────────────────────────────────────────────
  const inputNilaiManualBatch = useCallback(async (data: any) => {
    const payload = {
      guruId: data.guruId || currentUser?.id || "",
      kelasId: data.kelasId,
      mapelId: data.mapelId,
      judul: data.judul || data.judulTugas || "Tugas Offline",
      tanggalPenilaian: data.tanggalPenilaian || new Date().toISOString().split("T")[0],
      scores: data.scores || (data.nilaiList || []).map((n: any) => ({
        murid_id: n.muridId || n.murid_id,
        nilai: n.nilai,
        catatan: n.catatan,
      })),
    };
    const result = await apiFetch("/api/guru/nilai-manual", { method: "POST", body: JSON.stringify(payload) });
    setNilaiManualList((prev) => [result.nilaiManual, ...prev]);
  }, [currentUser]);

  // ─── Admin: Users ────────────────────────────────────────────────────────
  const addUser = useCallback(async (data: Omit<User, "id"> & { pin?: string }) => {
    await apiFetch("/api/admin/users", { method: "POST", body: JSON.stringify(data) });
    await refreshData();
  }, [refreshData]);

  const updateUser = useCallback(async (idOrData: any, dataParam?: any) => {
    const payload = typeof idOrData === "string" ? { ...dataParam, id: idOrData } : idOrData;
    await apiFetch("/api/admin/users", { method: "PUT", body: JSON.stringify(payload) });
    await refreshData();
  }, [refreshData]);

  const deleteUser = useCallback(async (id: string) => {
    await apiFetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    setUsersList((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const bulkImportUsers = useCallback(async (users: any[]) => {
    const result = await apiFetch("/api/admin/users/bulk", { method: "POST", body: JSON.stringify({ users }) });
    await refreshData();
    return { inserted: result.inserted };
  }, [refreshData]);

  const importUsersBatch = useCallback(async (users: any[]) => {
    return bulkImportUsers(users);
  }, [bulkImportUsers]);

  const gantiPinUser = useCallback(async (userId: string, newPin: string) => {
    await apiFetch("/api/admin/users/ganti-pin", {
      method: "POST",
      body: JSON.stringify({ userId, newPin }),
    });
  }, []);

  // ─── Admin: Kelas ────────────────────────────────────────────────────────
  const addKelas = useCallback(async (dataOrNama: any, jenjang?: number, waliId?: string) => {
    const payload = typeof dataOrNama === "string"
      ? { nama: dataOrNama, jenjang: jenjang || 1, waliId }
      : dataOrNama;
    await apiFetch("/api/admin/kelas", { method: "POST", body: JSON.stringify(payload) });
    await refreshData();
  }, [refreshData]);

  const updateKelas = useCallback(async (data: Partial<Kelas> & { id: string }) => {
    await apiFetch("/api/admin/kelas", { method: "PUT", body: JSON.stringify(data) });
    await refreshData();
  }, [refreshData]);

  const deleteKelas = useCallback(async (id: string) => {
    await apiFetch(`/api/admin/kelas?id=${id}`, { method: "DELETE" });
    await refreshData();
  }, [refreshData]);

  const naikKelas = useCallback(async (
    mode: "serempak" | "manual" | "pengecualian",
    kelasAsalId: string,
    kelasTargetId: string,
    muridIds?: string[],
    pengecualianIds?: string[]
  ) => {
    const result = await apiFetch("/api/admin/naik-kelas", {
      method: "POST",
      body: JSON.stringify({ mode, kelasAsalId, kelasTargetId, muridIds, pengecualianIds }),
    });
    await refreshData();
    return { moved: result.moved };
  }, [refreshData]);

  // ─── Admin: Mapel ────────────────────────────────────────────────────────
  const addMapel = useCallback(async (data: Omit<Mapel, "id">) => {
    await apiFetch("/api/admin/mapel", { method: "POST", body: JSON.stringify(data) });
    await refreshData();
  }, [refreshData]);

  const deleteMapel = useCallback(async (id: string) => {
    await apiFetch(`/api/admin/mapel?id=${id}`, { method: "DELETE" });
    await refreshData();
  }, [refreshData]);

  // ─── Admin: Assignments ──────────────────────────────────────────────────
  const addAssignment = useCallback(async (data: Omit<Assignment, "id">) => {
    await apiFetch("/api/admin/assignments", { method: "POST", body: JSON.stringify(data) });
    await refreshData();
  }, [refreshData]);

  const deleteAssignment = useCallback(async (id: string) => {
    await apiFetch(`/api/admin/assignments?id=${id}`, { method: "DELETE" });
    setAssignmentList((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const updatePenugasanGuru = useCallback(async (guruId: string, penugasan: any[]) => {
    // Optimistic update pada usersList agar UI langsung berubah instan
    setUsersList((prev) =>
      prev.map((u) => (u.id === guruId ? { ...u, penugasan } : u))
    );
    await apiFetch("/api/admin/assignments", {
      method: "PUT",
      body: JSON.stringify({ guruId, assignments: penugasan }),
    });
    await refreshData();
  }, [refreshData]);


  const naikKelasSerempak = useCallback(async (kelasAsalId: string, kelasTargetId: string, muridTinggalIds?: string[]) => {
    if (muridTinggalIds && muridTinggalIds.length > 0) {
      return naikKelas("pengecualian", kelasAsalId, kelasTargetId, undefined, muridTinggalIds);
    }
    return naikKelas("serempak", kelasAsalId, kelasTargetId);
  }, [naikKelas]);

  const pindahKelasManual = useCallback(async (muridId: string, keKelasId: string) => {
    return naikKelas("manual", "", keKelasId, [muridId]);
  }, [naikKelas]);

  const kelulusanSiswa = useCallback(async (muridIds: string[]) => {
    for (const id of muridIds) {
      await apiFetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    }
    await refreshData();
  }, [refreshData]);

  // ─── Context Value ────────────────────────────────────────────────────────
  const value: AppContextType = {
    currentUser, isLoading, isDataLoading,
    login, logout, setupPin,
    usersList, kelasList, mapelList, assignmentList, tugasList, pengumpulanList, nilaiManualList,
    createTugas, addTugas: createTugas, deleteTugas,
    submitTugas, inputNilai, nilaiTugas, tolakTugas, deletePengumpulan,
    inputNilaiManualBatch,
    addUser, updateUser, deleteUser, bulkImportUsers, importUsersBatch, gantiPinUser,
    addKelas, updateKelas, deleteKelas, naikKelas, naikKelasSerempak, pindahKelasManual, kelulusanSiswa,
    addMapel, deleteMapel,
    addAssignment, deleteAssignment, updatePenugasanGuru,
    refreshData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
