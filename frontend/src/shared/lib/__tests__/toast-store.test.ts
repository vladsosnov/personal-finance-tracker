import { useToastStore, showToast, dismissToast } from '../toast-store';

describe('toast-store', () => {
  beforeEach(() => {
    useToastStore.setState({ items: [] });
  });

  describe('useToastStore', () => {
    it('initializes with empty items array', () => {
      const state = useToastStore.getState();
      expect(state.items).toEqual([]);
    });

    it('adds toast item with show', () => {
      const { show } = useToastStore.getState();

      show({ message: 'Test message', tone: 'teal' });

      const state = useToastStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0]).toMatchObject({
        message: 'Test message',
        tone: 'teal',
      });
      expect(state.items[0].id).toBeDefined();
    });

    it('generates unique IDs for each toast', () => {
      const { show } = useToastStore.getState();

      show({ message: 'First', tone: 'teal' });
      show({ message: 'Second', tone: 'red' });

      const state = useToastStore.getState();
      expect(state.items).toHaveLength(2);
      expect(state.items[0].id).not.toBe(state.items[1].id);
    });

    it('supports different toast tones', () => {
      const { show } = useToastStore.getState();

      show({ message: 'Success', tone: 'teal' });
      show({ message: 'Error', tone: 'red' });
      show({ message: 'Warning', tone: 'yellow' });
      show({ message: 'Info', tone: 'blue' });

      const state = useToastStore.getState();
      expect(state.items).toHaveLength(4);
      expect(state.items[0].tone).toBe('teal');
      expect(state.items[1].tone).toBe('red');
      expect(state.items[2].tone).toBe('yellow');
      expect(state.items[3].tone).toBe('blue');
    });

    it('removes toast item with dismiss', () => {
      const { show, dismiss } = useToastStore.getState();

      show({ message: 'First', tone: 'teal' });
      show({ message: 'Second', tone: 'red' });

      const state1 = useToastStore.getState();
      const firstId = state1.items[0].id;

      dismiss(firstId);

      const state2 = useToastStore.getState();
      expect(state2.items).toHaveLength(1);
      expect(state2.items[0].message).toBe('Second');
    });

    it('does nothing when dismissing non-existent ID', () => {
      const { show, dismiss } = useToastStore.getState();

      show({ message: 'Test', tone: 'teal' });

      dismiss('non-existent-id');

      const state = useToastStore.getState();
      expect(state.items).toHaveLength(1);
    });

    it('maintains order of toast items', () => {
      const { show } = useToastStore.getState();

      show({ message: 'First', tone: 'teal' });
      show({ message: 'Second', tone: 'red' });
      show({ message: 'Third', tone: 'yellow' });

      const state = useToastStore.getState();
      expect(state.items[0].message).toBe('First');
      expect(state.items[1].message).toBe('Second');
      expect(state.items[2].message).toBe('Third');
    });
  });

  describe('showToast', () => {
    it('adds toast to store', () => {
      showToast('Success message', 'teal');

      const state = useToastStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].message).toBe('Success message');
      expect(state.items[0].tone).toBe('teal');
    });

    it('works with all tone types', () => {
      showToast('Teal', 'teal');
      showToast('Red', 'red');
      showToast('Yellow', 'yellow');
      showToast('Blue', 'blue');

      const state = useToastStore.getState();
      expect(state.items).toHaveLength(4);
    });
  });

  describe('dismissToast', () => {
    it('removes toast from store', () => {
      showToast('Test', 'teal');

      const state1 = useToastStore.getState();
      const toastId = state1.items[0].id;

      dismissToast(toastId);

      const state2 = useToastStore.getState();
      expect(state2.items).toHaveLength(0);
    });

    it('only removes specified toast', () => {
      showToast('First', 'teal');
      showToast('Second', 'red');
      showToast('Third', 'yellow');

      const state1 = useToastStore.getState();
      const secondId = state1.items[1].id;

      dismissToast(secondId);

      const state2 = useToastStore.getState();
      expect(state2.items).toHaveLength(2);
      expect(state2.items[0].message).toBe('First');
      expect(state2.items[1].message).toBe('Third');
    });
  });
});
