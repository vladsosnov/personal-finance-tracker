import { Button, Card, Grid, NumberInput, Stack, TextInput, Title } from "@mantine/core";
import { MONEY_INPUT_PROPS, numberOrZero } from "@/shared/utils/number";

type CreateGoalFormProps = {
  goalTitle: string;
  goalTarget: number | "";
  isCreatingGoal: boolean;
  isAddDisabled: boolean;
  setGoalTitle: (value: string) => void;
  setGoalTarget: (value: number | "") => void;
  onCreateGoal: () => Promise<void>;
};

export const CreateGoalForm = ({
  goalTitle,
  goalTarget,
  isCreatingGoal,
  isAddDisabled,
  setGoalTitle,
  setGoalTarget,
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
          <Grid.Col span={{ base: 12, md: 4 }}>
            <NumberInput
              label="Target amount"
              {...MONEY_INPUT_PROPS}
              value={goalTarget}
              onChange={(value) => setGoalTarget(numberOrZero(value))}
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
