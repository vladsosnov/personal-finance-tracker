import { Button, Card, ColorSwatch, Grid, Group, NumberInput, Stack, Text, TextInput, Title, Tooltip } from "@mantine/core";
import { GOAL_COLOR_OPTIONS } from "@/shared/constants/goal-colors";
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
        <Grid>
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
              {...MONEY_INPUT_PROPS}
              value={goalTarget}
              onChange={(value) => setGoalTarget(numberOrZero(value))}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 2 }}>
            <NumberInput
              label="Starting amount"
              {...MONEY_INPUT_PROPS}
              min={0}
              value={goalInitialAmount}
              onChange={(value) => setGoalInitialAmount(numberOrZero(value))}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 2 }}>
            <Stack gap={8}>
              <Text size="sm" fw={500}>
                Goal color
              </Text>
              <Group gap="xs">
                {GOAL_COLOR_OPTIONS.map((option) => {
                  const isSelected = goalColor === option.value;

                  return (
                    <Tooltip key={option.value} label={option.label} withArrow>
                      <ColorSwatch
                        color={option.value}
                        component="button"
                        type="button"
                        onClick={() => setGoalColor(option.value)}
                        style={{
                          cursor: "pointer",
                          outline: isSelected ? `3px solid ${option.value}` : "2px solid transparent",
                          outlineOffset: 2,
                          boxShadow: isSelected ? "0 0 0 4px rgba(15, 23, 42, 0.08)" : undefined,
                        }}
                      />
                    </Tooltip>
                  );
                })}
              </Group>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 2 }}>
            <Button fullWidth mt={6} onClick={onCreateGoal} loading={isCreatingGoal} disabled={isAddDisabled}>
              Add
            </Button>
          </Grid.Col>
        </Grid>
      </Stack>
    </Card>
  );
};
