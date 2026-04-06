import type { Goal, GoalOperation } from "../types";

jest.mock("../operation.repository", () => ({
  listOperationsByGoal: jest.fn(),
  listAllOperationsByUser: jest.fn(),
}));

jest.mock("../../exchange-rates/exchange-rate.service", () => ({
  getRates: jest.fn().mockResolvedValue({}),
  convert: jest.fn((amount: number) => amount),
}));

import { buildGoalView, buildGoalViews } from "../goal.service";
import { listOperationsByGoal, listAllOperationsByUser } from "../operation.repository";

const mockedListOperationsByGoal = listOperationsByGoal as jest.MockedFunction<typeof listOperationsByGoal>;
const mockedListAllOperationsByUser = listAllOperationsByUser as jest.MockedFunction<typeof listAllOperationsByUser>;

const makeGoal = (overrides: Partial<Goal> = {}): Goal => ({
  id: "goal-1",
  userId: "user-1",
  title: "Emergency Fund",
  targetAmount: 10000,
  initialAmount: 1000,
  currency: "USD",
  color: "#228be6",
  sortOrder: 0,
  isCompleted: false,
  createdAt: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

const makeOperation = (overrides: Partial<GoalOperation> = {}): GoalOperation => ({
  id: "op-1",
  userId: "user-1",
  goalId: "goal-1",
  type: "INCREASE",
  amount: 500,
  currency: "USD",
  operationDate: "2024-02-01",
  createdAt: "2024-02-01T00:00:00.000Z",
  ...overrides,
});

describe("goal.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("buildGoalView", () => {
    it("calculates currentAmount from initialAmount + operations", async () => {
      mockedListOperationsByGoal.mockResolvedValue([
        makeOperation({ type: "INCREASE", amount: 500 }),
        makeOperation({ id: "op-2", type: "INCREASE", amount: 300 }),
      ]);

      const goal = makeGoal({ initialAmount: 1000 });
      const view = await buildGoalView("user-1", goal);

      expect(view.currentAmount).toBe(1800); // 1000 + 500 + 300
    });

    it("subtracts DECREASE operations", async () => {
      mockedListOperationsByGoal.mockResolvedValue([
        makeOperation({ type: "INCREASE", amount: 500 }),
        makeOperation({ id: "op-2", type: "DECREASE", amount: 200 }),
      ]);

      const goal = makeGoal({ initialAmount: 1000 });
      const view = await buildGoalView("user-1", goal);

      expect(view.currentAmount).toBe(1300); // 1000 + 500 - 200
    });

    it("calculates progress as percentage of target", async () => {
      mockedListOperationsByGoal.mockResolvedValue([
        makeOperation({ type: "INCREASE", amount: 4000 }),
      ]);

      const goal = makeGoal({ initialAmount: 1000, targetAmount: 10000 });
      const view = await buildGoalView("user-1", goal);

      expect(view.progress).toBe(50); // 5000 / 10000 * 100
    });

    it("caps progress at 100%", async () => {
      mockedListOperationsByGoal.mockResolvedValue([
        makeOperation({ type: "INCREASE", amount: 20000 }),
      ]);

      const goal = makeGoal({ initialAmount: 0, targetAmount: 10000 });
      const view = await buildGoalView("user-1", goal);

      expect(view.progress).toBe(100);
    });

    it("returns 0 progress when targetAmount is 0", async () => {
      mockedListOperationsByGoal.mockResolvedValue([]);

      const goal = makeGoal({ targetAmount: 0 });
      const view = await buildGoalView("user-1", goal);

      expect(view.progress).toBe(0);
    });

    it("returns 0 currentAmount with no operations and 0 initial", async () => {
      mockedListOperationsByGoal.mockResolvedValue([]);

      const goal = makeGoal({ initialAmount: 0 });
      const view = await buildGoalView("user-1", goal);

      expect(view.currentAmount).toBe(0);
    });

    it("preserves goal fields in view", async () => {
      mockedListOperationsByGoal.mockResolvedValue([]);

      const goal = makeGoal({
        id: "g-42",
        title: "Car Fund",
        color: "#ff0000",
        sortOrder: 2,
        isCompleted: true,
        completedAt: "2024-06-01T00:00:00.000Z",
      });

      const view = await buildGoalView("user-1", goal);

      expect(view.id).toBe("g-42");
      expect(view.title).toBe("Car Fund");
      expect(view.color).toBe("#ff0000");
      expect(view.sortOrder).toBe(2);
      expect(view.isCompleted).toBe(true);
      expect(view.completedAt).toBe("2024-06-01T00:00:00.000Z");
    });

    it("includes operations in the view", async () => {
      const ops = [makeOperation(), makeOperation({ id: "op-2" })];
      mockedListOperationsByGoal.mockResolvedValue(ops);

      const view = await buildGoalView("user-1", makeGoal());

      expect(view.operations).toHaveLength(2);
    });
  });

  describe("buildGoalViews", () => {
    it("builds views for multiple goals", async () => {
      mockedListAllOperationsByUser.mockResolvedValue([
        makeOperation({ goalId: "g-1", type: "INCREASE", amount: 100 }),
        makeOperation({ id: "op-2", goalId: "g-2", type: "INCREASE", amount: 200 }),
      ]);

      const goals = [
        makeGoal({ id: "g-1", initialAmount: 0 }),
        makeGoal({ id: "g-2", initialAmount: 0 }),
      ];

      const views = await buildGoalViews("user-1", goals);

      expect(views).toHaveLength(2);
      expect(views[0].currentAmount).toBe(100);
      expect(views[1].currentAmount).toBe(200);
    });

    it("handles goals with no operations", async () => {
      mockedListAllOperationsByUser.mockResolvedValue([]);

      const views = await buildGoalViews("user-1", [makeGoal({ initialAmount: 500 })]);

      expect(views[0].currentAmount).toBe(500);
      expect(views[0].operations).toEqual([]);
    });

    it("returns empty array for no goals", async () => {
      mockedListAllOperationsByUser.mockResolvedValue([]);

      const views = await buildGoalViews("user-1", []);

      expect(views).toEqual([]);
    });
  });
});
