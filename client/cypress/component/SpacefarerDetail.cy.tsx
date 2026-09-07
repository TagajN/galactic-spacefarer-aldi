/// <reference path="../support/component.d.ts" />

import { SpacefarerDetailPageObject } from "../support/pageObjects/SpacefarerDetailPageObject";
import SpacefarerDetail from "../../src/pages/SpacefarerDetail";
import { AuthProvider } from "../../src/context/AuthContext";
import type { Spacefarer } from "../../src/types";

const page = new SpacefarerDetailPageObject();

const SF: Spacefarer = {
  id: "S1",
  name: "Alice Starborn",
  email: "alice@galactic.space",
  origin_planet: "PlanetX",
  spacesuit_color: "Silver",
  stardust_collection: 500,
  wormhole_navigation_skill: 8,
  status: "ACTIVE",
  launch_date: "2024-01-15T09:00:00Z",
  department_id: "D1",
  position_id: "P3",
  department_name: "Stellar Engineering",
  position_title: "Pilot",
  position_rank: 3,
  created_at: "2024-01-15T09:00:00Z",
  modified_at: "2024-01-15T09:00:00Z",
};

function stubRefData() {
  cy.intercept("GET", "/api/departments", {
    statusCode: 200,
    body: [{ id: "D1", name: "Stellar Engineering", galaxy: "Milky Way" }],
  }).as("depts");
  cy.intercept("GET", "/api/positions", {
    statusCode: 200,
    body: [{ id: "P3", title: "Pilot", rank: 3 }],
  }).as("positions");
}

function mountAsAdmin(sf = SF) {
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
      <SpacefarerDetail
        spacefarer={sf}
        onBack={cy.stub().as("onBack")}
        onUpdated={cy.stub().as("onUpdated")}
      />
    </AuthProvider>,
  );
}

describe("SpacefarerDetail", () => {
  beforeEach(stubRefData);

  it("renders spacefarer name and planet in the header", () => {
    mountAsAdmin();
    cy.contains("Alice Starborn").should("be.visible");
    cy.contains("PlanetX").should("be.visible");
  });

  it("shows the Edit button for an admin user", () => {
    mountAsAdmin();
    page.editButton().should("be.visible");
  });

  it("switches to the edit form when Edit is clicked", () => {
    mountAsAdmin();
    page.clickEdit();
    page.saveButton().should("be.visible");
    page.cancelButton().should("be.visible");
  });

  it("calls PATCH /api/spacefarers/:id with updated values on Save", () => {
    cy.intercept("PATCH", "/api/spacefarers/S1", {
      statusCode: 200,
      body: { ...SF, spacesuit_color: "Gold" },
    }).as("patchReq");

    mountAsAdmin();
    page.clickEdit();
    page.fillSpacsuitColor("Gold");
    page.save();

    cy.wait("@patchReq")
      .its("request.body")
      .should("include", { spacesuitColor: "Gold" });
    cy.get("@onUpdated").should("have.been.called");
  });

  it("reverts to read view on Cancel without saving", () => {
    mountAsAdmin();
    page.clickEdit();
    page.cancel();
    page.editButton().should("be.visible");
    page.saveButton().should("not.exist");
  });

  it("calls onBack when the Back button is clicked", () => {
    mountAsAdmin();
    page.backButton().click();
    cy.get("@onBack").should("have.been.calledOnce");
  });

  it("updates status via the status dropdown", () => {
    cy.intercept("PATCH", "/api/spacefarers/S1", {
      statusCode: 200,
      body: { ...SF, status: "RETIRED" },
    }).as("patchReq");

    mountAsAdmin();
    page.clickEdit();
    page.statusSelect().select("RETIRED");
    page.save();

    cy.wait("@patchReq")
      .its("request.body")
      .should("include", { status: "RETIRED" });
  });

  it("updates department via the department dropdown", () => {
    cy.intercept("PATCH", "/api/spacefarers/S1", {
      statusCode: 200,
      body: {
        ...SF,
        department_id: "D1",
        department_name: "Stellar Engineering",
      },
    }).as("patchReq");

    mountAsAdmin();
    cy.wait("@depts");
    page.clickEdit();
    cy.get("select").contains("Stellar Engineering").parent().select("D1");
    page.save();

    cy.wait("@patchReq")
      .its("request.body")
      .should("include", { departmentId: "D1" });
  });

  it("shows error message when PATCH fails", () => {
    cy.intercept("PATCH", "/api/spacefarers/S1", {
      statusCode: 400,
      body: { error: "Invalid wormhole skill" },
    }).as("patchFail");

    mountAsAdmin();
    page.clickEdit();
    page.save();

    cy.wait("@patchFail");
    page.errorMessage().should("contain.text", "Invalid wormhole skill");
  });
});

