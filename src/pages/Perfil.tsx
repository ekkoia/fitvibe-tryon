import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Store, Key, Phone, FileText } from "lucide-react";
import { z } from "zod";
import { maskCPF, maskCNPJ, maskPhone, isValidCPF, isValidCNPJ, isValidPhone, unmask } from "@/lib/masks";

const profileSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  phone: z.string().refine((val) => isValidPhone(val), "Telefone inválido"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Senha atual deve ter no mínimo 6 caracteres"),
  newPassword: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirmação deve ter no mínimo 6 caracteres"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export default function Perfil() {
  const { user, profile, store } = useAuth();
  const { toast } = useToast();
  
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  
  const [profileData, setProfileData] = useState({
    fullName: profile?.full_name || "",
    phone: profile?.phone ? maskPhone(profile.phone) : "",
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const documentValue = profile?.cpf 
    ? maskCPF(profile.cpf) 
    : profile?.cnpj 
      ? maskCNPJ(profile.cnpj) 
      : "";
  
  const documentType = profile?.cpf ? "CPF" : profile?.cnpj ? "CNPJ" : "";

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = profileSchema.safeParse(profileData);
    if (!validation.success) {
      toast({
        title: "Erro de validação",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingProfile(true);
    
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profileData.fullName,
        phone: unmask(profileData.phone),
      })
      .eq("id", user?.id);

    setIsUpdatingProfile(false);

    if (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o perfil",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Perfil atualizado!",
      description: "Suas informações foram atualizadas com sucesso",
    });
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = passwordSchema.safeParse(passwordData);
    if (!validation.success) {
      toast({
        title: "Erro de validação",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);
    
    const { error } = await supabase.auth.updateUser({
      password: passwordData.newPassword,
    });

    setIsUpdatingPassword(false);

    if (error) {
      let message = "Não foi possível atualizar a senha";
      if (error.message.includes("same_password")) {
        message = "A nova senha deve ser diferente da atual";
      }
      toast({
        title: "Erro ao atualizar",
        description: message,
        variant: "destructive",
      });
      return;
    }

    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    toast({
      title: "Senha atualizada!",
      description: "Sua senha foi alterada com sucesso",
    });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({ ...profileData, phone: maskPhone(e.target.value) });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais e senha</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Atualize seus dados de contato
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  O email não pode ser alterado
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={handlePhoneChange}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>

              {documentValue && (
                <div className="space-y-2">
                  <Label htmlFor="document">{documentType}</Label>
                  <Input
                    id="document"
                    value={documentValue}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    O documento não pode ser alterado
                  </p>
                </div>
              )}

              <Button type="submit" disabled={isUpdatingProfile}>
                {isUpdatingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Store Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Minha Loja
            </CardTitle>
            <CardDescription>
              Informações da sua loja
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Loja</Label>
              <Input value={store?.name || ""} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={store?.slug || ""} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label>Plano</Label>
              <Input 
                value={store?.plan?.charAt(0).toUpperCase() + store?.plan?.slice(1) || "Free"} 
                disabled 
                className="bg-muted" 
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Input 
                value={store?.status === "active" ? "Ativo" : store?.status || ""} 
                disabled 
                className="bg-muted" 
              />
            </div>
          </CardContent>
        </Card>

        {/* Password Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Alterar Senha
            </CardTitle>
            <CardDescription>
              Atualize sua senha de acesso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" disabled={isUpdatingPassword}>
                {isUpdatingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  "Alterar Senha"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
