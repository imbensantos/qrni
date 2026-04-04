/**
 * PrivacyPage data-consistency tests — S8
 *
 * Audit finding: the third-party service data is duplicated between two
 * separate render paths — a desktop <table> and a mobile <ul> of cards.
 * Because the data lives in two separate hardcoded structures, they can (and
 * already do) diverge in ways tests can catch:
 *
 *   1. Having two independent lists means a provider can be added to one
 *      and forgotten in the other. These tests enforce parity between both
 *      views so any future divergence is caught immediately.
 *
 * Tests:
 *   - S8-1: provider count matches
 *   - S8-2: provider names match
 *   - S8-3: links are present in mobile cards for rows that have them in
 *     the table
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import PrivacyPage from "./PrivacyPage";

// ── Dependency mocks ─────────────────────────────────────────────────────────

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    ...rest
  }: {
    to: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("../../components/layout/AppFooter", () => ({
  default: () => null,
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function getTableRows(container: HTMLElement): Element[] {
  return Array.from(container.querySelectorAll(".privacy-table tbody tr"));
}

function getServiceCards(container: HTMLElement): Element[] {
  return Array.from(container.querySelectorAll(".privacy-service-card"));
}

function getTableProviders(container: HTMLElement): string[] {
  return getTableRows(container).map(
    (row) => row.querySelectorAll("td")[0]?.textContent?.trim() ?? "",
  );
}

function getCardProviders(container: HTMLElement): string[] {
  return getServiceCards(container).map(
    (card) => card.querySelector(".privacy-service-card__provider")?.textContent?.trim() ?? "",
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("PrivacyPage — S8: third-party service data consistency", () => {
  it("desktop table and mobile cards list the same set of providers in the same order", () => {
    // This documents the intended parity and will catch future additions to one
    // list that are not reflected in the other.
    const { container } = render(<PrivacyPage />);

    const tableProviders = getTableProviders(container);
    const cardProviders = getCardProviders(container);

    expect(tableProviders.length).toBeGreaterThan(0);
    expect(tableProviders).toEqual(cardProviders);
  });

  it("desktop table and mobile cards show identical purposes for each provider", () => {
    const { container } = render(<PrivacyPage />);

    const tablePurposes = getTableRows(container).map(
      (row) => row.querySelectorAll("td")[1]?.textContent?.trim() ?? "",
    );
    const cardPurposes = getServiceCards(container).map(
      (card) => card.querySelector(".privacy-service-card__purpose")?.textContent?.trim() ?? "",
    );

    expect(tablePurposes).toEqual(cardPurposes);
  });

  it("mobile service cards contain anchor links for every row that has links in the desktop table", () => {
    const { container } = render(<PrivacyPage />);

    const tableRows = getTableRows(container);
    const cards = getServiceCards(container);

    // Find table rows whose third cell contains a link.
    const tableRowsWithLinks = tableRows.filter((row) => {
      const dataCell = row.querySelectorAll("td")[2];
      return dataCell && dataCell.querySelectorAll("a").length > 0;
    });

    // There must be at least one such row (e.g. Vercel has a link).
    expect(tableRowsWithLinks.length).toBeGreaterThan(0);

    // For each table row that has a link, find the matching mobile card by
    // provider name and assert it also contains an anchor.
    tableRowsWithLinks.forEach((row) => {
      const provider = row.querySelectorAll("td")[0]?.textContent?.trim();
      const matchingCard = cards.find(
        (card) =>
          card.querySelector(".privacy-service-card__provider")?.textContent?.trim() === provider,
      );

      expect(matchingCard).toBeDefined();

      const linksInCard = matchingCard?.querySelectorAll(".privacy-service-card__data a");
      // The card's data cell must contain at least one anchor element.
      expect(linksInCard?.length).toBeGreaterThan(0);
    });
  });

  it("the number of external links is the same in the table and in all mobile cards combined", () => {
    // Both views should have the same number of external links.
    const { container } = render(<PrivacyPage />);

    // Links inside table data cells only (exclude header links if any).
    const tableDataLinks = container.querySelectorAll(".privacy-table tbody td a");

    // Links inside mobile card data fields.
    const cardDataLinks = container.querySelectorAll(".privacy-service-card__data a");

    expect(tableDataLinks.length).toBeGreaterThan(0);
    expect(cardDataLinks.length).toBe(tableDataLinks.length);
  });
});
