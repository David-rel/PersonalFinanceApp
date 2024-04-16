// pages/api/deleteData.ts

import type { NextApiRequest, NextApiResponse } from "next";
const sql = require("mssql");
const config = {
  user: process.env.NEXT_PUBLIC_SQL_USER,
  password: process.env.NEXT_PUBLIC_SQL_PASSWORD,
  server: process.env.NEXT_PUBLIC_SQL_DATABASE,
  database: process.env.NEXT_PUBLIC_SQL_NAME,
  options: {
    encrypt: true, // Required for Azure SQL
  },
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }

  const { transactionId } = req.body;

  try {
    await sql.connect(config);
    const result =
      await sql.query`DELETE FROM Transactions WHERE TransactionID = ${transactionId}`;
    if (result.rowsAffected[0] > 0) {
      res.status(200).json({ message: "Transaction deleted successfully" });
    } else {
      res.status(404).json({ message: "Transaction not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting transaction", error });
  }
};
