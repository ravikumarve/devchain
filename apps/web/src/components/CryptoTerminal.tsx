const termLines = [
  {
    time: '[00:01]',
    content: (
      <>
        <span className="tl-sys">CLIENT:</span> Initiated POST{' '}
        <span style={{ color: 'var(--text-main)' }}>/api/v1/products/purchase</span>
      </>
    ),
  },
  {
    time: '[00:02]',
    content: (
      <>
        <span className="tl-sys">SYSTEM:</span> Processing Stripe payment intent parameters...
      </>
    ),
  },
  {
    time: '[00:04]',
    content: (
      <>
        <span className="tl-sys">SYSTEM:</span> Generating cryptographic ownership certificate...
      </>
    ),
  },
  {
    time: '[00:05]',
    content: (
      <span className="tl-hash">
        HASH: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
      </span>
    ),
  },
  {
    time: '[00:06]',
    content: (
      <>
        <span style={{ color: 'var(--success-green)', fontWeight: 600 }}>[SUCCESS]</span>{' '}
        Certificate verified. Unlocking Supabase storage files.
      </>
    ),
  },
  {
    time: '>',
    content: (
      <>
        Awaiting next transaction{' '}
        <span style={{ animation: 'blink 1s infinite' }}>_</span>
      </>
    ),
    isPrompt: true,
  },
];

export default function CryptoTerminal() {
  return (
    <div className="crypto-terminal">
      <div className="term-header">
        <div>DEVCHAIN_OS // VERIFICATION_NODE</div>
        <div>STATUS: CONNECTED</div>
      </div>
      {termLines.map((line, i) => (
        <div
          key={i}
          className="term-line"
          style={line.isPrompt ? { marginTop: 12, color: 'var(--eth-purple)' } : undefined}
        >
          <span className="tl-time">{line.time}</span>
          <span>{line.content}</span>
        </div>
      ))}
    </div>
  );
}
