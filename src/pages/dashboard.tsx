// pages/dashboard.tsx
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

  const [amount, setAmount] = useState<string>("");
  const [transactionType, setTransactionType] = useState<TransactionType>(
    TransactionType.Income
  );
  const [category, setCategory] = useState<string>("Job");
  const [description, setDescription] = useState<string>("");

  // Defining the categories with a strict type
  const categories: Record<TransactionType, string[]> = {
    [TransactionType.Income]: ["Job", "Card Payment", "Business", "Other"],
    [TransactionType.Expense]: ["Food", "Shopping", "Subscriptions", "Other"],
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/getData");
      if (!response.ok) throw new Error("Data could not be fetched");
      const data = await response.json();
      setTransactions(
        data.map((t: Transaction) => ({
          ...t,
          TransactionDate: new Date(t.TransactionDate).toLocaleDateString(), // Format date
        }))
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

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
      const response = await fetch("/api/addData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          transactionType,
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
    const firstDayOfWeek = firstDayOfMonth.getDay() || 7;
    const offsetDate = transactionDate.getDate() + firstDayOfWeek - 1;
    return Math.floor(offsetDate / 7);
  };

  // Part of the Dashboard component

  const getTopCategory = (categories: { [category: string]: number }) => {
    return Object.entries(categories).reduce(
      (top, current) => (current[1] > top[1] ? current : top),
      ["", 0]
    );
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

  // Updated return section of the Dashboard component
  return (
    <div className="container mx-auto p-4 space-y-8 bg-slate-50">
      <h1 className="text-2xl font-bold text-center">Transaction Dashboard</h1>
      <button onClick={logout} className=" bg-red-600 p-2 rounded-lg ">
        Logout
      </button>

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
            {transactions.map((transaction) => (
              <tr
                key={transaction.TransactionID}
                className={
                  transaction.TransactionType === "Income"
                    ? "bg-green-100"
                    : "bg-red-100"
                }
              >
                <td>${transaction.Amount.toFixed(2)}</td>
                <td>{transaction.TransactionDate}</td>
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
