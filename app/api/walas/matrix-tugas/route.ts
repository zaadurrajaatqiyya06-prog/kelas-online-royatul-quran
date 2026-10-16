import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/walas/matrix-tugas?kelasId=xxx&date=YYYY-MM-DD&mapelIds=xxx,yyy
// Menghasilkan matrix cek pengumpulan tugas santri per kelas & tanggal secara realtime
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const kelasId = searchParams.get("kelasId");
    const dateParam = searchParams.get("date"); // Format YYYY-MM-DD
    const mapelFilterParam = searchParams.get("mapelIds"); // Komma-separated

    if (!kelasId) {
      return NextResponse.json({ error: "Parameter kelasId wajib diisi." }, { status: 400 });
    }

    // Tentukan tanggal target (Default: hari ini WIB)
    const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
    const targetDate = dateParam || todayStr;

    // Helper: ubah nama kelas menjadi slug URL (cth: "Kelas 6" → "kelas-6")
    const namaToSlug = (nama: string) => nama.toLowerCase().replace(/\s+/g, "-");

    // UUID pattern check
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // 1. Ambil data Kelas — bisa lewat UUID langsung ATAU slug nama (cth: "kelas-6")
    let kelasData: { id: string; nama: string } | null = null;
    if (uuidPattern.test(kelasId)) {
      // UUID → langsung query by id
      const { data, error } = await supabase
        .from("kelas")
        .select("id, nama")
        .eq("id", kelasId)
        .single();
      if (!error) kelasData = data;
    } else {
      // Slug → fetch semua kelas, cari yang slugnya cocok
      const { data: allKelas } = await supabase.from("kelas").select("id, nama");
      const match = (allKelas || []).find((k: any) => namaToSlug(k.nama) === kelasId.toLowerCase());
      if (match) kelasData = match;
    }

    if (!kelasData) {
      return NextResponse.json({ error: "Kelas tidak ditemukan." }, { status: 404 });
    }

    // Gunakan ID kelas yang sudah di-resolve
    const resolvedKelasId = kelasData.id;

    // 2. Ambil seluruh santri di kelas ini (diurutkan alfabet nama)
    const { data: students, error: studentsErr } = await supabase
      .from("users")
      .select("id, nama, nis, foto_url")
      .eq("role", "murid")
      .eq("kelas_id", resolvedKelasId)
      .order("nama", { ascending: true });

    if (studentsErr) throw studentsErr;

    // 3. Ambil semua tugas untuk kelas ini
    // Kriteria: Selagi batas waktu pengumpulan suatu mapel masih ada di hari itu (masih aktif)
    // yaitu: created_at <= endOfDay dan deadline >= startOfDay
    const startOfDay = `${targetDate}T00:00:00`;
    const endOfDay = `${targetDate}T23:59:59.999Z`;

    let query = supabase
      .from("tugas")
      .select(`
        id, judul, jenis, deadline, created_at,
        mapel_id,
        mapel:mapel_id (id, nama, kode)
      `)
      .eq("kelas_id", resolvedKelasId)
      .lte("created_at", endOfDay)
      .gte("deadline", startOfDay)
      .order("created_at", { ascending: true });

    const { data: rawTasks, error: tasksErr } = await query;
    if (tasksErr) throw tasksErr;

    // Ambil seluruh tugas di kelas ini untuk menghasilkan daftar tanggal aktif tugas
    const { data: allClassTasks } = await supabase
      .from("tugas")
      .select("id, created_at, deadline")
      .eq("kelas_id", resolvedKelasId)
      .order("created_at", { ascending: false });

    const activeDatesSet = new Set<string>();
    activeDatesSet.add(todayStr); // selalu sertakan hari ini
    (allClassTasks || []).forEach((t: any) => {
      try {
        const start = new Date(t.created_at);
        const end = new Date(t.deadline);
        const cur = new Date(start);
        cur.setHours(0, 0, 0, 0);
        const endLimit = new Date(end);
        endLimit.setHours(23, 59, 59, 999);

        let count = 0;
        while (cur <= endLimit && count < 30) {
          const dStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(cur);
          activeDatesSet.add(dStr);
          cur.setDate(cur.getDate() + 1);
          count++;
        }
      } catch (e) {
        // ignore format error
      }
    });

    const activeDatesList = Array.from(activeDatesSet).sort().reverse();

    // Filter mapel jika diminta
    let selectedMapelIds: string[] = [];
    if (mapelFilterParam) {
      selectedMapelIds = mapelFilterParam.split(",").map((s) => s.trim()).filter(Boolean);
    }

    const filteredTasks = (rawTasks || []).filter((t: any) => {
      if (selectedMapelIds.length === 0) return true;
      return selectedMapelIds.includes(t.mapel_id);
    });

    const taskIds = filteredTasks.map((t: any) => t.id);

    // 4. Ambil seluruh pengumpulan untuk tugas-tugas ini
    let submissions: any[] = [];
    if (taskIds.length > 0) {
      const { data: subsData, error: subsErr } = await supabase
        .from("pengumpulan")
        .select(`
          id, tugas_id, murid_id, status, nilai, auto_nilai,
          file_name, gdrive_file_url, waktu_submit
        `)
        .in("tugas_id", taskIds);

      if (subsErr) throw subsErr;
      submissions = subsData || [];
    }

    // Buat lookup map: `${tugasId}_${muridId}` -> submission
    const subMap = new Map<string, any>();
    submissions.forEach((s) => {
      subMap.set(`${s.tugas_id}_${s.murid_id}`, s);
    });

    // 5. Susun format matrix santri
    const matrixStudents = (students || []).map((student) => {
      const taskResults: Record<string, {
        submitted: boolean;
        status: string;
        nilai?: number | null;
        waktuSubmit?: string | null;
        fileUrl?: string | null;
      }> = {};

      let completedCount = 0;

      filteredTasks.forEach((task: any) => {
        const sub = subMap.get(`${task.id}_${student.id}`);
        const isDone = !!sub && (sub.status === "sudah" || sub.status === "dinilai");
        if (isDone) completedCount++;

        taskResults[task.id] = {
          submitted: isDone,
          status: sub ? sub.status : "belum",
          nilai: sub?.nilai ?? sub?.auto_nilai ?? null,
          waktuSubmit: sub?.waktu_submit || null,
          fileUrl: sub?.gdrive_file_url || null,
        };
      });

      const totalTasks = filteredTasks.length;
      const isAllCompleted = totalTasks > 0 && completedCount === totalTasks;
      const isNoneCompleted = totalTasks > 0 && completedCount === 0;

      return {
        id: student.id,
        nama: student.nama,
        nis: student.nis,
        fotoUrl: student.foto_url,
        taskResults,
        completedCount,
        totalTasks,
        isAllCompleted,
        isNoneCompleted,
      };
    });

    // Ringkasan statistik
    const totalStudents = matrixStudents.length;
    const allCompletedCount = matrixStudents.filter((s) => s.isAllCompleted).length;
    const noneCompletedCount = matrixStudents.filter((s) => s.isNoneCompleted).length;
    const partialCount = totalStudents - allCompletedCount - noneCompletedCount;

    // Ambil daftar unik mapel yang tersedia pada hari tersebut untuk filter UI
    const availableMapels = Array.from(
      new Map(
        (rawTasks || []).map((t: any) => [
          t.mapel?.id,
          { id: t.mapel?.id, nama: t.mapel?.nama, kode: t.mapel?.kode },
        ])
      ).values()
    ).filter((m) => !!m.id);

    return NextResponse.json({
      kelas: kelasData,
      targetDate,
      activeDates: activeDatesList,
      availableMapels,
      tasks: filteredTasks.map((t: any) => ({
        id: t.id,
        judul: t.judul,
        jenis: t.jenis,
        deadline: t.deadline,
        mapelId: t.mapel_id,
        mapelNama: t.mapel?.nama || "Mapel",
        mapelKode: t.mapel?.kode || "",
      })),
      students: matrixStudents,
      summary: {
        totalStudents,
        totalTasks: filteredTasks.length,
        allCompletedCount,
        noneCompletedCount,
        partialCount,
      },
    }, { status: 200 });

  } catch (err: any) {
    console.error("[api/walas/matrix-tugas GET]", err);
    return NextResponse.json({ error: "Gagal memuat matrix pengumpulan tugas." }, { status: 500 });
  }
}
