/// <reference path="../support/component.d.ts" />

import { LoginPageObject } from "../support/pageObjects/LoginPageObject";
import LoginPage from "../../src/pages/LoginPage";
import { AuthProvider } from "../../src/context/AuthContext";

const page = new LoginPageObject();

describe("LoginPage", () => {
  beforeEach(() => {
    cy.mount(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );
  });

  it("renders the login form", () => {
    cy.contains("Galactic Spacefarer").should("be.visible");
    page.usernameInput().should("exist");
    page.passwordInput().should("exist");
    page.submitButton().should("contain.text", "Launch Mission");
  });

  it("shows an error message when credentials are invalid", () => {
    cy.intercept("POST", "/api/auth/login", {
      statusCode: 401,
      body: { error: "Invalid credentials" },
    }).as("loginReq");

    page.login("wrong", "wrong");

    cy.wait("@loginReq");
    page.errorMessage().should("contain.text", "Invalid credentials");
  });

  it("calls POST /api/auth/login with entered credentials", () => {
    cy.intercept("POST", "/api/auth/login", {
      statusCode: 200,
      body: {
        token: "fake-token",
        user: { id: "U1", username: "alice", role: "admin", planet: "PlanetX" },
      },
    }).as("loginReq");

    page.login("alice", "alice");

    cy.wait("@loginReq").its("request.body").should("deep.equal", {
      username: "alice",
      password: "alice",
    });
  });

  it("shows loading text immediately after submit", () => {
    cy.intercept("POST", "/api/auth/login", {
      delay: 3000,
      statusCode: 200,
      body: {
        token: "t",
        user: { id: "U1", username: "alice", role: "admin", planet: "PlanetX" },
      },
    });

    page.fillUsername("alice").fillPassword("alice").submit();
    page.submitButton().should("contain.text", "Launching");
    page.submitButton().should("be.disabled");
  });
});
