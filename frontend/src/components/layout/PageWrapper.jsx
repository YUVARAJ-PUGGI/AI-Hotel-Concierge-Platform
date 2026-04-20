export default function PageWrapper({ children }) {
  return <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-10 animate-fade-in">{children}</main>;
}
