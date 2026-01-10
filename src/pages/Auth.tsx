import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";
import { z } from "zod";
import { maskCPF, maskCNPJ, maskPhone, isValidCPF, isValidCNPJ, isValidPhone, unmask } from "@/lib/masks";

type DocumentType = "cpf" | "cnpj";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const createSignupSchema = (documentType: DocumentType) => z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  storeName: z.string().min(2, "Nome da loja deve ter no mínimo 2 caracteres"),
  fullName: z.string().min(2, "Nome completo deve ter no mínimo 2 caracteres"),
  document: z.string().refine(
    (val) => documentType === "cpf" ? isValidCPF(val) : isValidCNPJ(val),
    documentType === "cpf" ? "CPF inválido" : "CNPJ inválido"
  ),
  phone: z.string().refine((val) => isValidPhone(val), "Telefone inválido"),
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>("cpf");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    storeName: "",
    fullName: "",
    document: "",
    phone: "",
  });

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = loginSchema.safeParse(loginData);
    if (!validation.success) {
      toast({
        title: "Erro de validação",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(loginData.email, loginData.password);
    setIsLoading(false);

    if (error) {
      let message = "Ocorreu um erro ao fazer login";
      if (error.message.includes("Invalid login credentials")) {
        message = "Email ou senha incorretos";
      } else if (error.message.includes("Email not confirmed")) {
        message = "Por favor, confirme seu email antes de fazer login";
      }
      toast({
        title: "Erro no login",
        description: message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Bem-vindo!",
      description: "Login realizado com sucesso",
    });
    navigate("/");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const signupSchema = createSignupSchema(documentType);
    const validation = signupSchema.safeParse(signupData);
    if (!validation.success) {
      toast({
        title: "Erro de validação",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const cpf = documentType === "cpf" ? unmask(signupData.document) : "";
    const cnpj = documentType === "cnpj" ? unmask(signupData.document) : "";
    
    const { error } = await signUp(
      signupData.email,
      signupData.password,
      signupData.storeName,
      signupData.fullName,
      cpf,
      cnpj,
      unmask(signupData.phone)
    );
    setIsLoading(false);

    if (error) {
      let message = "Ocorreu um erro ao criar conta";
      if (error.message.includes("User already registered")) {
        message = "Este email já está cadastrado";
      } else if (error.message.includes("Password")) {
        message = "Senha muito fraca. Use letras, números e símbolos";
      }
      toast({
        title: "Erro no cadastro",
        description: message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Conta criada!",
      description: "Sua loja foi criada com sucesso. Bem-vindo ao FitVibe!",
    });
    navigate("/");
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const masked = documentType === "cpf" ? maskCPF(value) : maskCNPJ(value);
    setSignupData({ ...signupData, document: masked });
  };

  const handleDocumentTypeChange = (type: DocumentType) => {
    setDocumentType(type);
    setSignupData({ ...signupData, document: "" });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupData({ ...signupData, phone: maskPhone(e.target.value) });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">FitVibe</h1>
          </div>
          <p className="text-muted-foreground">Try-On Virtual para sua loja</p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="text-center">
            <CardTitle className="text-foreground">Acesse sua conta</CardTitle>
            <CardDescription>
              Entre ou crie uma conta para gerenciar sua loja
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar Conta</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData({ ...loginData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData({ ...loginData, password: e.target.value })
                      }
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      "Entrar"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome Completo *</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={signupData.fullName}
                      onChange={(e) =>
                        setSignupData({ ...signupData, fullName: e.target.value })
                      }
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tipo de Documento *</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={documentType === "cpf" ? "default" : "outline"}
                        className={documentType === "cpf" ? "" : "border-border"}
                        onClick={() => handleDocumentTypeChange("cpf")}
                      >
                        CPF (Pessoa Física)
                      </Button>
                      <Button
                        type="button"
                        variant={documentType === "cnpj" ? "default" : "outline"}
                        className={documentType === "cnpj" ? "" : "border-border"}
                        onClick={() => handleDocumentTypeChange("cnpj")}
                      >
                        CNPJ (Empresa)
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-document">
                      {documentType === "cpf" ? "CPF" : "CNPJ"} *
                    </Label>
                    <Input
                      id="signup-document"
                      type="text"
                      placeholder={documentType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
                      value={signupData.document}
                      onChange={handleDocumentChange}
                      maxLength={documentType === "cpf" ? 14 : 18}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Telefone *</Label>
                    <Input
                      id="signup-phone"
                      type="text"
                      placeholder="(00) 00000-0000"
                      value={signupData.phone}
                      onChange={handlePhoneChange}
                      maxLength={15}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-store">Nome da Loja *</Label>
                    <Input
                      id="signup-store"
                      type="text"
                      placeholder="Minha Loja Fitness"
                      value={signupData.storeName}
                      onChange={(e) =>
                        setSignupData({ ...signupData, storeName: e.target.value })
                      }
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email *</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={signupData.email}
                      onChange={(e) =>
                        setSignupData({ ...signupData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha *</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupData.password}
                      onChange={(e) =>
                        setSignupData({ ...signupData, password: e.target.value })
                      }
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      "Criar Conta"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Ao criar uma conta, você concorda com nossos Termos de Uso e Política de Privacidade.
        </p>
      </div>
    </div>
  );
}
