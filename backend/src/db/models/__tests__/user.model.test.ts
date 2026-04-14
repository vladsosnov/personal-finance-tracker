import { UserModel } from "../user.model";

describe("user.model", () => {
  it("enforces one-to-one ownership for Stripe ids with sparse unique indexes", () => {
    const indexes = UserModel.schema.indexes();

    expect(indexes).toEqual(
      expect.arrayContaining([
        [{ stripeCustomerId: 1 }, expect.objectContaining({ sparse: true, unique: true })],
        [{ stripeSubscriptionId: 1 }, expect.objectContaining({ sparse: true, unique: true })],
        [{ stripeCheckoutSessionId: 1 }, expect.objectContaining({ sparse: true, unique: true })],
      ])
    );
  });
});
