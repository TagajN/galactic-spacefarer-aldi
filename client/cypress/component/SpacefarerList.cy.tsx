/// <reference path="../support/component.d.ts" />

import { SpacefarerListPageObject } from "../support/pageObjects/SpacefarerListPageObject";
import SpacefarerList from "../../src/pages/SpacefarerList";
import { AuthProvider } from "../../src/context/AuthContext";
import type { Spacefarer } from "../../src/types";

const page = new SpacefarerListPageObject();

const ALICE: Spacefarer = {
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

const DAVE: Spacefarer = {
  ...ALICE,
  id: "S4",
  name: "Dave Pulsar",
  email: "dave@galactic.space",
  spacesuit_color: "Red",
  stardust_collection: 150,
  wormhole_navigation_skill: 4,
  status: "CANDIDATE",
};

function stubListApi(data: Spacefarer[] = [ALICE, DAVE]) {
  cy.intercept("GET", "/api/spacefarers*", {
    statusCode: 200,
    body: { data, total: data.length, page: 1, pageSize: 10 },
  }).as("getSpacefarers");
}

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
      <SpacefarerList onSelect={cy.stub().as("onSelect")} />
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
      <SpacefarerList onSelect={cy.stub().as("onSelect")} />
    </AuthProvider>,
  );
}

