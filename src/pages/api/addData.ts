import type { NextApiRequest, NextApiResponse } from "next";
const sql = require("mssql");

const config = {
  user: process.env.NEXT_PUBLIC_SQL_USER,
  password: process.env.NEXT_PUBLIC_SQL_PASSWORD,
  server: process.env.NEXT_PUBLIC_SQL_DATABASE,
  database: process.env.NEXT_PUBLIC_SQL_NAME,
  pool: {
    idleTimeoutMillis: 60000,
  },
  requestTimeout: 60000,
  options: {
    encrypt: true, // Required for Azure SQL
  },
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }
  

  const { amount, transactionType, transactionDate, category, description } = req.body;

  try {
    await sql.connect(config);
    const result = await sql.query`
      INSERT INTO Transactions (Amount, TransactionDate, TransactionType, Category, Description)
      VALUES (${amount}, ${transactionDate}, ${transactionType}, ${category}, ${description})
      SELECT SCOPE_IDENTITY() as TransactionID;
    `;

    if (result.recordset.length > 0) {
      res
        .status(200)
        .json({
          message: "Transaction added successfully",
          transactionID: result.recordset[0].TransactionID,
        });
    } else {
      res.status(400).json({ message: "Failed to add transaction" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error adding transaction", error });
  }
};
