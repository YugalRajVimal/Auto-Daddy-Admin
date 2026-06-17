type ComingSoonProps = {
  title: string;
};

export default function ComingSoon({ title }: ComingSoonProps) {
  return (
    <div className="flex min-h-[40vh] flex-1 items-center justify-center bg-white px-6">
      <div className="rounded-t-2xl rounded-b-xl border border-ad-green-dark/30 bg-ad-green-light px-12 py-10 text-center shadow-sm">
        <p className="text-xl font-bold text-ad-green-dark">{title} — Coming Soon</p>
      </div>
    </div>
  );
}
