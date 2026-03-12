import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TimeEntry {
  id: string;
  worker_id: string;
  entry_type: string;
  timestamp: string;
  mission_id: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { month_year } = await req.json();
    if (!month_year || !/^\d{4}-\d{2}$/.test(month_year)) {
      return new Response(JSON.stringify({ error: "month_year required (format: 2026-03)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [year, month] = month_year.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const workingDaysInMonth = countWorkingDays(year, month);

    // Fetch workers owned by this user
    const { data: workers } = await supabase
      .from("workers")
      .select("id, first_name, last_name, base_salary, position, status")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (!workers || workers.length === 0) {
      return new Response(JSON.stringify({ message: "No active workers", payrolls: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const workerIds = workers.map((w: any) => w.id);

    // Fetch time entries for the month
    const { data: entries } = await supabase
      .from("time_entries")
      .select("*")
      .in("worker_id", workerIds)
      .gte("timestamp", startDate.toISOString())
      .lte("timestamp", endDate.toISOString())
      .order("timestamp", { ascending: true });

    // Fetch missions completed by these workers
    const { data: missionsData } = await supabase
      .from("missions")
      .select("id, assigned_worker_id, assigned_team_id, salary, status")
      .in("status", ["completed", "closed"])
      .gte("updated_at", startDate.toISOString())
      .lte("updated_at", endDate.toISOString());

    // Get team memberships to attribute team missions
    const { data: teamMembers } = await supabase
      .from("team_members")
      .select("worker_id, team_id")
      .in("worker_id", workerIds);

    const teamsByWorker: Record<string, string[]> = {};
    (teamMembers || []).forEach((tm: any) => {
      if (!teamsByWorker[tm.worker_id]) teamsByWorker[tm.worker_id] = [];
      teamsByWorker[tm.worker_id].push(tm.team_id);
    });

    // Process each worker
    const payrolls = [];

    for (const worker of workers) {
      const workerEntries = (entries || []).filter((e: TimeEntry) => e.worker_id === worker.id && e.entry_type !== "photo");

      // Group entries by day
      const dayGroups: Record<string, TimeEntry[]> = {};
      workerEntries.forEach((e: TimeEntry) => {
        const day = e.timestamp.slice(0, 10);
        if (!dayGroups[day]) dayGroups[day] = [];
        dayGroups[day].push(e);
      });

      let totalMinutesWorked = 0;
      let totalBreakMinutes = 0;
      let lateCount = 0;
      const daysWorked = Object.keys(dayGroups).length;

      for (const [, dayEntries] of Object.entries(dayGroups)) {
        const sorted = dayEntries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        const arrival = sorted.find((e) => e.entry_type === "arrival");
        const departure = sorted.find((e) => e.entry_type === "departure");

        if (arrival && departure) {
          const arrTime = new Date(arrival.timestamp);
          const depTime = new Date(departure.timestamp);
          totalMinutesWorked += (depTime.getTime() - arrTime.getTime()) / 60000;

          // Check if late (arrival after 08:00)
          const arrHour = arrTime.getHours();
          const arrMin = arrTime.getMinutes();
          if (arrHour > 8 || (arrHour === 8 && arrMin > 15)) {
            lateCount++;
          }
        }

        // Calculate breaks
        let breakStart: Date | null = null;
        sorted.forEach((e) => {
          if (e.entry_type === "break_start") breakStart = new Date(e.timestamp);
          if (e.entry_type === "break_end" && breakStart) {
            totalBreakMinutes += (new Date(e.timestamp).getTime() - breakStart.getTime()) / 60000;
            breakStart = null;
          }
        });
      }

      const netMinutes = Math.max(0, totalMinutesWorked - totalBreakMinutes);
      const hoursWorked = Math.round((netMinutes / 60) * 100) / 100;

      // Missions completed by this worker
      const workerTeams = teamsByWorker[worker.id] || [];
      const completedMissions = (missionsData || []).filter((m: any) =>
        m.assigned_worker_id === worker.id ||
        (m.assigned_team_id && workerTeams.includes(m.assigned_team_id))
      );
      const missionsCompleted = completedMissions.length;

      // Mission bonus: sum of mission salaries
      const missionBonus = completedMissions.reduce((sum: number, m: any) => sum + (m.salary || 0), 0);

      // Performance bonus: 10% of base if > 90% attendance
      const attendanceRate = workingDaysInMonth > 0 ? daysWorked / workingDaysInMonth : 0;
      const performanceBonus = attendanceRate >= 0.9 ? Math.round(worker.base_salary * 0.1) : 0;

      // Penalties
      const daysAbsent = Math.max(0, workingDaysInMonth - daysWorked);
      const dailyRate = worker.base_salary / workingDaysInMonth;
      const absencePenalty = Math.round(daysAbsent * dailyRate);
      const latePenalty = lateCount * Math.round(dailyRate * 0.1); // 10% of daily rate per late

      const grossSalary = worker.base_salary + missionBonus + performanceBonus;
      const netSalary = Math.max(0, grossSalary - latePenalty - absencePenalty);

      payrolls.push({
        user_id: user.id,
        worker_id: worker.id,
        month_year,
        base_salary: worker.base_salary,
        hours_worked: hoursWorked,
        days_worked: daysWorked,
        days_absent: daysAbsent,
        late_count: lateCount,
        missions_completed: missionsCompleted,
        mission_bonus: missionBonus,
        performance_bonus: performanceBonus,
        late_penalty: latePenalty,
        absence_penalty: absencePenalty,
        gross_salary: grossSalary,
        net_salary: netSalary,
        status: "draft",
      });
    }

    // Upsert payroll records
    for (const p of payrolls) {
      const { error } = await supabase.from("payroll").upsert(p, {
        onConflict: "worker_id,month_year",
      });
      if (error) {
        console.error("Upsert error for worker", p.worker_id, error);
      }
    }

    return new Response(JSON.stringify({ success: true, count: payrolls.length, payrolls }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function countWorkingDays(year: number, month: number): number {
  let count = 0;
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, month - 1, d).getDay();
    if (day !== 0 && day !== 6) count++; // exclude weekends
  }
  return count;
}
