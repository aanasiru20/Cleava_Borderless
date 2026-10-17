export default function MobileFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-start justify-center overflow-hidden bg-[#070d1a]">
      <div
        aria-label="Mobile app frame"
        className="relative z-10 flex min-h-screen w-full max-w-[390px] flex-col overflow-hidden bg-[#0f172a] md:shadow-2xl md:shadow-black/50"
      >
        {children}
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 25%, #22c55e 0%, transparent 50%), radial-gradient(circle at 75% 75%, #3b82f6 0%, transparent 50%)",
        }}
      />
    </div>
  );
}
