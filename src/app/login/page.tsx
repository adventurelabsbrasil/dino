"use client";

import { useFormState } from "react-dom";
import { signIn, signUp, type AuthActionState } from "./actions";
import { SubmitButton } from "@/components/submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const initial: AuthActionState = {};

export default function LoginPage() {
  const [signInState, signInAction] = useFormState(signIn, initial);
  const [signUpState, signUpAction] = useFormState(signUp, initial);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] dark:bg-background">
      <div className="mb-6 flex items-center gap-2 text-2xl font-bold text-primary">
        <span className="text-3xl" aria-hidden>
          🦕
        </span>
        Dino
      </div>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1.5 pb-4 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Assistente financeiro familiar</CardTitle>
          <CardDescription className="text-sm">
            Entre ou crie uma conta para a família.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="login">
            <TabsList className="grid h-12 w-full grid-cols-2 p-1">
              <TabsTrigger className="min-h-[44px] w-full text-sm" value="login">
                Entrar
              </TabsTrigger>
              <TabsTrigger className="min-h-[44px] w-full text-sm" value="register">
                Cadastrar
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-4">
              <form action={signInAction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">E-mail</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="min-h-[44px] text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="min-h-[44px] text-base"
                  />
                </div>
                {signInState.error ? (
                  <p className="text-sm text-destructive">{signInState.error}</p>
                ) : null}
                <SubmitButton className="min-h-[44px] w-full text-base" pendingLabel="Entrando…">
                  Entrar
                </SubmitButton>
              </form>
            </TabsContent>
            <TabsContent value="register" className="mt-4">
              <form action={signUpAction} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Nome (opcional)</Label>
                  <Input id="reg-name" name="name" autoComplete="name" className="min-h-[44px] text-base" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">E-mail</Label>
                  <Input
                    id="reg-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="min-h-[44px] text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Senha</Label>
                  <Input
                    id="reg-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="min-h-[44px] text-base"
                  />
                </div>
                {signUpState.error ? (
                  <p className="text-sm text-destructive">{signUpState.error}</p>
                ) : null}
                {signUpState.ok ? (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {signUpState.ok}
                  </p>
                ) : null}
                <SubmitButton className="min-h-[44px] w-full text-base" pendingLabel="Criando…">
                  Criar conta
                </SubmitButton>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Após entrar você acessa o painel da família.
      </p>
    </div>
  );
}
