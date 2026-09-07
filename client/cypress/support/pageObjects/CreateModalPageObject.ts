export class CreateModalPageObject {
  nameInput() {
    return cy.get('[data-cy="modal-name"]');
  }
  emailInput() {
    return cy.get('[data-cy="modal-email"]');
  }
  planetInput() {
    return cy.get('[data-cy="modal-planet"]');
  }
  colorInput() {
    return cy.get('[data-cy="modal-color"]');
  }
  stardustInput() {
    return cy.get('[data-cy="modal-stardust"]');
  }
  skillInput() {
    return cy.get('[data-cy="modal-skill"]');
  }
  submitButton() {
    return cy.get('[data-cy="submit-btn"]');
  }
  cancelButton() {
    return cy.contains("button", "Cancel");
  }
  errorMessage() {
    return cy.get("p.text-red-400");
  }

  fill({
    name,
    email,
    planet,
  }: {
    name: string;
    email: string;
    planet: string;
  }) {
    this.nameInput().clear().type(name);
    this.emailInput().clear().type(email);
    this.planetInput().clear().type(planet);
    return this;
  }

  submit() {
    this.submitButton().click();
    return this;
  }

  cancel() {
    this.cancelButton().click();
    return this;
  }
}
