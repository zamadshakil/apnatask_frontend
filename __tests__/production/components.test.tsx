import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import Button from '../../src/components/Button';
import { StateView } from '../../src/components/Screen';

describe('production shared states', () => {
  it('exposes retry and invokes it', () => {
    const retry = jest.fn();
    const screen = render(<StateView title="Network unavailable" onRetry={retry} />);
    fireEvent.press(screen.getByText('Try again'));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('prevents a disabled financial action', () => {
    const action = jest.fn();
    const screen = render(<Button title="Submit offer" onPress={action} disabled />);
    fireEvent.press(screen.getByText('Submit offer'));
    expect(action).not.toHaveBeenCalled();
  });
});
