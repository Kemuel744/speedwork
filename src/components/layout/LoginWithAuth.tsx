import { AuthProvider } from "@/contexts/AuthContext";
import Login from "@/pages/Login";

export default function LoginWithAuth() {
  return (
    <AuthProvider>
      <Login />
    </AuthProvider>
  );
}
