import { ArrowUpRight, Search, UsersRound } from "lucide-react";
import type { Metadata } from "next";

import { tickets } from "@/lib/tickets";

export const metadata: Metadata = {
  title: "Customers",
};

export default function CustomersPage() {
  const customers = Array.from(
    new Map(tickets.map((ticket) => [ticket.customer.id, ticket.customer])).values(),
  );

  return (
    <div className="section-screen">
      <header className="section-header">
        <div>
          <div className="page-kicker"><span /> Customer intelligence</div>
          <h1>Customers</h1>
          <p>See account context before it becomes a support problem.</p>
        </div>
        <button className="primary-button" type="button">Add customer</button>
      </header>

      <section className="directory-card">
        <div className="directory-toolbar">
          <label className="directory-search">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">Search customers</span>
            <input placeholder="Search customers" type="search" />
          </label>
          <span>{customers.length} active accounts</span>
        </div>
        <div className="customer-table" role="table" aria-label="Customers">
          <div className="customer-table-head" role="row">
            <span role="columnheader">Customer</span>
            <span role="columnheader">Plan</span>
            <span role="columnheader">Health</span>
            <span role="columnheader">Relationship</span>
            <span role="columnheader">Value</span>
            <span role="columnheader" aria-label="Open customer" />
          </div>
          {customers.map((customer) => (
            <button className="customer-table-row" key={customer.id} role="row" type="button">
              <span className="customer-name-cell" role="cell">
                <i>{customer.initials}</i>
                <span><strong>{customer.name}</strong><small>{customer.company}</small></span>
              </span>
              <span role="cell"><b className="plan-badge">{customer.plan}</b></span>
              <span role="cell"><b className={`health-badge ${customer.health}`}><i /> {customer.health}</b></span>
              <span role="cell">Since {customer.since}</span>
              <span role="cell" className="utility-value">{customer.lifetimeValue}</span>
              <span role="cell"><ArrowUpRight size={16} aria-hidden="true" /></span>
            </button>
          ))}
        </div>
      </section>

      <div className="customer-note">
        <span><UsersRound size={18} aria-hidden="true" /></span>
        <p><strong>One shared customer record.</strong> Conversations, health, plan, and revenue context stay attached to the account.</p>
      </div>
    </div>
  );
}
