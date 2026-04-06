import { Select } from "@mantine/core";
import { SUPPORTED_CURRENCIES } from "@/shared/constants/currencies";

const CURRENCY_OPTIONS = SUPPORTED_CURRENCIES.map((c) => ({
  value: c.code,
  label: `${c.code} (${c.symbol})`,
}));

type CurrencySelectProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export const CurrencySelect = ({ label = "Currency", value, onChange, disabled }: CurrencySelectProps) => (
  <Select
    label={label}
    data={CURRENCY_OPTIONS}
    value={value}
    onChange={(val) => { if (val) onChange(val); }}
    searchable
    allowDeselect={false}
    disabled={disabled}
  />
);
