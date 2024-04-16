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
  try {
    await sql.connect(config);
    const result = await sql.query`SELECT * FROM Transactions`;
    if (result.recordset.length === 0) {
      res.status(200).json({ message: "No data found" });
    } else {
      res.status(200).json(result.recordset);
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching players", error });
  }
};
