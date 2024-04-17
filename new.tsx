import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Transaction {
  TransactionID: number;
  Amount: number;
  TransactionDate: string;
  TransactionType: string;
  Category: string;
  Description: string;
}

interface TransactionsByCategory {
  [category: string]: Transaction[];
}

interface CategorizedTransactions {
  Income: TransactionsByCategory;
  Expense: TransactionsByCategory;
}

interface OverviewData {
  totalIncome: number;
  totalExpense: number;
  net: number;
  biggestIncomeCategory: string;
  biggestIncomeAmount: number;
  biggestExpenseCategory: string;
  biggestExpenseAmount: number;
}

interface ExtendedGroupedTransactions {
  [monthYear: string]: {
    data: CategorizedTransactions;
    overview: OverviewData;
  };
}

function PastAndFuture() {
  const [transactions, setTransactions] = useState<ExtendedGroupedTransactions>(
    {}
  );
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/getData");
      const rawData: Transaction[] = await response.json();
      const groupedData = groupTransactionsByMonth(rawData);
      setTransactions(groupedData);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    }
  };

  const groupTransactionsByMonth = (
    transactions: Transaction[]
  ): ExtendedGroupedTransactions => {
    const grouped: ExtendedGroupedTransactions = {};
    transactions.forEach((transaction) => {
      const monthYear = transaction.TransactionDate.slice(0, 7);
      if (!grouped[monthYear]) {
        grouped[monthYear] = {
          data: { Income: {}, Expense: {} },
          overview: undefined,
        };
      }
      const typeGroup =
        transaction.TransactionType === "Income"
          ? grouped[monthYear].data.Income
          : grouped[monthYear].data.Expense;
      if (!typeGroup[transaction.Category]) {
        typeGroup[transaction.Category] = [];
      }
      typeGroup[transaction.Category].push(transaction);
    });

    // Ensure the overview is computed for each monthYear
    Object.keys(grouped).forEach((monthYear) => {
      if (grouped[monthYear].data) {
        grouped[monthYear].overview = computeOverview(grouped[monthYear].data);
      }
    });

    return grouped;
  };

  const computeOverview = (
    categorized: CategorizedTransactions
  ): OverviewData => {
    let totalIncome = 0;
    let totalExpense = 0;
    let biggestIncomeAmount = 0;
    let biggestIncomeCategory = "";
    let biggestExpenseAmount = 0;
    let biggestExpenseCategory = "";

    Object.entries(categorized.Income).forEach(([category, transactions]) => {
      const total = transactions.reduce((sum, { Amount }) => sum + Amount, 0);
      totalIncome += total;
      if (total > biggestIncomeAmount) {
        biggestIncomeAmount = total;
        biggestIncomeCategory = category;
      }
    });

    Object.entries(categorized.Expense).forEach(([category, transactions]) => {
      const total = transactions.reduce((sum, { Amount }) => sum + Amount, 0);
      totalExpense += total;
      if (total > biggestExpenseAmount) {
        biggestExpenseAmount = total;
        biggestExpenseCategory = category;
      }
    });

    return {
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
      biggestIncomeCategory,
      biggestIncomeAmount,
      biggestExpenseCategory,
      biggestExpenseAmount,
    };
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1); // Correct for timezone offset
    return `${(date.getMonth() + 1).toString().padStart(2, "0")}-${date
      .getDate()
      .toString()
      .padStart(2, "0")}-${date.getFullYear()}`;
  };

  const logout = () => {
    localStorage.removeItem("userToken");
    document.cookie = "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    window.location.href = "/";
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={logout}
          className="btn bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Logout
        </button>
        <Link href="/dashboard" legacyBehavior>
          <a className="btn bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Back
          </a>
        </Link>
      </div>
      {Object.entries(transactions).map(([monthYear, { data, overview }]) => (
        <section
          key={monthYear}
          className="mb-8 border-2 border-gray-500 rounded-lg p-4"
        >
          <button
            onClick={() => toggleMonth(monthYear)}
            className="flex justify-between items-center w-full text-left text-xl font-bold mb-4"
          >
            Month: {monthYear}{" "}
            <span className="text-lg">
              {expandedMonths[monthYear] ? "▲" : "▼"}
            </span>
          </button>
          {expandedMonths[monthYear] && (
            <div>
              {["Income", "Expense"].map((type) => (
                <div
                  key={type}
                  className={`mt-4 ${
                    type === "Income" ? "bg-green-100" : "bg-red-100"
                  } p-4 rounded-lg shadow`}
                >
                  <h3 className="text-lg font-semibold mb-4 underline">
                    {type}
                  </h3>
                  {Object.entries(data[type]).map(
                    ([category, transactions]) => (
                      <div key={category}>
                        <h4 className="text-md font-semibold mb-2">
                          {category}
                        </h4>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {transactions.map((transaction) => (
                            <div
                              key={transaction.TransactionID}
                              className="bg-white p-4 rounded shadow-md hover:shadow-lg transition-shadow"
                            >
                              <p className="font-bold text-md mb-1">
                                Amount: ${transaction.Amount.toFixed(2)}
                              </p>
                              <p className="text-gray-600 mb-1">
                                Date: {formatDate(transaction.TransactionDate)}
                              </p>
                              <p className="text-gray-600 mb-1">
                                Description:{" "}
                                {transaction.Description || "No description"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
          {overview && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Monthly Overview</h3>
              <p>Total Income: ${overview.totalIncome.toFixed(2)}</p>
              <p>Total Expense: ${overview.totalExpense.toFixed(2)}</p>
              <p>
                Net: ${overview.net.toFixed(2)} (
                {overview.net >= 0 ? "Positive" : "Negative"})
              </p>
              <p>
                Biggest Income Category: {overview.biggestIncomeCategory} ($
                {overview.biggestIncomeAmount.toFixed(2)})
              </p>
              <p>
                Biggest Expense Category: {overview.biggestExpenseCategory} ($
                {overview.biggestExpenseAmount.toFixed(2)})
              </p>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

export default PastAndFuture;
