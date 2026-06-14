import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getNotifications, markAllAsRead, markAsRead } from "@/features/notifications/actions";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  
  const organizationId = (session.user as any).selectedTenantId;
  if (!organizationId) redirect("/select-tenant");

  const notifications = await getNotifications();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <PageHeader title="Notificaciones" description="Tus alertas y recordatorios recientes." />
        <form action={markAllAsRead}>
          <button type="submit" className="text-xs uppercase font-bold tracking-wider text-slate-500 hover:text-indigo-600 bg-slate-100 px-4 py-2 rounded-none">
            Marcar todas como leídas
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-2">
        {notifications.length === 0 ? (
          <div className="text-center p-8 bg-white border border-slate-200 text-slate-500 font-medium rounded-none shadow-sm">
            No tienes notificaciones por el momento.
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={`flex items-center justify-between p-4 border rounded-none shadow-sm transition-colors ${n.read ? 'bg-white border-slate-200' : 'bg-indigo-50 border-indigo-200'}`}>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  {!n.read && <span className="h-2 w-2 bg-indigo-600 rounded-full inline-block"></span>}
                  <h3 className={`text-sm ${!n.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>{n.title}</h3>
                </div>
                <p className="text-sm text-slate-600">{n.body}</p>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                  {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex gap-4 items-center">
                {n.link && (
                  <Link href={n.link} className="text-xs font-bold text-indigo-600 uppercase hover:underline">
                    Ver detalle
                  </Link>
                )}
                {!n.read && (
                  <form action={async () => {
                    "use server";
                    await markAsRead(n.id);
                  }}>
                    <button type="submit" className="text-xs text-slate-500 hover:text-slate-800 uppercase tracking-wider font-bold p-2 bg-slate-100 hover:bg-slate-200 rounded-none transition-colors">
                      Leída
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
