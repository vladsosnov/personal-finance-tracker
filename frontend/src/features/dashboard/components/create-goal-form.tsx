import { Button, Card, Grid, Group, Modal, NumberInput, Stack, Text, TextInput, Title } from "@mantine/core";
import { GoalColorPicker } from "@/features/dashboard/components/goal-color-picker";
import { CurrencySelect } from "@/shared/components/CurrencySelect";
import { MONEY_INPUT_PROPS, numberOrZero } from "@/shared/utils/number";
import pageStyles from "@/shared/styles/page-animations.module.css";
import styles from "./create-goal-form.module.css";

type CreateGoalFormFieldsProps = {
  goalTitle: string;
  goalTarget: number | "";
  goalInitialAmount: number | "";
  goalColor: string;
  goalCurrency: string;
  isCreatingGoal: boolean;
  isAddDisabled: boolean;
  limitMessage: string | null;
  setGoalTitle: (value: string) => void;
  setGoalTarget: (value: number | "") => void;
  setGoalInitialAmount: (value: number | "") => void;
  setGoalColor: (value: string) => void;
  setGoalCurrency: (value: string) => void;
  onCreateGoal: () => Promise<void>;
};

export const CreateGoalFormFields = ({
  goalTitle,
  goalTarget,
  goalInitialAmount,
  goalColor,
  goalCurrency,
  isCreatingGoal,
  isAddDisabled,
  limitMessage,
  setGoalTitle,
  setGoalTarget,
  setGoalInitialAmount,
  setGoalColor,
  setGoalCurrency,
  onCreateGoal,
}: CreateGoalFormFieldsProps) => (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      if (!isAddDisabled && !limitMessage) onCreateGoal();
    }}
    aria-label="Create goal"
  >
    <Stack gap="sm">
      <Grid align="flex-end">
        <Grid.Col span={{ base: 12, md: 3 }} className={styles.desktopTitleColumn}>
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
        <Grid.Col span={{ base: 12, md: 2 }} className={styles.desktopTargetColumn}>
          <NumberInput
            label="Target amount"
            placeholder="25000"
            {...MONEY_INPUT_PROPS}
            min={0}
            value={goalTarget}
            onChange={(value) => setGoalTarget(numberOrZero(value))}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 2 }} className={styles.desktopInitialColumn}>
          <NumberInput
            label="Starting amount"
            placeholder="5000"
            {...MONEY_INPUT_PROPS}
            min={0}
            value={goalInitialAmount}
            onChange={(value) => setGoalInitialAmount(numberOrZero(value))}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 2 }} className={styles.desktopCurrencyColumn}>
          <CurrencySelect value={goalCurrency} onChange={setGoalCurrency} />
        </Grid.Col>
        <Grid.Col span={{ base: 6, md: "auto" }} className={styles.desktopColorColumn}>
          <GoalColorPicker label="Color" value={goalColor} onChange={setGoalColor} />
        </Grid.Col>
        <Grid.Col span={{ base: 6, md: "auto" }} className={styles.desktopSubmitColumn}>
          <Button
            type="submit"
            loading={isCreatingGoal}
            disabled={isAddDisabled || Boolean(limitMessage)}
            fullWidth
          >
            Add
          </Button>
        </Grid.Col>
      </Grid>
    </Stack>
  </form>
);

type CreateGoalFormProps = CreateGoalFormFieldsProps;

export const CreateGoalForm = (props: CreateGoalFormProps) => (
  <Card withBorder radius="md" p="lg" className={pageStyles.stagger4}>
    <Stack gap="sm">
      <Group justify="space-between" align="center">
        <Title order={5}>Create goal</Title>
        {props.limitMessage && <Text size="sm" c="orange">{props.limitMessage}</Text>}
      </Group>
      <CreateGoalFormFields {...props} />
    </Stack>
  </Card>
);

type CreateGoalModalProps = CreateGoalFormFieldsProps & {
  opened: boolean;
  onClose: () => void;
};

export const CreateGoalModal = ({ opened, onClose, ...formProps }: CreateGoalModalProps) => (
  <Modal opened={opened} onClose={onClose} title="Create goal" centered>
    <CreateGoalFormFields {...formProps} />
  </Modal>
);
