"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Search, Shield, ShieldOff, Mail, Package, Calendar, Crown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/components/ui/Toaster";
import { getRoleColorClass } from "@/lib/roles";
import { usePolling } from "@/lib/use-polling";
import ImageWithFallback from "@/components/ImageWithFallback";
import PermissionGuard from "@/components/admin/PermissionGuard";

interface UserRoleInfo {
  id: string;
  name: string;
  type: string;
  color: string;
  discount: number;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  isAdmin: boolean;
  createdAt: string;
  roles: { role: UserRoleInfo }[];
  _count: { orders: number };
}

interface Role {
  id: string;
  name: string;
  type: string;
  color: string;
  discount: number;
}

export default function AdminCustomersPage() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [updating, setUpdating] = useState(false);

  // Polling de usuários, pedidos e cargos (30s)
  const { data: usersData, refetch: refetchUsers } = usePolling<User[]>(
    useCallback(() => fetch("/api/users").then(r => r.json()), [])
  );
  const { data: ordersData } = usePolling<any[]>(
    useCallback(() => fetch("/api/orders?admin=true").then(r => r.json()), [])
  );
  const { data: rolesData } = usePolling<Role[]>(
    useCallback(() => fetch("/api/roles").then(r => r.json()), [])
  );

  const users = Array.isArray(usersData) ? usersData : [];
  const orders = (ordersData as any)?.orders || (Array.isArray(ordersData) ? ordersData : []);
  const roles = Array.isArray(rolesData) ? rolesData : [];

  useEffect(() => {
    if (usersData !== null && ordersData !== null && rolesData !== null) {
      setLoading(false);
    }
  }, [usersData, ordersData, rolesData]);

  const toggleAdmin = async (userId: string, currentAdmin: boolean) => {
    setUpdating(true);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isAdmin: !currentAdmin }),
      });
      if (res.ok) {
        const updated = await res.json();
        refetchUsers();
        if (selectedUser?.id === userId) {
          setSelectedUser({ ...selectedUser, isAdmin: updated.isAdmin });
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao atualizar usuário");
      }
    } catch {
      alert("Erro ao atualizar usuário");
    } finally {
      setUpdating(false);
    }
  };

  const changeRole = async (userId: string, roleIds: string[]) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleIds }),
      });
      if (res.ok) {
        const data = await res.json();
        refetchUsers();
        const names = data.roles.map((r: any) => r.name).join(", ");
        toast.success(names ? `Cargos atualizados: ${names}` : "Cargos atualizados");
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao alterar cargos");
      }
    } catch {
      toast.error("Erro ao alterar cargos");
    } finally {
      setUpdating(false);
    }
  };

  const toggleRole = (userId: string, roleId: string, currentRoleIds: string[]) => {
    const newRoleIds = currentRoleIds.includes(roleId)
      ? currentRoleIds.filter((id) => id !== roleId)
      : [...currentRoleIds, roleId];
    changeRole(userId, newRoleIds);
  };

  const filteredUsers = useMemo(() => users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [users, searchTerm]);

  const userOrderMap = useMemo(() => {
    const map = new Map<string, any[]>();
    orders.forEach((o: any) => {
      const arr = map.get(o.userId) || [];
      arr.push(o);
      map.set(o.userId, arr);
    });
    return map;
  }, [orders]);

  const getUserOrders = useCallback((userId: string) => userOrderMap.get(userId) || [], [userOrderMap]);
  const getUserRevenue = useCallback((userId: string) =>
    (userOrderMap.get(userId) || [])
      .filter((o: any) => o.status === "PAID")
      .reduce((sum: number, o: any) => sum + o.total, 0),
    [userOrderMap]
  );

  if (loading) {
    return (
      <PermissionGuard permission="customers.view">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Carregando...</div>
        </div>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard permission="customers.view">
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
        <p className="mt-2 text-gray-600">{users.length} clientes cadastrados</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Pedidos</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Total Gasto</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Cadastrado em</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tipo</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map((user) => {
                const userOrders = getUserOrders(user.id);
                const userRevenue = getUserRevenue(user.id);
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <ImageWithFallback src={user.image ?? ""} alt="" width={40} height={40} className="rounded-full" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-600 font-medium">
                            {(user.name || user.email || "?").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{user.name || "Sem nome"}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{userOrders.length}</span>
                      <span className="text-sm text-gray-500 ml-1">pedidos</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {formatCurrency(userRevenue)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-6 py-4">
                      {user.isAdmin ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                          <Shield className="h-3 w-3" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                          Cliente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="rounded-lg border px-3 py-1 text-sm text-blue-600 hover:bg-blue-50"
                      >
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Detalhes do Cliente</h2>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="mb-6 flex items-center gap-4">
              {selectedUser.image ? (
                <ImageWithFallback src={selectedUser.image ?? ""} alt="" width={64} height={64} className="rounded-full" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xl font-medium">
                  {(selectedUser.name || selectedUser.email || "?").charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-lg font-medium text-gray-900">{selectedUser.name || "Sem nome"}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Mail className="h-4 w-4" /> {selectedUser.email}
                </p>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <Calendar className="h-4 w-4" /> Desde {new Date(selectedUser.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <Package className="mx-auto h-5 w-5 text-gray-400 mb-1" />
                <p className="text-2xl font-bold text-gray-900">{getUserOrders(selectedUser.id).length}</p>
                <p className="text-xs text-gray-500">Pedidos</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{formatCurrency(getUserRevenue(selectedUser.id))}</p>
                <p className="text-xs text-gray-500">Total Gasto</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {getUserOrders(selectedUser.id).filter((o: any) => o.status === "PAID").length}
                </p>
                <p className="text-xs text-gray-500">Pagos</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="mb-3 font-semibold text-gray-900">Pedidos do Cliente</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {getUserOrders(selectedUser.id).length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum pedido</p>
                ) : (
                  getUserOrders(selectedUser.id).map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">#{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString("pt-BR")} · {order.paymentMethod.toUpperCase()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(order.total)}</p>
                        <span className={`text-xs ${
                          order.status === "PAID" ? "text-green-600" :
                          order.status === "PENDING" ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium text-gray-900">Acesso de Administrador</p>
                <p className="text-sm text-gray-500">
                  {selectedUser.isAdmin ? "Tem acesso total ao painel" : "Acesso apenas como cliente"}
                </p>
              </div>
              <button
                onClick={() => toggleAdmin(selectedUser.id, selectedUser.isAdmin)}
                disabled={updating}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  selectedUser.isAdmin
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "bg-purple-50 text-purple-600 hover:bg-purple-100"
                } disabled:opacity-50`}
              >
                {selectedUser.isAdmin ? (
                  <><ShieldOff className="h-4 w-4" /> Remover Admin</>
                ) : (
                  <><Shield className="h-4 w-4" /> Tornar Admin</>
                )}
              </button>
            </div>

            {/* Seletor de Cargos (múltiplos) */}
            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center gap-2">
                <Crown className="h-5 w-5 text-brand-600" />
                <p className="font-medium text-gray-900">Cargos do Usuário</p>
              </div>

              {/* Badges dos cargos atuais */}
              {selectedUser.roles.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {selectedUser.roles.map(({ role }) => (
                    <span
                      key={role.id}
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        getRoleColorClass(role.color).badge
                      }`}
                    >
                      {role.name}
                      {role.discount > 0 && (
                        <span className="ml-1 text-[10px] opacity-75">
                          ({role.discount}%)
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              )}

              {/* Checkboxes para selecionar múltiplos cargos */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {roles.map((role) => {
                  const isSelected = selectedUser.roles.some((ur) => ur.role.id === role.id);
                  return (
                    <label
                      key={role.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all ${
                        isSelected
                          ? getRoleColorClass(role.color).badge
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      } ${updating ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() =>
                          toggleRole(
                            selectedUser.id,
                            role.id,
                            selectedUser.roles.map((ur) => ur.role.id)
                          )
                        }
                        disabled={updating}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span>
                        {role.name}
                        {role.discount > 0 && (
                          <span className="ml-1 text-[10px] opacity-75">
                            ({role.discount}%)
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PermissionGuard>
  );
}
