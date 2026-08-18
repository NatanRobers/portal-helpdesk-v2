export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-paper shadow-2xl">
      {children}
    </div>
  );
}
