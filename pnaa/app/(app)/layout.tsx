export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div>Navbar</div>
      {children}
    </>
  );
}
