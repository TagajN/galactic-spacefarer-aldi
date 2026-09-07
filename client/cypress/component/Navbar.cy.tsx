/// <reference path="../support/component.d.ts" />

import Navbar from "../../src/components/Navbar";
import { AuthProvider } from "../../src/context/AuthContext";

function mountAsAdmin() {
  localStorage.setItem(
    "user",
    JSON.stringify({
      id: "U1",
      username: "alice",
      role: "admin",
      planet: "PlanetX",
    }),
  );
  localStorage.setItem("token", "fake-token");
  cy.mount(
    <AuthProvider>
      <Navbar />
    </AuthProvider>,
  );
}

function mountAsViewer() {
  localStorage.setItem(
    "user",
    JSON.stringify({
      id: "U3",
      username: "carol",
      role: "viewer",
      planet: "PlanetX",
    }),
  );
  localStorage.setItem("token", "fake-token");
  cy.mount(
    <AuthProvider>
      <Navbar />
    </AuthProvider>,
  );
}

describe("Navbar", () => {
  it("shows username, planet badge and admin badge for admin user", () => {
    mountAsAdmin();
    cy.contains("alice").should("be.visible");
    cy.contains("PlanetX").should("be.visible");
    cy.contains("admin").should("be.visible");
  });

  it("does not show admin badge for viewer user", () => {
    mountAsViewer();
    cy.contains("carol").should("be.visible");
    cy.contains("admin").should("not.exist");
  });

  it("clears localStorage and removes user on sign out — covers logout()", () => {
    mountAsAdmin();

    cy.window()
      .its("localStorage")
      .invoke("getItem", "token")
      .should("eq", "fake-token");

    cy.contains("button", "Sign out").click();

    cy.window()
      .its("localStorage")
      .invoke("getItem", "token")
      .should("be.null");
    cy.window().its("localStorage").invoke("getItem", "user").should("be.null");
  });
});
