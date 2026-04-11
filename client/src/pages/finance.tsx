import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign, Settings, Plus, Search, Flag, CheckCircle, Clock, AlertTriangle,
  ChevronDown, Building2, Calendar, RefreshCw
} from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  partial: "bg-blue-100 text-blue-700",
  unpaid: "bg-amber-100 text-amber-700",
  flagged: "bg-red-100 text-red-700",
};

function generatePeriodOptions(billingPeriod: "month" | "quarter"): { label: string; value: string }[] {
  const now = new Date();
  const options = [];
  if (billingPeriod === "month") {
    for (let i = -2; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("default", { month: "long", year: "numeric" });
      options.push({ label, value });
    }
  } else {
    const currentQ = Math.floor(now.getMonth() / 3) + 1;
    for (let i = -1; i <= 3; i++) {
      let q = currentQ + i;
      let y = now.getFullYear();
      while (q > 4) { q -= 4; y++; }
      while (q < 1) { q += 4; y--; }
      const value = `${y}-Q${q}`;
      options.push({ label: value, value });
    }
  }
  return options;
}

function getDueDateForPeriod(periodLabel: string, billingPeriod: string): string {
  if (billingPeriod === "month") {
    const [y, m] = periodLabel.split("-").map(Number);
    // Last day of month
    const last = new Date(y, m, 0);
    return last.toISOString().split("T")[0];
  } else {
    const [y, q] = periodLabel.split("-Q").map(Number);
    const lastMonth = q * 3;
    const last = new Date(y, lastMonth, 0);
    return last.toISOString().split("T")[0];
  }
}

