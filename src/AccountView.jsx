import React from "react";
import { HanboroLogo } from "./HanboroLogo";

function formatMoney(money) {
  if (!money?.amount) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: money.currencyCode || "INR",
    maximumFractionDigits: 0,
  }).format(Number(money.amount));
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function AccountView({ customer, onLogin, onLogout, onShopNow, onNavigateHome }) {
  const orders = customer?.orders?.edges?.map((edge) => edge.node).filter(Boolean) || [];
  const address = customer?.defaultAddress?.formatted;
  const formattedAddress = Array.isArray(address) ? address.join(", ") : address;

  return (
    <section className="account-view" aria-labelledby="account-view-title">
      <div className="account-view__ambient" aria-hidden="true" />
      <div className="account-view__shell">
        <button type="button" className="account-view__brand" onClick={onNavigateHome}>
          <HanboroLogo theme="light" size={22} />
        </button>

        {!customer ? (
          <div className="account-view__empty">
            <p className="account-view__eyebrow">COLLECTOR ACCOUNT</p>
            <h1 id="account-view-title">Your private HANBORO profile.</h1>
            <p>Sign in securely with Shopify to view your profile and order history without leaving the new HANBORO experience.</p>
            <div className="account-view__actions">
              <button type="button" className="account-view__primary" onClick={onLogin}>Sign in securely</button>
              <button type="button" className="account-view__secondary" onClick={onShopNow}>Shop watches</button>
            </div>
          </div>
        ) : (
          <>
            <header className="account-view__hero">
              <div>
                <p className="account-view__eyebrow">PRIVATE COLLECTOR DOSSIER</p>
                <h1 id="account-view-title">Welcome, {customer.firstName || customer.displayName || "Collector"}.</h1>
                <p>Your Shopify profile and order history, presented inside HANBORO.</p>
              </div>
              <button type="button" className="account-view__primary" onClick={onShopNow}>Shop now</button>
            </header>

            <div className="account-view__grid">
              <article className="account-view__card">
                <span className="account-view__card-index">01</span>
                <p className="account-view__label">Profile</p>
                <h2>{customer.displayName || [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "HANBORO Collector"}</h2>
                <dl className="account-view__details">
                  <div><dt>Email</dt><dd>{customer.emailAddress?.emailAddress || "Not provided"}</dd></div>
                  <div><dt>Phone</dt><dd>{customer.phoneNumber?.phoneNumber || "Not provided"}</dd></div>
                  <div><dt>Default address</dt><dd>{formattedAddress || "Not provided"}</dd></div>
                </dl>
              </article>

              <article className="account-view__card account-view__card--orders">
                <span className="account-view__card-index">02</span>
                <p className="account-view__label">Order history</p>
                <h2>{orders.length ? `${orders.length} recent ${orders.length === 1 ? "order" : "orders"}` : "No orders yet"}</h2>
                {orders.length ? (
                  <div className="account-view__orders">
                    {orders.map((order) => (
                      <div className="account-view__order" key={order.id}>
                        <div><strong>{order.name}</strong><span>{formatDate(order.processedAt)}</span></div>
                        <div><strong>{formatMoney(order.totalPrice)}</strong><span>{order.fulfillmentStatus || order.financialStatus || "Processing"}</span></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="account-view__muted">Your future Shopify orders will appear here automatically.</p>
                )}
              </article>
            </div>

            <div className="account-view__footer-actions">
              <button type="button" className="account-view__secondary" onClick={onShopNow}>Continue shopping</button>
              <button type="button" className="account-view__text-button" onClick={onLogout}>Sign out</button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

