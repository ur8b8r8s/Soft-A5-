import {
  ExpenseStore,
  JsonFileStorage,
  ValidationError,
  breakdownByCategory,
  budgetStatus,
  formatMoney,
  toCents,
  totalCents,
} from "./index.js";

const DATA_FILE = process.env.EXPENSE_FILE ?? "data/expenses.json";

const USAGE = `Usage:
  add <amount> <category> <date YYYY-MM-DD> [note...] [--currency USD]
  list [--category food] [--from YYYY-MM-DD] [--to YYYY-MM-DD]
  delete <id>
  summary [YYYY-MM] [--limit 500]`;

function parseArgs(args: string[]) {
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i] as string;
    if (arg.startsWith("--")) {
      const value = args[i + 1];
      if (value === undefined || value.startsWith("--")) {
        throw new ValidationError(`Missing value for ${arg}.`);
      }
      flags[arg.slice(2)] = value;
      i++;
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

function run(argv: string[]): string {
  const [command, ...rest] = argv;
  const { positional, flags } = parseArgs(rest);
  const store = new ExpenseStore(new JsonFileStorage(DATA_FILE));

  switch (command) {
    case "add": {
      const [amount, category, date, ...note] = positional;
      const e = store.add({
        amount: Number(amount),
        category: category ?? "",
        date: date ?? "",
        note: note.join(" "),
        currency: flags.currency,
      });
      return `Added ${e.id}: ${formatMoney(e.amountCents, e.currency)} (${e.category}) on ${e.date}`;
    }
    case "list": {
      const items = store.list({ category: flags.category, from: flags.from, to: flags.to });
      if (items.length === 0) return "No expenses found.";
      return items
        .map((e) => `${e.id}  ${e.date}  ${e.category}  ${formatMoney(e.amountCents, e.currency)}  ${e.note}`)
        .join("\n");
    }
    case "delete": {
      const id = positional[0] ?? "";
      return store.remove(id) ? `Deleted ${id}` : `No expense with id "${id}".`;
    }
    case "summary": {
      const month = positional[0] ?? new Date().toISOString().slice(0, 7);
      const inMonth = store.list({ from: `${month}-01`, to: `${month}-31` });
      const status = budgetStatus(
        inMonth,
        flags.limit === undefined ? {} : { monthlyLimitCents: toCents(Number(flags.limit)) },
        month,
      );
      const currency = status.currency ?? "USD";
      const lines = [`Month ${month}: total ${formatMoney(totalCents(inMonth), currency)}`];
      for (const c of breakdownByCategory(inMonth)) {
        lines.push(`  ${c.category}: ${formatMoney(c.totalCents, currency)} (${c.count})`);
      }
      if (status.monthlyLimitCents !== undefined && status.remainingCents !== undefined) {
        lines.push(
          `Budget: ${status.state.toUpperCase()} (limit ${formatMoney(status.monthlyLimitCents, currency)}, remaining ${formatMoney(status.remainingCents, currency)})`,
        );
      }
      return lines.join("\n");
    }
    default:
      return USAGE;
  }
}

try {
  console.log(run(process.argv.slice(2)));
} catch (err) {
  console.error(`Error: ${(err as Error).message}`);
  process.exitCode = 1;
}
