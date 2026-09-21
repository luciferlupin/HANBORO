import React from "react";

export function PolicyNavTabs({ activePolicy, onNavigatePolicy }) {
  const tabs = [
    { id: "privacy", label: "Privacy Policy" },
    { id: "shipping", label: "Shipping Policy" },
    { id: "refund", label: "Refund Policy" },
    { id: "terms", label: "Terms of Service" },
  ];

  return (
    <nav className="apple-policy-tabs" aria-label="Legal and Policy Navigation">
      <div className="apple-policy-tabs__inner">
        {tabs.map((tab) => {
          const isActive = activePolicy === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`apple-policy-tab-btn ${isActive ? "is-active" : ""}`}
              onClick={() => onNavigatePolicy && onNavigatePolicy(tab.id)}
              aria-current={isActive ? "page" : undefined}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
