import { prisma } from "@/lib/db";

const ONLINE_THRESHOLD_MINUTES = 5;

export const revalidate = 0;

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return `há ${days} d`;
}

export default async function LogsPage() {
  const [users, logs] = await Promise.all([
    prisma.user.findMany({
      include: {
        roles: { include: { role: true } },
        activities: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { name: "asc" },
    }),
    prisma.activityLog.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const isOnline = (lastActivity?: Date) => {
    if (!lastActivity) return false;
    const diff = (Date.now() - new Date(lastActivity).getTime()) / 1000 / 60;
    return diff < ONLINE_THRESHOLD_MINUTES;
  };

  return (
    <div className="min-h-screen space-y-8 p-6">
      <h1 className="text-3xl font-bold text-slate-100">Atividades no Site</h1>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="mb-4 text-xl font-semibold text-slate-100">Usuários</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => {
            const last = u.activities[0];
            const online = isOnline(last?.createdAt);
            return (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-4"
              >
                <div>
                  <p className="font-medium text-slate-100">{u.name || u.email || "Anônimo"}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                  {last && (
                    <p className="mt-1 text-xs text-slate-500">
                      {last.path} · {timeAgo(last.createdAt)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`h-3 w-3 rounded-full ${online ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-slate-600"}`}
                    title={online ? "Online" : "Offline"}
                  />
                  <span className="text-[10px] text-slate-500">{online ? "online" : "offline"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="mb-4 text-xl font-semibold text-slate-100">Últimas Ações</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="pb-3 pr-4">Usuário</th>
                <th className="pb-3 pr-4">Ação</th>
                <th className="pb-3 pr-4">Página</th>
                <th className="pb-3 pr-4">IP</th>
                <th className="pb-3 pr-4">Quando</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="py-3 pr-4 text-slate-100">{log.user?.name || log.user?.email || "Anônimo"}</td>
                  <td className="py-3 pr-4 text-slate-300">{log.action}</td>
                  <td className="py-3 pr-4 text-slate-300">{log.path || "-"}</td>
                  <td className="py-3 pr-4 text-slate-500">{log.ip || "-"}</td>
                  <td className="py-3 pr-4 text-slate-500">{timeAgo(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
