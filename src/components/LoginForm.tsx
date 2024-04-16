// components/LoginForm.js
import React, { useState } from "react";

type OnLoginFunc = (username: string, password: string) => void;

const LoginForm = ({ onLogin }: { onLogin: OnLoginFunc }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    onLogin(username, password);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center mt-20 p-4 shadow-lg rounded-lg max-w-sm mx-auto bg-white"
    >
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        className="mb-4 p-2 w-full rounded border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="mb-4 p-2 w-full rounded border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
      >
        Login
      </button>
    </form>
  );
};

export default LoginForm;
