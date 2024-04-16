import { NextApiRequest, NextApiResponse } from "next";

// pages/api/login.js
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { username, password } = req.body;
    const envUser = process.env.LOGIN_USER;
    const envPassword = process.env.LOGIN_PASSWORD;

    if (username === envUser && password === envPassword) {
      res.status(200).json({ message: "Login Successful!" });
    } else {
      res.status(401).json({ message: "Authentication failed" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
