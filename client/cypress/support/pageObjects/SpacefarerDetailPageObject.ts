export class SpacefarerDetailPageObject {
  backButton() {
    return cy.contains("button", "← Back");
  }
  editButton() {
    return cy.contains("button", "Edit");
  }
  saveButton() {
    return cy.get('[data-cy="save-btn"]');
  }
  cancelButton() {
    return cy.contains("button", "Cancel");
  }
  errorMessage() {
    return cy.get("p.text-red-400");
  }

  nameInput() {
    return cy.get('[data-cy="field-name"]');
  }
  emailInput() {
    return cy.get('[data-cy="field-email"]');
  }
  colorInput() {
    return cy.get('[data-cy="field-spacesuitColor"]');
  }
  stardustInput() {
    return cy.get('[data-cy="field-stardustCollection"]');
  }
  skillInput() {
    return cy.get('[data-cy="field-wormholeSkill"]');
  }
  statusSelect() {
    return cy.get("select").first();
  }

  clickEdit() {
    this.editButton().click();
    return this;
  }

  fillStardust(value: number) {
    this.stardustInput().clear().type(String(value));
    return this;
  }

  fillSpacsuitColor(value: string) {
    this.colorInput().clear().type(value, { force: true });
    return this;
  }

  save() {
    this.saveButton().click();
    return this;
  }

  cancel() {
    this.cancelButton().click();
    return this;
  }
}
