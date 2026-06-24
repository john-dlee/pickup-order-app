

export default function AdminLayout({ children }: { children: React.ReactNode }) {


  return (
    <div className="mx-auto w-full max-w-md md:max-w-3xl lg:max-w-6xl min-h-screen bg-white px-4 sm:px-6 py-4">
      {children}
    </div>
  );
}