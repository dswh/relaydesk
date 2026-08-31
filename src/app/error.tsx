"use client";

export default function GlobalRouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="error-screen">
      <span>RelayDesk</span>
      <h1>This workspace could not load.</h1>
      <p>Retry the request. If it continues, check the service health endpoint.</p>
      <button className="primary-button" onClick={reset} type="button">Try again</button>
    </div>
  );
}