describe("SpacefarerDetail — additional coverage", () => {
  const SF_NULL: typeof SF = {
    ...SF,
    launch_date: null,
    position_id: null,
    position_title: undefined,
    position_rank: undefined,
    department_id: null,
    department_name: undefined,
  };

  beforeEach(stubRefData);

  it("shows — for launch date when null", () => {
    mountAsAdmin(SF_NULL);
    cy.contains("p", "—").should("exist");
  });

  it("shows — for position when not assigned", () => {
    mountAsAdmin(SF_NULL);
    cy.get(".grid").contains("—").should("exist");
  });

  it("hides Edit button for viewer users", () => {
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
        <SpacefarerDetail
          spacefarer={SF}
          onBack={cy.stub()}
          onUpdated={cy.stub()}
        />
      </AuthProvider>,
    );
    cy.contains("button", "Edit").should("not.exist");
  });

  it("sends updated name and email in PATCH request", () => {
    cy.intercept("PATCH", "/api/spacefarers/S1", {
      statusCode: 200,
      body: SF,
    }).as("patch");
    mountAsAdmin();
    page.clickEdit();
    page.nameInput().clear().type("Zara Nova");
    page.emailInput().clear().type("zara@galactic.space");
    page.save();
    cy.wait("@patch").its("request.body").should("deep.include", {
      name: "Zara Nova",
      email: "zara@galactic.space",
    });
  });

  it("sends updated stardust and wormhole skill in PATCH request", () => {
    cy.intercept("PATCH", "/api/spacefarers/S1", {
      statusCode: 200,
      body: SF,
    }).as("patch");
    mountAsAdmin();
    page.clickEdit();
    page.stardustInput().type("{selectall}999");
    page.skillInput().type("{selectall}10");
    page.save();
    cy.wait("@patch").its("request.body").should("deep.include", {
      stardustCollection: 999,
      wormholeNavigationSkill: 10,
    });
  });

  it("sends updated positionId when position is selected", () => {
    cy.intercept("PATCH", "/api/spacefarers/S1", {
      statusCode: 200,
      body: SF,
    }).as("patch");
    mountAsAdmin();
    cy.wait("@positions");
    page.clickEdit();
    cy.get("select").last().select("P3");
    page.save();
    cy.wait("@patch")
      .its("request.body")
      .should("include", { positionId: "P3" });
  });

  it("sends undefined departmentId when — None — is selected", () => {
    cy.intercept("PATCH", "/api/spacefarers/S1", {
      statusCode: 200,
      body: SF,
    }).as("patch");
    mountAsAdmin();
    cy.wait("@depts");
    page.clickEdit();
    cy.get("select").eq(1).select("");
    page.save();
    cy.wait("@patch")
      .its("request.body")
      .should("not.have.property", "departmentId");
  });

  it("disables Save button and shows Saving… while request is in flight", () => {
    cy.intercept("PATCH", "/api/spacefarers/S1", {
      delay: 3000,
      statusCode: 200,
      body: SF,
    });
    mountAsAdmin();
    page.clickEdit();
    page.save();
    page.saveButton().should("be.disabled").and("contain.text", "Saving");
  });
});
