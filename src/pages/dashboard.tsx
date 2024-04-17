// pages/dashboard.tsx
import Link from "next/link";
import React, { useEffect, useState } from "react";

interface Transaction {
  TransactionID: number;
  Amount: number;
  TransactionDate: string;
  TransactionType: string;
  Category: string;
  Description: string;
}

enum TransactionType {
  Income = "Income",
  Expense = "Expense",
}

const Dashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [filterMonth, setFilterMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  ); // YYYY-MM

  const [amount, setAmount] = useState<string>("");
  const [transactionType, setTransactionType] = useState<TransactionType>(
    TransactionType.Income
  );
  const [category, setCategory] = useState<string>("Job");
  const [description, setDescription] = useState<string>("");

  const getMonthName = (date: Date) => {
    return date.toLocaleString("default", { month: "long" });
  };

  const currentMonthName = getMonthName(new Date()); // Gets the current month name

  // Defining the categories with a strict type
  const categories: Record<TransactionType, string[]> = {
    [TransactionType.Income]: ["Job", "Card Payment", "Business", "Other"],
    [TransactionType.Expense]: ["Food", "Shopping", "Subscriptions", "Other"],
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date
      .getDate()
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  };

  const formatDateToLocal = (dateString: string): string => {
    // Input is expected in YYYY-MM-DD format from the date input
    const [year, month, day] = dateString.split("-").map(Number);
    // Construct a new Date object and add one day to the date
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + 1); // Add 1 day to correct the timezone offset issue

    // Format the date back to MM/DD/YYYY format
    return `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date
      .getDate()
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  };

  const getCurrentMonthDateRange = () => {
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { firstDay, lastDay };
  };

  const fetchTransactions = async () => {
    const { firstDay, lastDay } = getCurrentMonthDateRange();
    const firstDayStr = firstDay.toISOString().slice(0, 10);
    const lastDayStr = lastDay.toISOString().slice(0, 10);

    try {
      const response = await fetch("/api/getData");
      const data = await response.json();
      const filteredData = data.filter((t: Transaction) => {
        const transactionDate = t.TransactionDate.slice(0, 10); // Assuming date comes in 'YYYY-MM-DD' format
        return transactionDate >= firstDayStr && transactionDate <= lastDayStr;
      });
      setTransactions(
        filteredData.map((t: Transaction) => ({
          ...t,
          TransactionDate: formatDate(t.TransactionDate), // Ensure dates are uniformly formatted for display
        }))
      );
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    }
  };

  // Filter transactions in the rendering or add a useEffect to do this whenever filterMonth changes
  const filteredTransactions = transactions.filter((transaction) => {
    // Split the formatted transaction date "MM/DD/YYYY"
    const [month, day, year] =
      transaction.TransactionDate.split("/").map(Number);
    // Create a comparable string from the transaction date
    const transactionMonthYear = `${year}-${month.toString().padStart(2, "0")}`; // "YYYY-MM"

    return transactionMonthYear === filterMonth;
  });

  const logout = () => {
    // Assuming you're storing a token or some form of credentials:
    localStorage.removeItem("userToken");

    // If you're using cookies, you might want to clear them:
    document.cookie = "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";

    // Redirect to login or home page
    window.location.href = "/";
  };

  const addTransaction = async () => {
    try {
      const formattedDate = new Date(transactionDate)
        .toISOString()
        .slice(0, 10);
      const response = await fetch("/api/addData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          transactionType,
          transactionDate: formattedDate, // Send in ISO format
          category,
          description,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        setAmount("");
        setDescription("");
        fetchTransactions(); // Refresh the list after adding
      } else {
        throw new Error(result.message || "Failed to add transaction");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteTransaction = async (transactionId: number) => {
    try {
      const response = await fetch("/api/deleteData", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transactionId }),
      });
      const data = await response.json();
      if (response.ok) {
        setTransactions(
          transactions.filter((t) => t.TransactionID !== transactionId)
        ); // Update UI
        alert("Transaction deleted successfully");
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Failed to delete the transaction");
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    addTransaction();
  };

  const currentMonth = new Date().getMonth();
  const totalIncome = transactions
    .filter(
      (t) =>
        t.TransactionType === "Income" &&
        new Date(t.TransactionDate).getMonth() === currentMonth
    )
    .reduce((acc, curr) => acc + curr.Amount, 0);

  const totalExpense = transactions
    .filter(
      (t) =>
        t.TransactionType === "Expense" &&
        new Date(t.TransactionDate).getMonth() === currentMonth
    )
    .reduce((acc, curr) => acc + curr.Amount, 0);

  const netBalance = totalIncome - totalExpense;

  const getTotalByCategory = (type: string) => {
    return transactions
      .filter(
        (t) =>
          t.TransactionType === type &&
          new Date(t.TransactionDate).getMonth() === currentMonth
      )
      .reduce((acc, curr) => {
        const key = curr.Category;
        if (!acc[key]) {
          acc[key] = 0;
        }
        acc[key] += curr.Amount;
        return acc;
      }, {} as { [key: string]: number });
  };

  // Sorted totals by category for Income and Expense
  const incomeByCategory = getTotalByCategory("Income");
  const expenseByCategory = getTotalByCategory("Expense");

  const sortedIncomeCategories = Object.keys(incomeByCategory).sort(
    (a, b) => incomeByCategory[b] - incomeByCategory[a]
  );
  const sortedExpenseCategories = Object.keys(expenseByCategory).sort(
    (a, b) => expenseByCategory[b] - expenseByCategory[a]
  );

  const getWeekOfMonth = (date: string) => {
    const transactionDate = new Date(date);
    const firstDayOfMonth = new Date(
      transactionDate.getFullYear(),
      transactionDate.getMonth(),
      1
    );
    // Get the day of the week for the first day of the month (0-6, Sun-Sat)
    const firstDayOfWeek = firstDayOfMonth.getDay();
    // Calculate the week number
    const offset = (firstDayOfWeek < 6 ? 0 : 7) - firstDayOfWeek; // Adjust for start day of the week (Sunday in US)
    const adjustedDate = transactionDate.getDate() + offset;
    return Math.floor(adjustedDate / 7);
  };

  const weeklySummary = (type: string) => {
    return transactions.reduce((acc, transaction) => {
      if (transaction.TransactionType === type) {
        const week = getWeekOfMonth(transaction.TransactionDate);
        if (!acc[week]) {
          acc[week] = {
            totalAmount: 0,
            categories: {},
            topCategory: { name: "", amount: 0 },
          };
        }
        const amount = transaction.Amount;
        acc[week].totalAmount += amount;
        const category = transaction.Category;
        if (!acc[week].categories[category]) {
          acc[week].categories[category] = 0;
        }
        acc[week].categories[category] += amount;
        // Determine if this category should now be considered the top category
        if (acc[week].categories[category] > acc[week].topCategory.amount) {
          acc[week].topCategory = {
            name: category,
            amount: acc[week].categories[category],
          };
        }
      }
      return acc;
    }, {} as { [week: number]: { totalAmount: number; categories: { [category: string]: number }; topCategory: { name: string; amount: number } } });
  };

  const incomeSummaryByWeek = weeklySummary("Income");
  const expenseSummaryByWeek = weeklySummary("Expense");

  const addOneDay = (dateString: String) => {
    const [month, day, year] = dateString.split("/").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + 1); // Add one day

    return `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date
      .getDate()
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  };

  // Updated return section of the Dashboard component
  return (
    <div className="container mx-auto p-4 space-y-8 bg-slate-50">
      <h1 className="text-2xl font-bold text-center">
        Transaction Dashboard for: {currentMonthName}
      </h1>
      <button onClick={logout} className=" bg-red-600 p-2 rounded-lg ">
        Logout
      </button>
      <Link href="/pastAndFuture" legacyBehavior>
        <a className="bg-blue-600 p-3 rounded-lg ml-4">View Past Reports</a>
      </Link>

      <form
        onSubmit={handleSubmit}
        className="max-w-lg mx-auto bg-white rounded-lg shadow p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold text-gray-800">
          Add New Transaction
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <input
            type="number"
            placeholder="Amount"
            className="input input-bordered w-full"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            type="date"
            className="input input-bordered w-full"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
          />

          <select
            className="select select-bordered w-full"
            value={transactionType}
            onChange={(e) => {
              const newType = e.target.value as TransactionType; // Type assertion
              setTransactionType(newType);
              setCategory(categories[newType][0] ?? "");
            }}
          >
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </select>

          <select
            className="select select-bordered w-full"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories[transactionType].map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <textarea
            placeholder="Description"
            className="textarea textarea-bordered w-full"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
          <button type="submit" className="btn btn-primary w-full">
            Add Transaction
          </button>
        </div>
      </form>
      <div className="overflow-x-auto mt-8">
        <table className="table w-full table-compact">
          <thead>
            <tr>
              <th className="text-xs font-bold uppercase text-gray-500 bg-gray-50">
                Amount
              </th>
              <th className="text-xs font-bold uppercase text-gray-500 bg-gray-50">
                Date
              </th>
              <th className="text-xs font-bold uppercase text-gray-500 bg-gray-50">
                Type
              </th>
              <th className="text-xs font-bold uppercase text-gray-500 bg-gray-50">
                Category
              </th>
              <th className="text-xs font-bold uppercase text-gray-500 bg-gray-50">
                Description
              </th>
              <th className="text-xs font-bold uppercase text-gray-500 bg-gray-50">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((transaction) => (
              <tr
                key={transaction.TransactionID}
                className={
                  transaction.TransactionType === "Income"
                    ? "bg-green-100"
                    : "bg-red-100"
                }
              >
                <td>${transaction.Amount.toFixed(2)}</td>
                <td>{addOneDay(transaction.TransactionDate)}</td>{" "}
                {/* Adjust the date here */}
                <td>{transaction.TransactionType}</td>
                <td>{transaction.Category}</td>
                <td>{transaction.Description}</td>
                <td>
                  <button
                    onClick={() => deleteTransaction(transaction.TransactionID)}
                    className="btn btn-error btn-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Financial Summary Section */}
      <div className="mt-8 p-4 bg-white rounded shadow">
        <h2 className="text-lg font-semibold text-gray-800">Monthly Summary</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            Total Income:{" "}
            <span className="font-bold text-green-600">
              ${totalIncome.toFixed(2)}
            </span>
          </div>
          <div>
            Total Expense:{" "}
            <span className="font-bold text-red-600">
              ${totalExpense.toFixed(2)}
            </span>
          </div>
          <div>
            Net Balance For:{" "}
            <span
              className={`font-bold ${
                netBalance >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ${netBalance.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-8 p-4 bg-white rounded shadow">
        <h2 className="text-lg font-semibold text-gray-800">
          Impact by Category
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-md font-semibold text-green-600">
              Top Income Categories
            </h3>
            <ul>
              {sortedIncomeCategories.map((category) => (
                <li key={category}>
                  {category}: ${incomeByCategory[category].toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-md font-semibold text-red-600">
              Top Expense Categories
            </h3>
            <ul>
              {sortedExpenseCategories.map((category) => (
                <li key={category}>
                  {category}: ${expenseByCategory[category].toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <br />
      <br />
      <br />
      {/* Display income and expenses weekly */}
      {[0, 1, 2, 3].map((week) => (
        <div key={week} className="bg-white p-4 rounded shadow my-2">
          <h2 className="text-lg font-semibold">Week {week + 1} Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-green-600">
                Income: ${incomeSummaryByWeek[week]?.totalAmount.toFixed(2)}
              </h3>
              <div>
                Top Income Category:{" "}
                {incomeSummaryByWeek[week]?.topCategory.name} ($
                {incomeSummaryByWeek[week]?.topCategory.amount.toFixed(2)})
              </div>
              <ul>
                {Object.entries(
                  incomeSummaryByWeek[week]?.categories || {}
                ).map(([category, amount]) => (
                  <li key={category}>
                    {category}: ${amount.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-red-600">
                Expenses: ${expenseSummaryByWeek[week]?.totalAmount.toFixed(2)}
              </h3>
              <div>
                Top Expense Category:{" "}
                {expenseSummaryByWeek[week]?.topCategory.name} ($
                {expenseSummaryByWeek[week]?.topCategory.amount.toFixed(2)})
              </div>
              <ul>
                {Object.entries(
                  expenseSummaryByWeek[week]?.categories || {}
                ).map(([category, amount]) => (
                  <li key={category}>
                    {category}: ${amount.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
