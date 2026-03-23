import { Button, Card, Grid, NumberInput, Stack, TextInput, Title } from "@mantine/core";
import { MONEY_INPUT_PROPS, numberOrZero } from "@/shared/utils/number";

type CreateGoalFormProps = {
  goalTitle: string;
  goalTarget: number | "";
  goalInitialAmount: number | "";
  isCreatingGoal: boolean;
  isAddDisabled: boolean;
  setGoalTitle: (value: string) => void;
  setGoalTarget: (value: number | "") => void;
  setGoalInitialAmount: (value: number | "") => void;
  onCreateGoal: () => Promise<void>;
};

export const CreateGoalForm = ({
  goalTitle,
  goalTarget,
  goalInitialAmount,
  isCreatingGoal,
  isAddDisabled,
  setGoalTitle,
  setGoalTarget,
  setGoalInitialAmount,
  onCreateGoal,
}: CreateGoalFormProps) => {
  return (
    <Card withBorder radius="md" p="lg">
      <Stack gap="sm">
        <Title order={4}>Create goal</Title>
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Goal title"
              placeholder="Buy a house"
              value={goalTitle}
              onChange={(event) => setGoalTitle(event.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <NumberInput
              label="Target amount"
              {...MONEY_INPUT_PROPS}
              value={goalTarget}
              onChange={(value) => setGoalTarget(numberOrZero(value))}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <NumberInput
              label="Starting amount"
              {...MONEY_INPUT_PROPS}
              min={0}
              value={goalInitialAmount}
              onChange={(value) => setGoalInitialAmount(numberOrZero(value))}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 2 }}>
            <Button fullWidth mt={24} onClick={onCreateGoal} loading={isCreatingGoal} disabled={isAddDisabled}>
              Add
            </Button>
          </Grid.Col>
        </Grid>
      </Stack>
    </Card>
  );
};
