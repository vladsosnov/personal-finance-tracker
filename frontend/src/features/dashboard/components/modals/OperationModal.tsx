'use client';

import { ActionIcon, Button, Card, Group, Modal, NumberInput, Stack, Text, TextInput, Tooltip } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import type { OperationType } from '@/shared/gql/__generated__/schema-types';
import { MONEY_INPUT_PROPS, numberOrZero } from '@/shared/utils/number';
import { getTodayDateValue } from '@/shared/utils/date';
import { CurrencySelect } from '@/shared/components/CurrencySelect';
import type { GoalOperationDraft } from '@/features/dashboard/types';

type OperationModalProps = {
    opened: boolean;
    isEditing: boolean;
    isLoading: boolean;
    isSubmitDisabled: boolean;
    operationType: OperationType;
    operationAmount: number | '';
    operationCurrency: string;
    operationNote: string;
    operationDate: string;
    operations: GoalOperationDraft[];
    onChangeType: (value: OperationType) => void;
    onChangeAmount: (value: number | '') => void;
    onChangeCurrency: (value: string) => void;
    onChangeNote: (value: string) => void;
    onChangeDate: (value: string) => void;
    onAddOperation: () => void;
    onRemoveOperation: (index: number) => void;
    onChangeOperationType: (index: number, value: OperationType) => void;
    onChangeOperationAmount: (index: number, value: number | '') => void;
    onChangeOperationCurrency: (index: number, value: string) => void;
    onChangeOperationNote: (index: number, value: string) => void;
    onChangeOperationDate: (index: number, value: string) => void;
    onSubmit: () => void;
    onClose: () => void;
};

type OperationFieldsProps = {
    operationType: OperationType;
    operationAmount: number | '';
    operationCurrency: string;
    operationNote: string;
    operationDate: string;
    onChangeType: (value: OperationType) => void;
    onChangeAmount: (value: number | '') => void;
    onChangeCurrency: (value: string) => void;
    onChangeNote: (value: string) => void;
    onChangeDate: (value: string) => void;
    index?: number;
};

const OperationFields = ({
    operationType,
    operationAmount,
    operationCurrency,
    operationNote,
    operationDate,
    onChangeType,
    onChangeAmount,
    onChangeCurrency,
    onChangeNote,
    onChangeDate,
    index,
}: OperationFieldsProps) => {
    const labelSuffix = typeof index === 'number' ? ` ${index + 1}` : '';

    return (
        <Stack gap="md">
            <Group gap="xs" wrap="nowrap" role="group" aria-label={`Operation type${labelSuffix}`}>
                <Button
                    fullWidth
                    color="teal"
                    variant={operationType === 'INCREASE' ? 'light' : 'subtle'}
                    aria-pressed={operationType === 'INCREASE'}
                    onClick={() => onChangeType('INCREASE')}
                    type="button"
                >
                    Increase
                </Button>
                <Button
                    fullWidth
                    color="red"
                    variant={operationType === 'DECREASE' ? 'light' : 'subtle'}
                    aria-pressed={operationType === 'DECREASE'}
                    onClick={() => onChangeType('DECREASE')}
                    type="button"
                >
                    Decrease
                </Button>
            </Group>
            <Group grow>
                <NumberInput
                    label={`Amount${labelSuffix}`}
                    placeholder="500"
                    required
                    aria-required
                    {...MONEY_INPUT_PROPS}
                    value={operationAmount}
                    onChange={(value) => onChangeAmount(numberOrZero(value))}
                />
                <CurrencySelect value={operationCurrency} onChange={onChangeCurrency} />
            </Group>
            <TextInput
                label={`Date${labelSuffix}`}
                type="date"
                required
                aria-required
                max={getTodayDateValue()}
                value={operationDate}
                onChange={(e) => onChangeDate(e.currentTarget.value)}
            />
            <TextInput
                label={`Note${labelSuffix}`}
                placeholder="Salary transfer..."
                maxLength={500}
                value={operationNote}
                onChange={(e) => onChangeNote(e.currentTarget.value)}
            />
        </Stack>
    );
};

export const OperationModal = ({
    opened,
    isEditing,
    isLoading,
    isSubmitDisabled,
    operationType,
    operationAmount,
    operationCurrency,
    operationNote,
    operationDate,
    operations,
    onChangeType,
    onChangeAmount,
    onChangeCurrency,
    onChangeNote,
    onChangeDate,
    onAddOperation,
    onRemoveOperation,
    onChangeOperationType,
    onChangeOperationAmount,
    onChangeOperationCurrency,
    onChangeOperationNote,
    onChangeOperationDate,
    onSubmit,
    onClose,
}: OperationModalProps) => (
    <Modal
        opened={opened}
        onClose={onClose}
        title={isEditing ? 'Edit operation' : 'Add operations'}
        centered
        size="lg"
    >
        <form
            onSubmit={(e) => {
                e.preventDefault();
                if (!isSubmitDisabled) onSubmit();
            }}
        >
            <Stack gap="md">
                {isEditing ? (
                    <OperationFields
                        operationType={operationType}
                        operationAmount={operationAmount}
                        operationCurrency={operationCurrency}
                        operationNote={operationNote}
                        operationDate={operationDate}
                        onChangeType={onChangeType}
                        onChangeAmount={onChangeAmount}
                        onChangeCurrency={onChangeCurrency}
                        onChangeNote={onChangeNote}
                        onChangeDate={onChangeDate}
                    />
                ) : (
                    <>
                        {operations.map((operation, index) => (
                            <Card key={operation.id} withBorder radius="md" p="md">
                                <Stack gap="md">
                                    <Group justify="space-between" align="center">
                                        <Text fw={600}>Operation {index + 1}</Text>
                                        <Tooltip label="Remove operation">
                                            <ActionIcon
                                                variant="subtle"
                                                color="red"
                                                size="sm"
                                                type="button"
                                                aria-label={`Remove operation ${index + 1}`}
                                                onClick={() => onRemoveOperation(index)}
                                                disabled={operations.length === 1 || isLoading}
                                            >
                                                <IconX size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Group>
                                    <OperationFields
                                        operationType={operation.type}
                                        operationAmount={operation.amount}
                                        operationCurrency={operation.currency}
                                        operationNote={operation.note ?? ''}
                                        operationDate={operation.operationDate}
                                        onChangeType={(value) =>
                                            onChangeOperationType(index, value)
                                        }
                                        onChangeAmount={(value) =>
                                            onChangeOperationAmount(index, value)
                                        }
                                        onChangeCurrency={(value) =>
                                            onChangeOperationCurrency(index, value)
                                        }
                                        onChangeNote={(value) =>
                                            onChangeOperationNote(index, value)
                                        }
                                        onChangeDate={(value) =>
                                            onChangeOperationDate(index, value)
                                        }
                                        index={index}
                                    />
                                </Stack>
                            </Card>
                        ))}
                        <Button
                            variant="light"
                            type="button"
                            onClick={onAddOperation}
                            disabled={isLoading || operations.length >= 10}
                            fullWidth
                        >
                            {operations.length >= 10
                                ? 'Maximum 10 operations reached'
                                : 'Add another operation'}
                        </Button>
                    </>
                )}
                <Group justify="flex-end">
                    <Button variant="default" onClick={onClose} disabled={isLoading} type="button">
                        Cancel
                    </Button>
                    <Button type="submit" loading={isLoading} disabled={isSubmitDisabled}>
                        {isEditing ? 'Save' : 'Save operations'}
                    </Button>
                </Group>
            </Stack>
        </form>
    </Modal>
);
