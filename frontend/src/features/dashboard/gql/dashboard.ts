import { gql } from "@apollo/client";
import type { Goal } from "@/features/dashboard/types";

export type GoalsQueryData = { goals: Goal[] };

const GOAL_FIELDS = gql`
  fragment GoalFields on Goal {
    id
    title
    targetAmount
    initialAmount
    currency
    color
    sortOrder
    isCompleted
    completedAt
    currentAmount
    progress
    createdAt
  }
`;

const GOAL_OPERATION_FIELDS = gql`
  fragment GoalOperationFields on GoalOperation {
    id
    type
    amount
    currency
    convertedAmount
    note
    operationDate
    createdAt
  }
`;

export const EXPORT_ALL_DATA = gql`
  query ExportAllData {
    exportAllData
  }
`;

export const GET_GOALS = gql`
  ${GOAL_FIELDS}
  ${GOAL_OPERATION_FIELDS}
  query Goals {
    goals {
      ...GoalFields
      operations {
        ...GoalOperationFields
      }
    }
  }
`;

export const GET_GOAL_DETAILS = gql`
  ${GOAL_FIELDS}
  ${GOAL_OPERATION_FIELDS}
  query Goal($id: ID!) {
    goal(id: $id) {
      ...GoalFields
      operations {
        ...GoalOperationFields
      }
    }
  }
`;

export const CREATE_GOAL = gql`
  mutation CreateGoal($title: String!, $targetAmount: Float!, $initialAmount: Float, $color: String, $currency: String) {
    createGoal(title: $title, targetAmount: $targetAmount, initialAmount: $initialAmount, color: $color, currency: $currency) {
      id
    }
  }
`;

export const EDIT_GOAL = gql`
  ${GOAL_FIELDS}
  mutation EditGoal($goalId: ID!, $title: String!, $targetAmount: Float!, $initialAmount: Float, $color: String!, $currency: String) {
    editGoal(goalId: $goalId, title: $title, targetAmount: $targetAmount, initialAmount: $initialAmount, color: $color, currency: $currency) {
      ...GoalFields
    }
  }
`;

export const UPDATE_GOAL_COLOR = gql`
  mutation UpdateGoalColor($goalId: ID!, $color: String!) {
    updateGoalColor(goalId: $goalId, color: $color) {
      id
      color
    }
  }
`;

export const DELETE_GOAL = gql`
  mutation DeleteGoal($goalId: ID!) {
    deleteGoal(goalId: $goalId) {
      id
    }
  }
`;

export const REORDER_GOALS = gql`
  mutation ReorderGoals($goalIds: [ID!]!) {
    reorderGoals(goalIds: $goalIds) {
      id
    }
  }
`;

export const UPDATE_GOAL_PROGRESS = gql`
  ${GOAL_FIELDS}
  mutation UpdateGoalProgress($goalId: ID!, $type: OperationType!, $amount: Float!, $currency: String, $note: String, $operationDate: String) {
    updateGoalProgress(goalId: $goalId, type: $type, amount: $amount, currency: $currency, note: $note, operationDate: $operationDate) {
      ...GoalFields
    }
  }
`;

export const EDIT_GOAL_OPERATION = gql`
  ${GOAL_FIELDS}
  ${GOAL_OPERATION_FIELDS}
  mutation EditGoalOperation($operationId: ID!, $type: OperationType!, $amount: Float!, $currency: String, $note: String, $operationDate: String) {
    editGoalOperation(
      operationId: $operationId
      type: $type
      amount: $amount
      currency: $currency
      note: $note
      operationDate: $operationDate
    ) {
      ...GoalFields
      operations {
        ...GoalOperationFields
      }
    }
  }
`;

export const DELETE_GOAL_OPERATION = gql`
  ${GOAL_FIELDS}
  ${GOAL_OPERATION_FIELDS}
  mutation DeleteGoalOperation($operationId: ID!) {
    deleteGoalOperation(operationId: $operationId) {
      ...GoalFields
      operations {
        ...GoalOperationFields
      }
    }
  }
`;

export const COMPLETE_GOAL = gql`
  ${GOAL_FIELDS}
  ${GOAL_OPERATION_FIELDS}
  mutation CompleteGoal($goalId: ID!) {
    completeGoal(goalId: $goalId) {
      ...GoalFields
      operations {
        ...GoalOperationFields
      }
    }
  }
`;

export const IMPORT_GOALS = gql`
  mutation ImportGoals($goals: [ImportGoalInput!]!) {
    importGoals(goals: $goals) {
      importedGoalsCount
      importedOperationsCount
    }
  }
`;

export const RESET_ALL_DATA = gql`
  mutation ResetAllData {
    resetAllData {
      deletedGoalsCount
      deletedOperationsCount
    }
  }
`;