describe("SpacefarerList", () => {
  it("renders rows returned from the API", () => {
    stubListApi();
    mountAsAdmin();
    cy.wait("@getSpacefarers");
    page.tableRows().should("have.length", 2);
    page.rowByName("Alice Starborn").should("be.visible");
    page.rowByName("Dave Pulsar").should("be.visible");
  });

  it("shows total count in pagination area", () => {
    stubListApi();
    mountAsAdmin();
    cy.wait("@getSpacefarers");
    page.totalCount().should("contain.text", "2 spacefarers found");
  });

  it("calls onSelect when a row is clicked", () => {
    stubListApi();
    mountAsAdmin();
    cy.wait("@getSpacefarers");
    page.selectRow("Alice Starborn");
    cy.get("@onSelect").should(
      "have.been.calledWith",
      Cypress.sinon.match({ id: "S1" }),
    );
  });

  it("shows Retire and Delete buttons for admin", () => {
    stubListApi();
    mountAsAdmin();
    cy.wait("@getSpacefarers");
    page.retireButton("Alice Starborn").should("be.visible");
    page.deleteButton("Alice Starborn").should("be.visible");
  });

  it("hides Retire and Delete buttons for viewer", () => {
    stubListApi();
    mountAsViewer();
    cy.wait("@getSpacefarers");
    cy.contains("button", "Retire").should("not.exist");
    cy.contains("button", "Delete").should("not.exist");
  });

  it("sends status filter as query param when filter changes", () => {
    stubListApi([DAVE]);
    mountAsAdmin();
    cy.wait("@getSpacefarers");

    cy.intercept("GET", "/api/spacefarers*status=CANDIDATE*", {
      statusCode: 200,
      body: { data: [DAVE], total: 1, page: 1, pageSize: 10 },
    }).as("filteredReq");

    page.filterByStatus("CANDIDATE");
    cy.wait("@filteredReq")
      .its("request.url")
      .should("include", "status=CANDIDATE");
  });

  it("disables Prev button on the first page", () => {
    stubListApi();
    mountAsAdmin();
    cy.wait("@getSpacefarers");
    page.prevButton().should("be.disabled");
  });

  it("enables Next button and fetches page 2 when total > pageSize", () => {
    cy.intercept("GET", "/api/spacefarers*", {
      statusCode: 200,
      body: { data: [ALICE, DAVE], total: 25, page: 1, pageSize: 10 },
    }).as("page1");

    mountAsAdmin();
    cy.wait("@page1");
    page.nextButton().should("not.be.disabled");

    cy.intercept("GET", "/api/spacefarers*page=2*", {
      statusCode: 200,
      body: { data: [ALICE], total: 25, page: 2, pageSize: 10 },
    }).as("page2");

    page.nextButton().click();
    cy.wait("@page2").its("request.url").should("include", "page=2");
    cy.contains("Page 2").should("be.visible");
  });

  it("goes back to page 1 when Prev is clicked on page 2", () => {
    cy.intercept("GET", "/api/spacefarers*", {
      statusCode: 200,
      body: { data: [ALICE], total: 25, page: 1, pageSize: 10 },
    }).as("initial");

    mountAsAdmin();
    cy.wait("@initial");

    cy.intercept("GET", "/api/spacefarers*page=2*", {
      statusCode: 200,
      body: { data: [DAVE], total: 25, page: 2, pageSize: 10 },
    }).as("page2");
    page.nextButton().click();
    cy.wait("@page2");

    cy.intercept("GET", "/api/spacefarers*page=1*", {
      statusCode: 200,
      body: { data: [ALICE], total: 25, page: 1, pageSize: 10 },
    }).as("page1Again");
    page.prevButton().click();
    cy.wait("@page1Again").its("request.url").should("include", "page=1");
  });

  it("calls DELETE /api/spacefarers/:id and reloads list when Delete is confirmed", () => {
    stubListApi();
    mountAsAdmin();
    cy.wait("@getSpacefarers");

    cy.window().then((win) => cy.stub(win, "confirm").returns(true));

    cy.intercept("DELETE", "/api/spacefarers/S1", {
      statusCode: 204,
      body: null,
    }).as("deleteReq");

    cy.intercept("GET", "/api/spacefarers*", {
      statusCode: 200,
      body: { data: [DAVE], total: 1, page: 1, pageSize: 10 },
    }).as("reloaded");

    page.deleteButton("Alice Starborn").click();
    cy.wait("@deleteReq");
    cy.wait("@reloaded");
    page.tableRows().should("have.length", 1);
  });

  it("does NOT call DELETE when the confirm dialog is cancelled", () => {
    stubListApi();
    mountAsAdmin();
    cy.wait("@getSpacefarers");

    cy.window().then((win) => cy.stub(win, "confirm").returns(false));
    cy.intercept("DELETE", "/api/spacefarers/S1", cy.spy().as("deleteSpy"));

    page.deleteButton("Alice Starborn").click();
    cy.wait(300);
    cy.get("@deleteSpy").should("not.have.been.called");
  });

  it("calls PATCH /retire and reloads list", () => {
    stubListApi();
    mountAsAdmin();
    cy.wait("@getSpacefarers");

    cy.intercept("PATCH", "/api/spacefarers/S1/retire", {
      statusCode: 200,
      body: { ...ALICE, status: "RETIRED" },
    }).as("retireReq");

    cy.intercept("GET", "/api/spacefarers*", {
      statusCode: 200,
      body: {
        data: [{ ...ALICE, status: "RETIRED" }, DAVE],
        total: 2,
        page: 1,
        pageSize: 10,
      },
    }).as("reloaded");

    page.retireButton("Alice Starborn").click();
    cy.wait("@retireReq");
    cy.wait("@reloaded");
  });

  it("resets filters and re-fetches when Reset is clicked", () => {
    stubListApi([DAVE]);
    mountAsAdmin();
    cy.wait("@getSpacefarers");

    cy.intercept("GET", "/api/spacefarers*status=CANDIDATE*", {
      statusCode: 200,
      body: { data: [DAVE], total: 1, page: 1, pageSize: 10 },
    }).as("filtered");
    page.filterByStatus("CANDIDATE");
    cy.wait("@filtered");

    stubListApi([ALICE, DAVE]);
    page.resetButton().click();
    cy.wait("@getSpacefarers");
    page.tableRows().should("have.length", 2);
  });
});