export default function FinancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isSuperAdmin = (user as any)?.role === "superadmin";
  const [selectedCampus, setSelectedCampus] = useState<string>("all");
  const [billingPeriod, setBillingPeriod] = useState<"month" | "quarter">("month");
  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [feeForm, setFeeForm] = useState({ baseFee: "", billingPeriod: "month", effectiveFrom: new Date().toISOString().split("T")[0] });
  const [payForm, setPayForm] = useState({ amountPaid: "", status: "paid", notes: "", paidDate: new Date().toISOString().split("T")[0] });

  const campusParam = selectedCampus !== "all" ? `campusId=${selectedCampus}` : "";

  const { data: campuses } = useQuery<any[]>({ queryKey: ["/api/campuses"] });

  const { data: feeConfigs } = useQuery<any[]>({
    queryKey: ["/api/finance/fee-config", selectedCampus],
    queryFn: () => fetch(`/api/finance/fee-config${campusParam ? `?${campusParam}` : ""}`).then(r => r.json()),
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery<any[]>({
    queryKey: ["/api/finance/payments", selectedCampus, selectedPeriod],
    queryFn: () => {
      const params = new URLSearchParams();
      if (campusParam) params.set("campusId", selectedCampus);
      if (selectedPeriod) params.set("periodLabel", selectedPeriod);
      return fetch(`/api/finance/payments?${params}`).then(r => r.json());
    },
  });

  const createFeeConfig = useMutation({
    mutationFn: (data: any) =>
      fetch(`/api/finance/fee-config`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/fee-config"] });
      setShowFeeModal(false);
      toast({ title: "Fee configuration saved" });
    },
    onError: () => toast({ title: "Failed to save fee config", variant: "destructive" }),
  });

  const generatePeriod = useMutation({
    mutationFn: (data: any) =>
      fetch(`/api/finance/generate-period`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/payments"] });
      toast({ title: `Generated ${data.created} payment record(s) for ${selectedPeriod}` });
    },
    onError: () => toast({ title: "Failed to generate records", variant: "destructive" }),
  });

  const updatePayment = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      fetch(`/api/finance/payments/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/finance/payments"] });
      setShowPayModal(false);
      toast({ title: "Payment updated" });
    },
    onError: () => toast({ title: "Failed to update payment", variant: "destructive" }),
  });

  const activeConfig = feeConfigs?.[0];
  const periodOptions = generatePeriodOptions(billingPeriod);

  const filtered = (payments ?? []).filter(p => {
    const matchSearch = !search || p.studentName?.toLowerCase().includes(search.toLowerCase()) || p.studentNumber?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function openPayModal(payment: any) {
    setSelectedPayment(payment);
    setPayForm({ amountPaid: String(payment.amountPaid ?? 0), status: payment.status, notes: payment.notes ?? "", paidDate: payment.paidDate ?? new Date().toISOString().split("T")[0] });
    setShowPayModal(true);
  }

  function handleGeneratePeriod() {
    if (!activeConfig) {
      toast({ title: "Set a fee configuration first", variant: "destructive" });
      return;
    }
    generatePeriod.mutate({
      periodLabel: selectedPeriod,
      billingPeriod,
      dueDate: getDueDateForPeriod(selectedPeriod, billingPeriod),
      campusId: selectedCampus !== "all" ? parseInt(selectedCampus) : undefined,
    });
  }

  function handleSaveFeeConfig() {
    createFeeConfig.mutate({
      baseFee: parseFloat(feeForm.baseFee),
      billingPeriod: feeForm.billingPeriod,
      effectiveFrom: feeForm.effectiveFrom,
      campusId: selectedCampus !== "all" ? parseInt(selectedCampus) : undefined,
    });
  }

  function handleSavePayment() {
    if (!selectedPayment) return;
    updatePayment.mutate({
      id: selectedPayment.id,
      data: {
        amountPaid: parseFloat(payForm.amountPaid) || 0,
        status: payForm.status,
        notes: payForm.notes,
        paidDate: payForm.status === "paid" || payForm.status === "partial" ? payForm.paidDate : null,
      },
    });
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-auto">
        <TopBar title="Finance" subtitle="Billing, payments, and fee management" />
        <div className="p-6 space-y-6">

          {/* Top controls bar */}
          <div className="flex flex-wrap items-center gap-3">
            {isSuperAdmin && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                <Select value={selectedCampus} onValueChange={setSelectedCampus}>
                  <SelectTrigger className="w-44">
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

            {/* Billing period toggle */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              {(["month", "quarter"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => {
                    setBillingPeriod(p);
                    const now = new Date();
                    if (p === "month") {
                      setSelectedPeriod(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
                    } else {
                      const q = Math.floor(now.getMonth() / 3) + 1;
                      setSelectedPeriod(`${now.getFullYear()}-Q${q}`);
                    }
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${billingPeriod === p ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-900"}`}
                >
                  {p === "month" ? "Monthly" : "Quarterly"}
                </button>
              ))}
            </div>

            {/* Period selector */}
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFeeModal(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Fee Config
              </Button>
              <Button size="sm" onClick={handleGeneratePeriod} disabled={generatePeriod.isPending}>
                <RefreshCw className={`h-4 w-4 mr-2 ${generatePeriod.isPending ? "animate-spin" : ""}`} />
                Generate Period
              </Button>
            </div>
          </div>

          {/* Active fee banner */}
          {activeConfig ? (
            <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-primary" />
              <p className="text-sm text-slate-700">
                Active fee: <strong className="text-primary">R{activeConfig.baseFee.toFixed(2)}</strong>
                <span className="text-slate-400 mx-1">·</span>
                <span className="capitalize">{activeConfig.billingPeriod}</span>
                <span className="text-slate-400 mx-1">·</span>
                Effective {activeConfig.effectiveFrom}
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <p className="text-sm text-amber-800">No fee configuration found. Click <strong>Fee Config</strong> to set one.</p>
            </div>
          )}

          {/* Payments table */}
          <Card className="border border-slate-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Payments — {selectedPeriod}
                  <span className="ml-2 text-slate-400 font-normal text-sm">({filtered.length} records)</span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search student..."
                      className="pl-9 w-52 h-8 text-sm"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36 h-8 text-sm">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="flagged">Flagged</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {paymentsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No payment records for this period.</p>
                  <p className="text-xs mt-1">Click <strong>Generate Period</strong> to create records for all active students.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Student #</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Due</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Amount Due</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Amount Paid</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Notes</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wide">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map((p: any) => (
                        <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${p.status === "flagged" ? "bg-red-50/40" : ""}`}>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{p.studentName}</td>
                          <td className="px-4 py-3 text-xs font-mono text-slate-500">{p.studentNumber}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{p.dueDate}</td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">R{p.amountDue.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">R{(p.amountPaid ?? 0).toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <Badge className={STATUS_STYLES[p.status] ?? "bg-slate-100 text-slate-600"}>
                              {p.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400 max-w-[140px] truncate">{p.notes || "—"}</td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openPayModal(p)}>
                              Update
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment history tab for individual student — future extension point */}

        </div>
      </main>

      {/* Fee Config Modal */}
      <Dialog open={showFeeModal} onOpenChange={setShowFeeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Base Fee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Base Fee (R)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 500.00"
                value={feeForm.baseFee}
                onChange={e => setFeeForm(f => ({ ...f, baseFee: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Billing Period</Label>
              <div className="flex gap-2">
                {(["month", "quarter"] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFeeForm(f => ({ ...f, billingPeriod: p }))}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${feeForm.billingPeriod === p ? "border-primary bg-primary/5 text-primary" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                  >
                    {p === "month" ? "Monthly" : "Quarterly"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Effective From</Label>
              <Input
                type="date"
                value={feeForm.effectiveFrom}
                onChange={e => setFeeForm(f => ({ ...f, effectiveFrom: e.target.value }))}
              />
            </div>
            {feeConfigs && feeConfigs.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500">
                <p className="font-medium text-slate-600 mb-1">Previous configs</p>
                {feeConfigs.slice(0, 3).map((c: any) => (
                  <p key={c.id}>R{c.baseFee.toFixed(2)} / {c.billingPeriod} — from {c.effectiveFrom}</p>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeeModal(false)}>Cancel</Button>
            <Button onClick={handleSaveFeeConfig} disabled={!feeForm.baseFee || createFeeConfig.isPending}>
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Payment Modal */}
      <Dialog open={showPayModal} onOpenChange={setShowPayModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Payment</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm font-semibold text-slate-900">{selectedPayment.studentName}</p>
                <p className="text-xs text-slate-500">{selectedPayment.studentNumber} · {selectedPayment.periodLabel}</p>
                <p className="text-xs text-slate-500">Amount due: <strong>R{selectedPayment.amountDue?.toFixed(2)}</strong></p>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["paid", "partial", "unpaid", "flagged"] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPayForm(f => ({ ...f, status: s }))}
                      className={`py-2 rounded-lg border text-sm font-medium capitalize transition-all ${payForm.status === s ? "border-primary bg-primary/5 text-primary" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                    >
                      {s === "flagged" && <Flag className="h-3 w-3 inline mr-1 text-red-500" />}
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Amount Paid (R)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={payForm.amountPaid}
                  onChange={e => setPayForm(f => ({ ...f, amountPaid: e.target.value }))}
                />
              </div>
              {(payForm.status === "paid" || payForm.status === "partial") && (
                <div className="space-y-1.5">
                  <Label>Payment Date</Label>
                  <Input
                    type="date"
                    value={payForm.paidDate}
                    onChange={e => setPayForm(f => ({ ...f, paidDate: e.target.value }))}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input
                  placeholder="Optional note..."
                  value={payForm.notes}
                  onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayModal(false)}>Cancel</Button>
            <Button onClick={handleSavePayment} disabled={updatePayment.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
