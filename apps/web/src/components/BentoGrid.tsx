const bentoNodes = [
  {
    idx: '01 // DIGITAL COMMERCE',
    title: 'Sell Digital Products',
    desc: 'Monetize templates, tools, courses, and scripts. DevChain handles the entire lifecycle—from secure Stripe checkout sessions to instant automated file delivery via Supabase Storage.',
    span: 'span-8',
  },
  {
    idx: '02 // CRYPTOGRAPHIC PROOF',
    title: 'SHA-256 Certified',
    desc: 'Protect your intellectual property. Every single purchase generates a verifiable cryptographic certificate mathematically proving ownership — no blockchain required.',
    span: 'span-4',
  },
  {
    idx: '03 // SELLER INFRASTRUCTURE',
    title: 'Real-time Analytics',
    desc: 'Track sales velocity, revenue metrics, and product performance from a dedicated seller dashboard built natively in React 19.',
    span: 'span-6',
  },
  {
    idx: '04 // FREELANCE SERVICES',
    title: 'Job Board & Proposals',
    desc: 'Transition from products to services seamlessly. Post development jobs, submit proposals, hire developers securely, and manage project milestones.',
    span: 'span-6',
  },
];

export default function BentoGrid() {
  return (
    <div className="bento-matrix">
      {bentoNodes.map((node) => (
        <div key={node.idx} className={`bento-node ${node.span}`}>
          <span className="node-idx">{node.idx}</span>
          <h3>{node.title}</h3>
          <p>{node.desc}</p>
        </div>
      ))}
    </div>
  );
}
