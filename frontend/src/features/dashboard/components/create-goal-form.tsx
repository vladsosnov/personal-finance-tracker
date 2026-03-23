import { Button, Card, Grid, NumberInput, Stack, TextInput, Title } from "@mantine/core";
import { GoalColorPicker } from "@/features/dashboard/components/goal-color-picker";
import { MONEY_INPUT_PROPS, numberOrZero } from "@/shared/utils/number";

type CreateGoalFormProps = {
  goalTitle: string;
  goalTarget: number | "";
  goalInitialAmount: number | "";
  goalColor: string;
  isCreatingGoal: boolean;
  isAddDisabled: boolean;
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
  setGoalTitle,
  setGoalTarget,
  setGoalInitialAmount,
  setGoalColor,
  onCreateGoal,
}: CreateGoalFormProps) => {
  return (
    <Card withBorder radius="md" p="lg">
      <Stack gap="sm">
        <Title order={4}>Create goal</Title>
        <Grid align="flex-end">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <TextInput
              label="Goal title"
              placeholder="Buy a house"
              value={goalTitle}
              onChange={(event) => setGoalTitle(event.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 2 }}>
            <NumberInput
              label="Target amount"
              placeholder="25000"
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
            <GoalColorPicker label="Goal color" value={goalColor} onChange={setGoalColor} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 2 }}>
            <Button
              fullWidth
              onClick={onCreateGoal}
              loading={isCreatingGoal}
              disabled={isAddDisabled}
              styles={{
                root: {
                  "&:disabled": {
                    backgroundColor: "rgba(148, 163, 184, 0.18)",
                    color: "rgba(226, 232, 240, 0.72)",
                    border: "1px solid rgba(148, 163, 184, 0.24)",
                  },
                },
              }}
            >
              Add
            </Button>
          </Grid.Col>
        </Grid>
      </Stack>
    </Card>
  );
};
