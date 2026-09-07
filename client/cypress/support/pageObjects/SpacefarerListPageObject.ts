export class SpacefarerListPageObject {
  statusFilter() {
    return cy.get("select").first();
  }
  colorFilter() {
    return cy.get('input[placeholder*="Silver"]');
  }
  sortSelect() {
    return cy.get("select").eq(1);
  }
  sortDirButton() {
    return cy.contains("button", /Asc|Desc/);
  }
  resetButton() {
    return cy.contains("button", "Reset");
  }

  tableRows() {
    return cy
      .get("tbody tr")
      .not(':contains("Loading")')
      .not(':contains("No spacefarer")');
  }
  rowByName(name: string) {
    return cy.contains("tbody tr", name);
  }
  retireButton(name: string) {
    return this.rowByName(name).contains("button", "Retire");
  }
  deleteButton(name: string) {
    return this.rowByName(name).contains("button", "Delete");
  }

  totalCount() {
    return cy.contains(/spacefarer/);
  }
  prevButton() {
    return cy.contains("button", "← Prev");
  }
  nextButton() {
    return cy.contains("button", "Next →");
  }

  selectRow(name: string) {
    this.rowByName(name).click();
    return this;
  }

  filterByStatus(status: string) {
    this.statusFilter().select(status);
    return this;
  }

  sortBy(field: string) {
    this.sortSelect().select(field);
    return this;
  }
}
