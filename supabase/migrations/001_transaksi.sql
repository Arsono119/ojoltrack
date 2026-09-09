-- OjolTrack: transaksi per-user, mirror Data_Model_OjolTrack.md + user_id
create table if not exists transaksi (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  tipe text not null check (tipe in ('pendapatan','pengeluaran')),
  tanggal text not null check (tanggal ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  waktu text check (waktu is null or waktu ~ '^[0-9]{2}:[0-9]{2}$'),
  nominal integer not null check (nominal > 0 and nominal <= 1000000000),
  platform text check (platform is null or platform in ('Shopee Drive','Grab','Lainnya')),
  jarak_km double precision check (jarak_km is null or jarak_km > 0),
  rp_per_km integer check (rp_per_km is null or rp_per_km > 0),
  kategori text check (kategori is null or kategori in ('bensin','makan','servis','lainnya')),
  catatan text check (char_length(catatan) <= 500),
  sumber_input text not null check (sumber_input in ('manual','screenshot')),
  created_at timestamptz not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_transaksi_user_tanggal on transaksi(user_id, tanggal);
create index if not exists idx_transaksi_user_updated on transaksi(user_id, updated_at);
alter table transaksi enable row level security;
drop policy if exists "own rows" on transaksi;
create policy "own rows" on transaksi for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
