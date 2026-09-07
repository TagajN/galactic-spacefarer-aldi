/// <reference path="../support/component.d.ts" />
import { CreateModalPageObject } from "../support/pageObjects/CreateModalPageObject";
import CreateSpacefarerModal from "../../src/components/CreateSpacefarerModal";
import { AuthProvider } from "../../src/context/AuthContext";

const page = new CreateModalPageObject();

function stubRefData() {
  cy.intercept("GET", "/api/departments", {
    statusCode: 200,
    body: [{ id: "D1", name: "Stellar Engineering", galaxy: "Milky Way" }],
  }).as("depts");
  cy.intercept("GET", "/api/positions", {
    statusCode: 200,
    body: [{ id: "P1", title: "Cadet", rank: 1 }],
  }).as("positions");
}

function mountModal() {
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
      <CreateSpacefarerModal
        onCreated={cy.stub().as("onCreated")}
        onCancel={cy.stub().as("onCancel")}
      />
    </AuthProvider>,
  );
}

describe("CreateSpacefarerModal", () => {
  beforeEach(() => {
    stubRefData();
    mountModal();
  });

  it("renders the modal with all required fields", () => {
    cy.contains("New Spacefarer").should("be.visible");
    page.nameInput().should("exist");
    page.emailInput().should("exist");
    page.planetInput().should("exist");
  });

  it("sends a POST to /api/spacefarers with correct payload", () => {
    cy.intercept("POST", "/api/spacefarers", {
      statusCode: 201,
      body: { id: "S-new", name: "Zara Nova" },
    }).as("createReq");

    page.fill({
      name: "Zara Nova",
      email: "zara@galactic.space",
      planet: "PlanetX",
    });
    page.submit();

    cy.wait("@createReq").its("request.body").should("deep.include", {
      name: "Zara Nova",
      email: "zara@galactic.space",
      originPlanet: "PlanetX",
    });
  });

  it("calls onCreated after a successful submission", () => {
    cy.intercept("POST", "/api/spacefarers", {
      statusCode: 201,
      body: { id: "S-new", name: "Zara Nova" },
    });
    page.fill({
      name: "Zara Nova",
      email: "zara@galactic.space",
      planet: "PlanetX",
    });
    page.submit();
    cy.get("@onCreated").should("have.been.calledOnce");
  });

  it("shows an error message when the API returns an error", () => {
    cy.intercept("POST", "/api/spacefarers", {
      statusCode: 400,
      body: { error: "Email already exists" },
    });
    page.fill({ name: "Dup", email: "dup@galactic.space", planet: "PlanetX" });
    page.submit();
    page.errorMessage().should("contain.text", "Email already exists");
  });

  it("calls onCancel when the Cancel button is clicked", () => {
    page.cancel();
    cy.get("@onCancel").should("have.been.calledOnce");
  });

  it("shows loading text immediately after submit", () => {
    cy.intercept("POST", "/api/spacefarers", {
      delay: 3000,
      statusCode: 201,
      body: { id: "S-new", name: "Zara Nova" },
    });
    page.fill({
      name: "Zara Nova",
      email: "zara@galactic.space",
      planet: "PlanetX",
    });
    page.submit();
    page.submitButton().should("contain.text", "Launching");
    page.submitButton().should("be.disabled");
  });
});

describe("CreateSpacefarerModal — additional coverage", () => {
  beforeEach(() => {
    stubRefData();
    mountModal();
  });

  it("calls onCancel when the header × button is clicked", () => {
    cy.get("button").contains("×").click();
    cy.get("@onCancel").should("have.been.calledOnce");
  });

  it("sends updated spacesuit color when changed", () => {
    cy.intercept("POST", "/api/spacefarers", {
      statusCode: 201,
      body: { id: "S-new" },
    }).as("req");
    page.fill({ name: "Zara", email: "zara@g.space", planet: "PlanetX" });
    page.colorInput().clear().type("Cyan");
    page.submit();
    cy.wait("@req")
      .its("request.body")
      .should("include", { spacesuitColor: "Cyan" });
  });

  it("sends updated stardust collection when changed", () => {
    cy.intercept("POST", "/api/spacefarers", {
      statusCode: 201,
      body: { id: "S-new" },
    }).as("req");
    page.fill({ name: "Zara", email: "zara@g.space", planet: "PlanetX" });
    page.stardustInput().type("{selectall}250");
    page.submit();
    cy.wait("@req")
      .its("request.body")
      .should("include", { stardustCollection: 250 });
  });

  it("sends updated wormhole skill when changed", () => {
    cy.intercept("POST", "/api/spacefarers", {
      statusCode: 201,
      body: { id: "S-new" },
    }).as("req");
    page.fill({ name: "Zara", email: "zara@g.space", planet: "PlanetX" });
    page.skillInput().type("{selectall}9");
    page.submit();
    cy.wait("@req")
      .its("request.body")
      .should("include", { wormholeNavigationSkill: 9 });
  });

  it("sends departmentId when a department is selected", () => {
    cy.intercept("POST", "/api/spacefarers", {
      statusCode: 201,
      body: { id: "S-new" },
    }).as("req");
    cy.wait("@depts");
    page.fill({ name: "Zara", email: "zara@g.space", planet: "PlanetX" });
    cy.get("select").first().select("D1");
    page.submit();
    cy.wait("@req")
      .its("request.body")
      .should("include", { departmentId: "D1" });
  });

  it("sends positionId when a position is selected", () => {
    cy.intercept("POST", "/api/spacefarers", {
      statusCode: 201,
      body: { id: "S-new" },
    }).as("req");
    cy.wait("@positions");
    page.fill({ name: "Zara", email: "zara@g.space", planet: "PlanetX" });
    cy.get("select").last().select("P1");
    page.submit();
    cy.wait("@req").its("request.body").should("include", { positionId: "P1" });
  });

  it("allows changing the pre-filled origin planet", () => {
    cy.intercept("POST", "/api/spacefarers", {
      statusCode: 201,
      body: { id: "S-new" },
    }).as("req");
    page.fill({ name: "Zara", email: "zara@g.space", planet: "PlanetZ" });
    page.submit();
    cy.wait("@req")
      .its("request.body")
      .should("include", { originPlanet: "PlanetZ" });
  });
});
