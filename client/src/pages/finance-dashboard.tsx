import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Users, AlertTriangle, CheckCircle, Clock, TrendingDown, Building2 } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function FinanceDashboard() {
  const { user } = useAuth();
  const [selectedCampus, setSelectedCampus] = useState<string>("all");

  const campusParam = selectedCampus !== "all" ? `?campusId=${selectedCampus}` : "";

  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/finance/stats", selectedCampus],
    queryFn: () => fetch(`/api/finance/stats${campusParam}`).then(r => r.json()),
  });

  const { data: campuses } = useQuery<any[]>({
    queryKey: ["/api/campuses"],
  });

  const { data: recentPayments } = useQuery<any[]>({
    queryKey: ["/api/finance/payments", selectedCampus],
    queryFn: () => fetch(`/api/finance/payments${campusParam}`).then(r => r.json()),
  });

  const { data: feeConfigs } = useQuery<any[]>({
    queryKey: ["/api/finance/fee-config", selectedCampus],
    queryFn: () => fetch(`/api/finance/fee-config${campusParam}`).then(r => r.json()),
  });

  const activeConfig = feeConfigs?.[0];
  const isSuperAdmin = (user as any)?.role === "superadmin";

  const statCards = [
    {
      label: "Total Paid",
      value: stats?.paid ?? 0,
      sub: `of ${stats?.total ?? 0} records`,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Unpaid",
      value: stats?.unpaid ?? 0,
      sub: "awaiting payment",
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Partial",
      value: stats?.partial ?? 0,
      sub: "partial payments",
      icon: TrendingDown,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Flagged",
      value: stats?.flagged ?? 0,
      sub: "need attention",
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  const recentFlagged = recentPayments?.filter(p => p.status === "flagged" || p.status === "unpaid").slice(0, 8) ?? [];

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-auto">
        <TopBar title="Finance Dashboard" subtitle="Payment tracking and revenue overview" />
        <div className="p-6 space-y-6">

          {/* Campus filter — superadmin only */}
          {isSuperAdmin && (
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-slate-500" />
              <span className="text-sm text-slate-600 font-medium">Campus:</span>
              <Select value={selectedCampus} onValueChange={setSelectedCampus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All campuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campuses</SelectItem>
                  {campuses?.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Active fee config banner */}
          {activeConfig && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Current Base Fee: <span className="text-primary">R{activeConfig.baseFee.toFixed(2)}</span>
                    <span className="ml-2 text-slate-500">/ {activeConfig.billingPeriod}</span>
                  </p>
                  <p className="text-xs text-slate-500">Effective from {activeConfig.effectiveFrom}</p>
                </div>
              </div>
              <Link href="/finance">
                <Button variant="outline" size="sm">Manage Payments</Button>
              </Link>
            </div>
          )}
          {!activeConfig && !statsLoading && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <p className="text-sm text-amber-800">No fee configuration set. Go to <Link href="/finance"><span className="underline cursor-pointer">Finance</span></Link> to configure.</p>
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label} className="border border-slate-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{card.label}</p>
                        <p className={`text-3xl font-bold mt-1 ${card.color}`}>{statsLoading ? "—" : card.value}</p>
                        <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.bg}`}>
                        <Icon className={`h-5 w-5 ${card.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Revenue summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-900">Revenue Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Total Collected</span>
                  <span className="text-sm font-bold text-green-600">
                    R{statsLoading ? "—" : (stats?.totalRevenue ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Total Outstanding</span>
                  <span className="text-sm font-bold text-red-600">
                    R{statsLoading ? "—" : (stats?.totalOutstanding ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-slate-600">Collection Rate</span>
                  <span className="text-sm font-bold text-slate-900">
                    {statsLoading || !stats?.total
                      ? "—"
                      : `${Math.round((stats.paid / stats.total) * 100)}%`}
                  </span>
                </div>
                {/* Progress bar */}
                {!statsLoading && stats?.total > 0 && (
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${Math.round((stats.paid / stats.total) * 100)}%` }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Flagged / unpaid attention list */}
            <Card className="border border-slate-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-slate-900">Needs Attention</CardTitle>
                  <Link href="/finance">
                    <Button variant="ghost" size="sm" className="text-xs text-primary">View all</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentFlagged.length === 0 ? (
                  <div className="text-center py-6">
                    <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">All clear — no flagged or unpaid records</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentFlagged.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{p.studentName}</p>
                          <p className="text-xs text-slate-500">{p.periodLabel} · R{p.amountDue.toFixed(2)}</p>
                        </div>
                        <Badge
                          className={
                            p.status === "flagged"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }
                        >
                          {p.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
