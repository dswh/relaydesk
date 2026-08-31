import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="error-screen">
      <span>404</span>
      <h1>That page is not in this workspace.</h1>
      <p>The link may be outdated or you may not have access.</p>
      <Link className="primary-button" href="/inbox">Return to inbox</Link>
    </div>
  );
}
