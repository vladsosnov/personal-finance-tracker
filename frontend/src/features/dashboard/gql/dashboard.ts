import { gql } from "@apollo/client";

export const REGISTER = gql`
  mutation Register($email: String!, $password: String!) {
    register(email: $email, password: $password) {
      token
      user {
        id
        email
      }
    }
  }
`;

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
      }
    }
  }
`;

export const GET_ME = gql`
  query Me {
    me {
      id
      email
    }
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
      currentAmount
      progress
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
    }
  }
`;

export const DELETE_GOAL_OPERATION = gql`
  mutation DeleteGoalOperation($operationId: ID!) {
    deleteGoalOperation(operationId: $operationId) {
      id
    }
  }
`;
