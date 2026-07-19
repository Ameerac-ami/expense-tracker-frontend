"use client";

import { FormEvent, useEffect, useState } from "react";

type Transaction = {
	id: number;
	title: string;
	amount: string | number;
	category: string;
	is_income: boolean;
};

type TransactionForm = {
	title: string;
	amount: string;
	category: string;
	is_income: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/expenses/";

const formatCurrency = (value: number) =>
	new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 2,
	}).format(value);

export default function Home() {
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [success, setSuccess] = useState<string | null>(null);
	const [viewAll, setViewAll] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [form, setForm] = useState<TransactionForm>({
		title: "",
		amount: "",
		category: "Food",
		is_income: false,
	});

	const loadTransactions = async () => {
		try {
			const response = await fetch(API_URL, { cache: "no-store" });
			if (!response.ok) {
				throw new Error("Failed to load expenses");
			}

			const data = (await response.json()) as Transaction[];
			setTransactions(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unable to load transactions");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadTransactions();
	}, []);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSubmitting(true);
		setError(null);
		setSuccess(null);

		try {
			const isEditing = editingId !== null;
			const url = isEditing ? `${API_URL}${editingId}/` : API_URL;
			const method = isEditing ? "PUT" : "POST";

			const response = await fetch(url, {
				method: method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title: form.title,
					amount: form.amount,
					category: form.category,
					is_income: form.is_income,
				}),
			});

			if (!response.ok) {
				throw new Error(isEditing ? "Unable to update transaction" : "Unable to save transaction");
			}

			const updated = (await response.json()) as Transaction;
			if (isEditing) {
				setTransactions((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
				setSuccess("Transaction updated successfully.");
				setEditingId(null);
			} else {
				setTransactions((prev) => [updated, ...prev]);
				setSuccess("Transaction saved successfully.");
			}
			setForm({ title: "", amount: "", category: "Food", is_income: false });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unable to save transaction");
		} finally {
			setSubmitting(false);
		}
	};

	const handleStartEdit = (transaction: Transaction) => {
		setEditingId(transaction.id);
		setForm({
			title: transaction.title,
			amount: String(transaction.amount),
			category: transaction.category,
			is_income: transaction.is_income,
		});
		setError(null);
		setSuccess(null);

		// Smooth scroll to the form element or the Quick add area
		window.scrollTo({ top: 250, behavior: "smooth" });
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setForm({ title: "", amount: "", category: "Food", is_income: false });
		setError(null);
		setSuccess(null);
	};

	const handleDelete = async (id: number) => {
		if (!confirm("Are you sure you want to delete this transaction?")) {
			return;
		}
		setError(null);
		setSuccess(null);

		try {
			const response = await fetch(`${API_URL}${id}/`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Unable to delete transaction");
			}

			setTransactions((prev) => prev.filter((item) => item.id !== id));
			setSuccess("Transaction deleted successfully.");
			if (editingId === id) {
				setEditingId(null);
				setForm({ title: "", amount: "", category: "Food", is_income: false });
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unable to delete transaction");
		}
	};


	const expenses = transactions
		.filter((item) => !item.is_income)
		.reduce((total, item) => total + Number(item.amount), 0);
	const income = transactions
		.filter((item) => item.is_income)
		.reduce((total, item) => total + Number(item.amount), 0);
	const balance = income - expenses;

	const summaryCards = [
		{
			title: "Balance",
			value: formatCurrency(balance),
			detail: "Live from Django API",
			accent: "from-emerald-500 to-teal-500",
		},
		{
			title: "Expenses",
			value: formatCurrency(expenses),
			detail: "Tracked this month",
			accent: "from-rose-500 to-orange-500",
		},
		{
			title: "Income",
			value: formatCurrency(income),
			detail: "Updated from backend",
			accent: "from-sky-500 to-indigo-500",
		},
	];

	return (
		<main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.15),_transparent_35%),linear-gradient(135deg,_#0f172a_0%,_#111827_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
			<div className="mx-auto flex max-w-7xl flex-col gap-6">
				<header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
					<div>
						<p className="text-sm font-medium uppercase tracking-[0.3em] text-sky-300">Expense tracker</p>
						<h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Keep your money calm and clear.</h1>

					</div>
					<div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
						<p className="mt-1 text-2xl font-bold">Connected</p>
					</div>
				</header>

				<section className="grid gap-4 md:grid-cols-3">
					{summaryCards.map((card) => (
						<article
							key={card.title}
							className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-lg shadow-black/20">
							<div className={`h-1.5 w-20 rounded-full bg-gradient-to-r ${card.accent}`} />
							<p className="mt-4 text-sm text-slate-400">{card.title}</p>
							<p className="mt-2 text-3xl font-semibold">{card.value}</p>
							<p className="mt-2 text-sm text-slate-300">{card.detail}</p>
						</article>
					))}
				</section>

				<section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
					<article className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/20">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-slate-400">This week</p>
								<h2 className="text-xl font-semibold">Spending overview</h2>
							</div>
							<button className="rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1.5 text-sm font-medium text-sky-200">
								+ Add expense
							</button>
						</div>

						<div className="mt-6 flex h-48 items-end gap-3 rounded-2xl bg-slate-800/70 p-4">
							{[42, 58, 74, 66, 90, 81, 64].map((height, index) => (
								<div key={index} className="flex flex-1 flex-col items-center gap-2">
									<div
										className="w-full rounded-t-2xl bg-gradient-to-t from-fuchsia-500 via-violet-500 to-sky-400"
										style={{ height: `${height}%` }}
									/>
									<span className="text-xs text-slate-400">
										{["M", "T", "W", "T", "F", "S", "S"][index]}
									</span>
								</div>
							))}
						</div>
					</article>

					<article className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/20">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-slate-400">{editingId !== null ? "Modify entry" : "Quick add"}</p>
								<h2 className="text-xl font-semibold">{editingId !== null ? "Edit transaction" : "New entry"}</h2>
							</div>
						</div>

						<form onSubmit={handleSubmit} className="mt-5 space-y-3">
							<input
								className="w-full rounded-2xl border border-white/10 bg-slate-800/80 px-4 py-3 text-sm outline-none ring-0"
								placeholder="Description"
								value={form.title}
								onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
								required
							/>
							<div className="grid gap-3 sm:grid-cols-2">
								<input
									className="w-full rounded-2xl border border-white/10 bg-slate-800/80 px-4 py-3 text-sm outline-none"
									placeholder="Amount"
									type="number"
									step="0.01"
									value={form.amount}
									onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
									required
								/>
								<select
									className="w-full rounded-2xl border border-white/10 bg-slate-800/80 px-4 py-3 text-sm outline-none"
									value={form.category}
									onChange={(event) =>
										setForm((prev) => ({ ...prev, category: event.target.value }))
									}>
									<option value="Food">Food</option>
									<option value="Salary">Salary</option>
									<option value="Travel">Travel</option>
									<option value="Shopping">Shopping</option>
									<option value="Utilities">Utilities</option>
									<option value="Income">Income</option>
									<option value="Other">Other</option>
								</select>
							</div>
							<label className="flex items-center gap-2 text-sm text-slate-300">
								<input
									type="checkbox"
									checked={form.is_income}
									onChange={(event) =>
										setForm((prev) => ({ ...prev, is_income: event.target.checked }))
									}
								/>
								This is income
							</label>
							{editingId !== null ? (
								<div className="flex gap-2">
									<button
										type="submit"
										disabled={submitting}
										className="flex-1 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70">
										{submitting ? "Updating..." : "Update transaction"}
									</button>
									<button
										type="button"
										onClick={handleCancelEdit}
										className="rounded-2xl border border-white/10 bg-slate-800 hover:bg-slate-700/80 px-4 py-3 text-sm font-semibold text-slate-300 transition">
										Cancel
									</button>
								</div>
							) : (
								<button
									type="submit"
									disabled={submitting}
									className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70">
									{submitting ? "Saving..." : "Save transaction"}
								</button>
							)}
						</form>

						{error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
						{success && <p className="mt-3 text-sm text-emerald-300">{success}</p>}
					</article>
				</section>

				<section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/20">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-slate-400">Recent activity</p>
							<h2 className="text-xl font-semibold">Latest transactions</h2>
						</div>
						{transactions.length > 5 && (
							<button
								onClick={() => setViewAll(!viewAll)}
								className="text-sm font-medium text-sky-300 hover:text-sky-400 transition bg-transparent border-none cursor-pointer">
								{viewAll ? "Show less" : "View all"}
							</button>
						)}
					</div>

					<div className="mt-5 space-y-3">
						{loading && <p className="text-sm text-slate-400">Loading transactions from Django...</p>}
						{!loading && error && <p className="text-sm text-rose-300">{error}</p>}
						{!loading && !error && transactions.length === 0 && (
							<p className="text-sm text-slate-400">No transactions available.</p>
						)}
						{!loading &&
							!error &&
							(viewAll ? transactions : transactions.slice(0, 5)).map((item) => {
								const isIncome = item.is_income;
								const amountText = `${isIncome ? "+" : "-"}${formatCurrency(Number(item.amount))}`;

								return (
									<div
										key={item.id}
										className="group flex items-center justify-between rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3 hover:border-white/20 transition-all duration-200">
										<div className="flex-1 min-w-0">
											<p className="font-medium truncate">{item.title}</p>
											<p className="text-sm text-slate-400">{item.category}</p>
										</div>
										<div className="flex items-center gap-4">
											<p
												className={`font-semibold text-right ${isIncome ? "text-emerald-400" : "text-rose-300"}`}>
												{amountText}
											</p>
											<div className="flex items-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
												<button
													onClick={() => handleStartEdit(item)}
													title="Edit transaction"
													className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-700/50 transition-all cursor-pointer">
													<svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
													</svg>
												</button>
												<button
													onClick={() => handleDelete(item.id)}
													title="Delete transaction"
													className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 transition-all cursor-pointer">
													<svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
													</svg>
												</button>
											</div>
										</div>
									</div>
								);
							})}
					</div>
				</section>

			</div>
		</main>
	);
}
