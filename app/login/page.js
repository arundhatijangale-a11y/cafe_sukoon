import AuthSplitLayout from "@/components/AuthSplitLayout";

export const metadata = {
  title: "Welcome Back — Café Sukoon",
  description:
    "Sign in to Café Sukoon — Your AI-powered personalized music sanctuary where coffee meets music.",
};

export default function LoginPage() {
  return <AuthSplitLayout initialMode="login" />;
}