describe("SpacefarerList — additional coverage", () => {
  it("shows error message when API call fails", () => {
    cy.intercept("GET", "/api/spacefarers*", {
      statusCode: 500,
      body: { error: "Server exploded" },
    }).as("fail");
    mountAsAdmin();
    cy.wait("@fail");
    cy.contains("Server exploded").should("be.visible");
  });

  it("shows empty-state row when no spacefarers are found", () => {
    cy.intercept("GET", "/api/spacefarers*", {
      statusCode: 200,
      body: { data: [], total: 0, page: 1, pageSize: 10 },
    });
    mountAsAdmin();
    cy.contains("No spacefarers found").should("be.visible");
  });

  it('shows singular "1 spacefarer found" when total is 1', () => {
    cy.intercept("GET", "/api/spacefarers*", {
      statusCode: 200,
      body: { data: [ALICE], total: 1, page: 1, pageSize: 10 },
    });
    mountAsAdmin();
    cy.contains("1 spacefarer found").should("be.visible");
  });

  it("disables Next button when already on the last page", () => {
    cy.intercept("GET", "/api/spacefarers*", {
      statusCode: 200,
      body: { data: [ALICE], total: 5, page: 1, pageSize: 10 },
    });
    mountAsAdmin();
    page.nextButton().should("be.disabled");
  });

  it("sends spacesuitColor as query param when filter is typed", () => {
    stubListApi();
    mountAsAdmin();
    cy.wait("@getSpacefarers");

    cy.intercept("GET", "/api/spacefarers*spacesuitColor=Silver*", {
      statusCode: 200,
      body: { data: [ALICE], total: 1, page: 1, pageSize: 10 },
    }).as("colourReq");

    page.colorFilter().type("Silver");
    cy.wait("@colourReq")
      .its("request.url")
      .should("include", "spacesuitColor=Silver");
  });

  it("toggles sort direction from Asc to Desc and triggers re-fetch", () => {
    stubListApi();
    mountAsAdmin();
    cy.wait("@getSpacefarers");

    cy.intercept("GET", "/api/spacefarers*sortDir=desc*", {
      statusCode: 200,
      body: { data: [DAVE, ALICE], total: 2, page: 1, pageSize: 10 },
    }).as("descReq");

    page.sortDirButton().click();
    cy.wait("@descReq").its("request.url").should("include", "sortDir=desc");
    page.sortDirButton().should("contain.text", "Desc");
  });

  it("toggles sort direction back to Asc after being set to Desc", () => {
    stubListApi();
    mountAsAdmin();
    cy.wait("@getSpacefarers");

    cy.intercept("GET", "/api/spacefarers*sortDir=desc*", {
      statusCode: 200,
      body: { data: [DAVE, ALICE], total: 2, page: 1, pageSize: 10 },
    });
    page.sortDirButton().click();

    cy.intercept("GET", "/api/spacefarers*", {
      statusCode: 200,
      body: { data: [ALICE, DAVE], total: 2, page: 1, pageSize: 10 },
    }).as("ascReq");
    page.sortDirButton().click();
    page.sortDirButton().should("contain.text", "Asc");
  });

  it("sends sortBy param when sort field is changed", () => {
    stubListApi();
    mountAsAdmin();
    cy.wait("@getSpacefarers");

    cy.intercept("GET", "/api/spacefarers*sortBy=stardust_collection*", {
      statusCode: 200,
      body: { data: [ALICE, DAVE], total: 2, page: 1, pageSize: 10 },
    }).as("sortReq");

    page.sortBy("stardust_collection");
    cy.wait("@sortReq")
      .its("request.url")
      .should("include", "sortBy=stardust_collection");
  });

  it("shows — when spacefarer has no department", () => {
    const noDept = {
      ...ALICE,
      department_id: null,
      department_name: undefined,
    };
    cy.intercept("GET", "/api/spacefarers*", {
      statusCode: 200,
      body: { data: [noDept], total: 1, page: 1, pageSize: 10 },
    });
    mountAsAdmin();
    cy.contains("td", "—").should("be.visible");
  });

  it("shows alert when Delete API call fails", () => {
    stubListApi();
    mountAsAdmin();
    cy.wait("@getSpacefarers");

    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);
      cy.stub(win, "alert").as("alertStub");
    });
    cy.intercept("DELETE", "/api/spacefarers/S1", {
      statusCode: 500,
      body: { error: "DB error" },
    });

    page.deleteButton("Alice Starborn").click();
    cy.get("@alertStub").should("have.been.calledWith", "DB error");
  });

  it("shows alert when Retire API call fails", () => {
    stubListApi();
    mountAsAdmin();
    cy.wait("@getSpacefarers");

    cy.window().then((win) => cy.stub(win, "alert").as("alertStub"));
    cy.intercept("PATCH", "/api/spacefarers/S1/retire", {
      statusCode: 500,
      body: { error: "Retire failed" },
    });

    page.retireButton("Alice Starborn").click();
    cy.get("@alertStub").should("have.been.calledWith", "Retire failed");
  });

  it("hides Retire button for already-RETIRED spacefarers", () => {
    const retired = { ...ALICE, status: "RETIRED" as const };
    cy.intercept("GET", "/api/spacefarers*", {
      statusCode: 200,
      body: { data: [retired], total: 1, page: 1, pageSize: 10 },
    });
    mountAsAdmin();
    cy.contains("tbody tr", "Alice Starborn").within(() => {
      cy.contains("button", "Retire").should("not.exist");
      cy.contains("button", "Delete").should("be.visible");
    });
  });
});
