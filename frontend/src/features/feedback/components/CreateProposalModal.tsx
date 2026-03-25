import { useState } from "react";
import { Button, Group, Modal, Select, Stack, Textarea, TextInput } from "@mantine/core";
import { CATEGORY_LABELS, type ProposalCategory } from "@/features/feedback/types";

const CATEGORY_OPTIONS = (Object.entries(CATEGORY_LABELS) as Array<[ProposalCategory, string]>).map(([value, label]) => ({
  value,
  label,
}));

type CreateProposalModalProps = {
  opened: boolean;
  isLoading: boolean;
  onSubmit: (input: { category: ProposalCategory; title: string; description: string; contactEmail?: string }) => Promise<void>;
  onClose: () => void;
};

export const CreateProposalModal = ({ opened, isLoading, onSubmit, onClose }: CreateProposalModalProps) => {
  const [category, setCategory] = useState<ProposalCategory>("FEATURE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const isValid = title.trim().length > 0 && description.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    await onSubmit({
      category,
      title: title.trim(),
      description: description.trim(),
      contactEmail: contactEmail.trim() || undefined,
    });
    setCategory("FEATURE");
    setTitle("");
    setDescription("");
    setContactEmail("");
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Submit feedback" centered size="lg">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <Stack gap="md">
          <Select
            label="Category"
            data={CATEGORY_OPTIONS}
            value={category}
            onChange={(value) => { if (value) setCategory(value as ProposalCategory); }}
            allowDeselect={false}
            required
            aria-required
          />
          <TextInput
            label="Title"
            placeholder="Brief summary of your feedback"
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            maxLength={200}
            required
            aria-required
          />
          <Textarea
            label="Description"
            placeholder="Describe the bug, feature, or change in detail..."
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            maxLength={2000}
            minRows={4}
            autosize
            required
            aria-required
          />
          <TextInput
            label="Contact email (optional)"
            placeholder="your@email.com"
            description="In case we need to follow up with you"
            type="email"
            autoComplete="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={handleClose} disabled={isLoading} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={isLoading} disabled={!isValid}>
              Submit
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
