import { gql } from "@apollo/client";

export const EXPORT_ALL_DATA = gql`
  query ExportAllData {
    exportAllData
  }
`;

export const GET_GOALS = gql`
  query Goals {
    goals {
      id
      title
      targetAmount
      initialAmount
      color
      sortOrder
      isCompleted
      completedAt
      currentAmount
      progress
      createdAt
    }
  }
`;

export const GET_GOAL_DETAILS = gql`
  query Goal($id: ID!) {
    goal(id: $id) {
      id
      title
      targetAmount
      initialAmount
      color
      sortOrder
      isCompleted
      completedAt
      currentAmount
      progress
      createdAt
      operations {
        id
        type
        amount
        note
        operationDate
        createdAt
      }
    }
  }
`;

export const CREATE_GOAL = gql`
  mutation CreateGoal($title: String!, $targetAmount: Float!, $initialAmount: Float, $color: String) {
    createGoal(title: $title, targetAmount: $targetAmount, initialAmount: $initialAmount, color: $color) {
      id
    }
  }
`;

export const EDIT_GOAL = gql`
  mutation EditGoal($goalId: ID!, $title: String!, $targetAmount: Float!, $initialAmount: Float, $color: String!) {
    editGoal(goalId: $goalId, title: $title, targetAmount: $targetAmount, initialAmount: $initialAmount, color: $color) {
      id
      title
      targetAmount
      initialAmount
      color
      sortOrder
      isCompleted
      completedAt
      currentAmount
      progress
      createdAt
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
  mutation UpdateGoalProgress($goalId: ID!, $type: OperationType!, $amount: Float!, $note: String, $operationDate: String) {
    updateGoalProgress(goalId: $goalId, type: $type, amount: $amount, note: $note, operationDate: $operationDate) {
      id
      title
      targetAmount
      initialAmount
      color
      sortOrder
      isCompleted
      completedAt
      currentAmount
      progress
      createdAt
    }
  }
`;

export const EDIT_GOAL_OPERATION = gql`
  mutation EditGoalOperation($operationId: ID!, $type: OperationType!, $amount: Float!, $note: String, $operationDate: String) {
    editGoalOperation(
      operationId: $operationId
      type: $type
      amount: $amount
      note: $note
      operationDate: $operationDate
    ) {
      id
      title
      targetAmount
      initialAmount
      color
      sortOrder
      isCompleted
      completedAt
      currentAmount
      progress
      createdAt
      operations {
        id
        type
        amount
        note
        operationDate
        createdAt
      }
    }
  }
`;

export const DELETE_GOAL_OPERATION = gql`
  mutation DeleteGoalOperation($operationId: ID!) {
    deleteGoalOperation(operationId: $operationId) {
      id
      title
      targetAmount
      initialAmount
      color
      sortOrder
      isCompleted
      completedAt
      currentAmount
      progress
      createdAt
      operations {
        id
        type
        amount
        note
        operationDate
        createdAt
      }
    }
  }
`;

export const COMPLETE_GOAL = gql`
  mutation CompleteGoal($goalId: ID!) {
    completeGoal(goalId: $goalId) {
      id
      title
      targetAmount
      initialAmount
      color
      sortOrder
      isCompleted
      completedAt
      currentAmount
      progress
      createdAt
      operations {
        id
        type
        amount
        note
        operationDate
        createdAt
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
