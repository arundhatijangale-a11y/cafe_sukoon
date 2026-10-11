import AuthSplitLayout from "@/components/AuthSplitLayout";

export const metadata = {
  title: "Join Café Sukoon Sanctuary — Create Free Account",
  description:
    "Create your account to sync your playlists and AI taste profile at Café Sukoon.",
};

export default function SignupPage() {
  return <AuthSplitLayout initialMode="signup" />;
}
