import TransactionForm from "@/components/TransactionForm";

export default function TambahPage() {
  return (
    <div>
      <div className="sticky top-0 z-10 bg-white border-b border-zinc-200 px-4 py-3">
        <h1 className="text-base font-bold">Tambah Transaksi</h1>
        <p className="text-xs text-zinc-500">Pendapatan (orderan) atau pengeluaran harian</p>
      </div>
      <TransactionForm />
    </div>
  );
}
