export const ChannelComponents = {
  Title: ({ children }: { children: React.ReactNode }) => (
    <h1 className="text-5xl font-bold text-gray-900 mb-6">
      {children}
    </h1>
  ),

  Subtitle: ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-4xl font-bold text-blue-600 mb-6 block">
      {children}
    </h2>
  ),

  Text: ({ children }: { children: React.ReactNode }) => (
    <div className="text-lg text-gray-700 mb-6 max-w-4xl mx-auto text-left">
      {children}
    </div>
  ),

  Box: ({ children }: { children: React.ReactNode }) => (
    <div className="bg-white bg-opacity-70 p-6 rounded-lg mb-6 max-w-4xl mx-auto text-left">
      {children}
    </div>
  ),

  // Standard markdown elements inside boxes
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-xl font-semibold text-gray-900 mb-4">{children}</h3>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="list-disc list-inside space-y-2 text-gray-800">{children}</ul>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li>{children}</li>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="mb-4">{children}</p>
  ),
  a: ({ href, children }: { href?: string; children: React.ReactNode }) => (
    <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong className="font-semibold">{children}</strong>
  ),
};
