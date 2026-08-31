import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="section-screen settings-screen">
      <header className="section-header"><div><div className="page-kicker"><span /> Workspace controls</div><h1>Settings</h1><p>Manage your workspace, team, channels, and service policies.</p></div></header>
      <section className="settings-card">
        <nav aria-label="Settings sections"><button className="active" type="button">General</button><button type="button">Team</button><button type="button">Channels</button><button type="button">SLAs</button><button type="button">AI assistant</button></nav>
        <form>
          <label><span>Workspace name</span><input defaultValue="Northstar Labs" /></label>
          <label><span>Support email</span><input defaultValue="support@northstarlabs.com" type="email" /></label>
          <label><span>Default timezone</span><select defaultValue="America/Los_Angeles"><option value="America/Los_Angeles">Pacific time</option><option value="America/New_York">Eastern time</option><option value="Europe/London">London</option></select></label>
          <div className="form-actions"><button className="primary-button" type="button">Save changes</button></div>
        </form>
      </section>
    </div>
  );
}
