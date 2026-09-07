import { mount } from "cypress/react";
import "../../src/index.css";
import "@cypress/code-coverage/support";

// Make cy.mount available globally in all component tests
Cypress.Commands.add("mount", mount);

// Auto-reset stubs between tests
beforeEach(() => {
  cy.window().then((win) => {
    win.localStorage.clear();
  });
});
