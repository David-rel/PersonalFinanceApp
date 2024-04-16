// pages/index.js
import LoginForm from "../components/LoginForm";
import { useState } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const [loginStatus, setLoginStatus] = useState("");
  const router = useRouter();

  const handleLogin = async (username: any, password: any) => {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();

    if (response.ok) {
      router.push("/dashboard");
    } else {
      setLoginStatus(data.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">
        Welcome to My Finance App
      </h1>
      <LoginForm onLogin={handleLogin} />
      {loginStatus && <p className="text-red-500">{loginStatus}</p>}
    </div>
  );
}
