import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import '@testing-library/jest-dom';
import ExamEditor from '../components/ExamEditor';

// Mock hook dependencies
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'teacher-123', name: 'John Doe' }
  })
}));

vi.mock('../hooks/useDialog', () => ({
  useDialog: () => ({
    showConfirm: vi.fn()
  })
}));

// Mock service/api dependencies
vi.mock('../api/examService', () => ({
  createExam: vi.fn(),
  updateExam: vi.fn(),
  getCoursesByTeacher: vi.fn().mockResolvedValue([
    { id: 'c1', name: 'Introduction to Testing', code: 'TEST101' }
  ])
}));

vi.mock('../services/notify', () => ({
  showSuccess: vi.fn()
}));

vi.mock('../services/logger', () => ({
  logError: vi.fn()
}));

vi.mock('../services/apiClient', () => ({
  generateExamFromAI: vi.fn()
}));

test('renders ExamEditor and enforces 100-Point Validation Rule', async () => {
  render(
    <ExamEditor
      exam={null}
      exams={[]}
      onSaveSuccess={vi.fn()}
      onCancel={vi.fn()}
      defaultCourseId="c1"
    />
  );

  // Await the mock courses to load to avoid act warnings
  await screen.findByText(/Introduction to Testing/i);

  // Assert save button is initially disabled (default 10 points)
  const saveBtn = screen.getByRole('button', { name: /create exam/i });
  expect(saveBtn).toBeDisabled();

  // Click "+ Add New Question" to add a second question
  const addQuestionBtn = screen.getByRole('button', { name: /\+ Add New Question/i });
  fireEvent.click(addQuestionBtn);

  // We should now have two points input fields
  const pointsInputs = screen.getAllByPlaceholderText('Points');
  expect(pointsInputs.length).toBe(2);

  // Simulate updating points so they sum to 90 points (e.g., 50 + 40)
  fireEvent.change(pointsInputs[0], { target: { value: '50' } });
  fireEvent.change(pointsInputs[1], { target: { value: '40' } });

  // Assert save button remains disabled at 90 points
  expect(saveBtn).toBeDisabled();

  // Simulate updating points to exactly 100 points (e.g., 50 + 50)
  fireEvent.change(pointsInputs[1], { target: { value: '50' } });

  // Assert save button becomes enabled at exactly 100 points
  expect(saveBtn).toBeEnabled();
});
