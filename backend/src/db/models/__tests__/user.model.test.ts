import { UserModel } from "../user.model";

describe("user.model", () => {
  it("enforces one-to-one ownership for Paddle ids with sparse unique indexes", () => {
    const indexes = UserModel.schema.indexes();

    expect(indexes).toEqual(
      expect.arrayContaining([
        [{ paddleCustomerId: 1 }, expect.objectContaining({ sparse: true, unique: true })],
        [{ paddleSubscriptionId: 1 }, expect.objectContaining({ sparse: true, unique: true })],
        [{ paddleTransactionId: 1 }, expect.objectContaining({ sparse: true, unique: true })],
      ])
    );
  });
});
