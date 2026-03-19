"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import type { Account, Category, FamilyMember } from "@/types/database";
import {
  deleteAccount,
  deleteCategory,
  type SettingsActionState,
  updatePreferences,
  upsertAccount,
  upsertCategory,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SubmitButton } from "@/components/submit-button";
import {
  CreditCard,
  Plus,
  Trash2,
  PenLine,
  Settings as SettingsIcon,
} from "lucide-react";

function ButtonBarTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "min-h-[44px] whitespace-nowrap rounded-md px-3 text-sm transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function formatMoney(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function SettingsClient({
  categories,
  accounts,
  members,
  myPreferences,
}: {
  categories: Category[];
  accounts: Account[];
  members: FamilyMember[];
  myPreferences: Record<string, unknown>;
}) {
  const router = useRouter();

  const tabs = [
    { key: "categories", label: "Categorias" },
    { key: "rules", label: "Regras" },
    { key: "memory", label: "Memória" },
    { key: "members", label: "Membros" },
    { key: "accounts", label: "Contas" },
    { key: "sheets", label: "Google Sheets" },
    { key: "integrations", label: "Integrações" },
  ] as const;

  type TabKey = (typeof tabs)[number]["key"];
  const [activeTab, setActiveTab] = useState<TabKey>("categories");

  // Category dialog state
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [catEditing, setCatEditing] = useState<Category | null>(null);
  const [catState, catAction] = useFormState(upsertCategory, {} as SettingsActionState);

  useEffect(() => {
    if (catState.ok) {
      setCatDialogOpen(false);
      router.refresh();
    }
  }, [catState.ok, router]);

  // Account dialog state
  const [accDialogOpen, setAccDialogOpen] = useState(false);
  const [accEditing, setAccEditing] = useState<Account | null>(null);
  const [accState, accAction] = useFormState(upsertAccount, {} as SettingsActionState);

  useEffect(() => {
    if (accState.ok) {
      setAccDialogOpen(false);
      router.refresh();
    }
  }, [accState.ok, router]);

  // Preferences (Sheets/Integrations)
  const [prefsState, prefsAction] = useFormState(updatePreferences, {} as SettingsActionState);

  useEffect(() => {
    if (prefsState.ok) router.refresh();
  }, [prefsState.ok, router]);

  const googleSheets = (myPreferences.googleSheets ?? {}) as {
    id?: string | null;
    tabs?: string[];
  };
  const integrations = (myPreferences.integrations ?? {}) as {
    telegram?: boolean;
    n8n?: boolean;
    sheets?: boolean;
  };

  const parentOptions = useMemo(() => {
    return categories.map((c) => ({
      id: c.id,
      label: `${c.icon} ${c.name}`,
    }));
  }, [categories]);

  const catFormKey = `${catDialogOpen}-${catEditing?.id ?? "new"}`;
  const accFormKey = `${accDialogOpen}-${accEditing?.id ?? "new"}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie categorias, contas e integrações.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <ButtonBarTab key={t.key} active={activeTab === t.key} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </ButtonBarTab>
        ))}
      </div>

      {activeTab === "categories" ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              <h2 className="text-lg font-semibold">Categorias</h2>
            </div>
            <Button
              className="min-h-[44px]"
              onClick={() => {
                setCatEditing(null);
                setCatDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova categoria
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Orçamento padrão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhuma categoria.
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span aria-hidden style={{ color: c.color }}>
                          {c.icon}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{c.name}</p>
                          {c.parent_id ? (
                            <p className="text-xs text-muted-foreground">Com hierarquia</p>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{c.type === "expense" ? "Despesa" : "Receita"}</TableCell>
                    <TableCell>{formatMoney(c.budget_monthly ?? null)}</TableCell>
                    <TableCell>
                      {c.is_active === false ? (
                        <Badge variant="outline" className="text-xs">
                          Inativa
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Ativa
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 min-h-[44px]"
                          aria-label="Editar categoria"
                          onClick={() => {
                            setCatEditing(c);
                            setCatDialogOpen(true);
                          }}
                        >
                          <PenLine className="h-4 w-4" />
                        </Button>
                        <form
                          action={deleteCategory}
                          onSubmit={(e) => {
                            if (!confirm("Excluir esta categoria?")) e.preventDefault();
                          }}
                        >
                          <input type="hidden" name="id" value={c.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 min-h-[44px] text-destructive"
                            aria-label="Excluir categoria"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <Dialog
            open={catDialogOpen}
            onOpenChange={(o) => {
              setCatDialogOpen(o);
              if (!o) setCatEditing(null);
            }}
          >
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md pb-[env(safe-area-inset-bottom)]">
              <DialogHeader>
                <DialogTitle>{catEditing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
              </DialogHeader>

              <form key={catFormKey} action={catAction} className="space-y-4">
                <input type="hidden" name="id" value={catEditing?.id ?? ""} />

                <div className="space-y-2">
                  <Label htmlFor="cat-name">Nome</Label>
                  <Input
                    id="cat-name"
                    name="name"
                    required
                    defaultValue={catEditing?.name ?? ""}
                    className="min-h-[44px] text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cat-type">Tipo</Label>
                  <select
                    id="cat-type"
                    name="type"
                    defaultValue={catEditing?.type ?? "expense"}
                    className="flex min-h-[44px] w-full items-center rounded-md border border-input bg-transparent px-3 py-2 text-base"
                  >
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cat-parent">Hierarquia (opcional)</Label>
                  <select
                    id="cat-parent"
                    name="parent_id"
                    defaultValue={catEditing?.parent_id ?? ""}
                    className="flex min-h-[44px] w-full items-center rounded-md border border-input bg-transparent px-3 py-2 text-base"
                  >
                    <option value="">—</option>
                    {parentOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cat-budget">Orçamento mensal padrão (opcional)</Label>
                  <Input
                    id="cat-budget"
                    name="budget_monthly"
                    type="number"
                    step="0.01"
                    min={0}
                    defaultValue={catEditing?.budget_monthly ?? ""}
                    className="min-h-[44px] text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cat-color">Cor (hex ou nome)</Label>
                  <Input
                    id="cat-color"
                    name="color"
                    defaultValue={catEditing?.color ?? "#66bb6a"}
                    className="min-h-[44px] text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cat-icon">Ícone/Emoji</Label>
                  <Input
                    id="cat-icon"
                    name="icon"
                    defaultValue={catEditing?.icon ?? "💰"}
                    className="min-h-[44px] text-base"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="is_active"
                    value="1"
                    defaultChecked={catEditing?.is_active !== false}
                    aria-label="Categoria ativa"
                  />
                  <span className="text-sm">Ativa</span>
                </div>

                {catState.error ? (
                  <p className="text-sm text-destructive">{catState.error}</p>
                ) : null}

                <SubmitButton className="w-full" pendingLabel="Salvando…">
                  Salvar
                </SubmitButton>
              </form>
            </DialogContent>
          </Dialog>
        </section>
      ) : null}

      {activeTab === "accounts" ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <h2 className="text-lg font-semibold">Contas</h2>
            </div>
            <Button
              className="min-h-[44px]"
              onClick={() => {
                setAccEditing(null);
                setAccDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova conta
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conta</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Saldo inicial</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhuma conta.
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <p className="font-medium">{a.name}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.bank ?? "—"}
                    </TableCell>
                    <TableCell>{a.type}</TableCell>
                    <TableCell>{formatMoney(a.balance)}</TableCell>
                    <TableCell>
                      {a.is_active === false ? (
                        <Badge variant="outline" className="text-xs">
                          Inativa
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Ativa
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 min-h-[44px]"
                          aria-label="Editar conta"
                          onClick={() => {
                            setAccEditing(a);
                            setAccDialogOpen(true);
                          }}
                        >
                          <PenLine className="h-4 w-4" />
                        </Button>
                        <form
                          action={deleteAccount}
                          onSubmit={(e) => {
                            if (!confirm("Excluir esta conta?")) e.preventDefault();
                          }}
                        >
                          <input type="hidden" name="id" value={a.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 min-h-[44px] text-destructive"
                            aria-label="Excluir conta"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <Dialog
            open={accDialogOpen}
            onOpenChange={(o) => {
              setAccDialogOpen(o);
              if (!o) setAccEditing(null);
            }}
          >
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md pb-[env(safe-area-inset-bottom)]">
              <DialogHeader>
                <DialogTitle>{accEditing ? "Editar conta" : "Nova conta"}</DialogTitle>
              </DialogHeader>

              <form key={accFormKey} action={accAction} className="space-y-4">
                <input type="hidden" name="id" value={accEditing?.id ?? ""} />

                <div className="space-y-2">
                  <Label htmlFor="acc-name">Nome</Label>
                  <Input
                    id="acc-name"
                    name="name"
                    required
                    defaultValue={accEditing?.name ?? ""}
                    className="min-h-[44px] text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="acc-bank">Banco (opcional)</Label>
                  <Input
                    id="acc-bank"
                    name="bank"
                    defaultValue={accEditing?.bank ?? ""}
                    className="min-h-[44px] text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="acc-type">Tipo</Label>
                  <select
                    id="acc-type"
                    name="type"
                    defaultValue={accEditing?.type ?? "checking"}
                    className="flex min-h-[44px] w-full items-center rounded-md border border-input bg-transparent px-3 py-2 text-base"
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="credit">Credit</option>
                    <option value="investment">Investment</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="acc-balance">Saldo inicial (R$)</Label>
                  <Input
                    id="acc-balance"
                    name="balance"
                    type="number"
                    step="0.01"
                    defaultValue={accEditing?.balance ?? 0}
                    className="min-h-[44px] text-base"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="is_active"
                    value="1"
                    defaultChecked={accEditing?.is_active !== false}
                    aria-label="Conta ativa"
                  />
                  <span className="text-sm">Ativa</span>
                </div>

                {accState.error ? (
                  <p className="text-sm text-destructive">{accState.error}</p>
                ) : null}

                <SubmitButton className="w-full" pendingLabel="Salvando…">
                  Salvar
                </SubmitButton>
              </form>
            </DialogContent>
          </Dialog>
        </section>
      ) : null}

      {activeTab === "sheets" ? (
        <section className="space-y-4 rounded-lg border border-border bg-card p-4">
          <div>
            <h2 className="text-lg font-semibold">Google Sheets</h2>
            <p className="text-muted-foreground">
              Configure ID da planilha e quais abas serão usadas.
            </p>
          </div>

          <form action={prefsAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sheets-id">Google Sheets ID</Label>
              <Input
                id="sheets-id"
                name="google_sheets_id"
                defaultValue={(googleSheets.id as string | null) ?? ""}
                className="min-h-[44px] text-base"
                placeholder="d/xxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sheets-tabs">Nomes das abas (separados por vírgula)</Label>
              <Input
                id="sheets-tabs"
                name="google_sheets_tabs"
                defaultValue={(googleSheets.tabs ?? []).join(", ")}
                className="min-h-[44px] text-base"
                placeholder="Entradas, Saídas"
              />
            </div>

            <div className="space-y-2">
              <Label>Integrações</Label>
              <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
                <label className="flex items-center gap-3">
                  <input type="checkbox" name="integration_telegram" defaultChecked={integrations.telegram ?? false} />
                  <span className="text-sm">Telegram</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" name="integration_n8n" defaultChecked={integrations.n8n ?? false} />
                  <span className="text-sm">N8N</span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" name="integration_sheets" defaultChecked={integrations.sheets ?? false} />
                  <span className="text-sm">Sheets</span>
                </label>
              </div>
            </div>

            {prefsState.error ? (
              <p className="text-sm text-destructive">{prefsState.error}</p>
            ) : null}

            {prefsState.ok ? (
              <p className="text-sm text-green-600 dark:text-green-400">
                Preferências salvas.
              </p>
            ) : null}

            <SubmitButton className="w-full" pendingLabel="Salvando…">
              Salvar configurações
            </SubmitButton>
          </form>
        </section>
      ) : null}

      {activeTab !== "categories" &&
      activeTab !== "accounts" &&
      activeTab !== "sheets" ? (
        <div className="rounded-lg border border-border bg-card p-6 text-muted-foreground">
          Em breve: esta aba está prevista no plano (#16), mas o CRUD completo depende
          do avanço das etapas de schema e workflows (issue #7 e seguintes).{" "}
          {members.length ? `Membros detectados: ${members.length}.` : null}
        </div>
      ) : null}
    </div>
  );
}

