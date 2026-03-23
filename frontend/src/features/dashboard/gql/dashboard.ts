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
  mutation CreateGoal($title: String!, $targetAmount: Float!, $initialAmount: Float) {
    createGoal(title: $title, targetAmount: $targetAmount, initialAmount: $initialAmount) {
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
