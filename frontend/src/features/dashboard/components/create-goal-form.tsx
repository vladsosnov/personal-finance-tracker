import { Button, Card, Grid, NumberInput, Stack, Text, TextInput, Title } from "@mantine/core";
import { GoalColorPicker } from "@/features/dashboard/components/goal-color-picker";
import { MONEY_INPUT_PROPS, numberOrZero } from "@/shared/utils/number";
import styles from "@/shared/styles/page-animations.module.css";

type CreateGoalFormProps = {
  goalTitle: string;
  goalTarget: number | "";
  goalInitialAmount: number | "";
  goalColor: string;
  isCreatingGoal: boolean;
  isAddDisabled: boolean;
  limitMessage: string | null;
  setGoalTitle: (value: string) => void;
  setGoalTarget: (value: number | "") => void;
  setGoalInitialAmount: (value: number | "") => void;
  setGoalColor: (value: string) => void;
  onCreateGoal: () => Promise<void>;
};

export const CreateGoalForm = ({
  goalTitle,
  goalTarget,
  goalInitialAmount,
  goalColor,
  isCreatingGoal,
  isAddDisabled,
  limitMessage,
  setGoalTitle,
  setGoalTarget,
  setGoalInitialAmount,
  setGoalColor,
  onCreateGoal,
}: CreateGoalFormProps) => {
  return (
    <Card withBorder radius="md" p="lg" className={styles.stagger4}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!isAddDisabled && !limitMessage) onCreateGoal();
        }}
        aria-label="Create goal"
      >
        <Stack gap="sm">
          <Title order={4}>Create goal</Title>
          {limitMessage && <Text size="sm" c="orange">{limitMessage}</Text>}
          <Grid align="flex-end">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <TextInput
                label="Title"
                placeholder="Buy a house"
                required
                aria-required
                value={goalTitle}
                maxLength={80}
                onChange={(event) => setGoalTitle(event.currentTarget.value)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 2 }}>
              <NumberInput
                label="Target amount"
                placeholder="25000"
                required
                aria-required
                {...MONEY_INPUT_PROPS}
                value={goalTarget}
                onChange={(value) => setGoalTarget(numberOrZero(value))}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 2 }}>
              <NumberInput
                label="Starting amount"
                placeholder="5000"
                {...MONEY_INPUT_PROPS}
                min={0}
                value={goalInitialAmount}
                onChange={(value) => setGoalInitialAmount(numberOrZero(value))}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 2 }}>
              <GoalColorPicker label="Color" value={goalColor} onChange={setGoalColor} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 2 }}>
              <Button
                fullWidth
                type="submit"
                loading={isCreatingGoal}
                disabled={isAddDisabled || Boolean(limitMessage)}
              >
                Add goal
              </Button>
            </Grid.Col>
          </Grid>
        </Stack>
      </form>
    </Card>
  );
};
