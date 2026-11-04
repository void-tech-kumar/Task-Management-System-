import React, { useState, useEffect } from 'react';
import { TaskSubmission } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { submissionsApi } from '../../services/api';
import { ExternalLink } from 'lucide-react';

interface EvaluateModalProps {
  submission: TaskSubmission | null;
  isOpen: boolean;
  onClose: () => void;
  onEvaluated: () => void;
}

export const EvaluateModal: React.FC<EvaluateModalProps> = ({
  submission,
  isOpen,
  onClose,
  onEvaluated,
}) => {
  const [grade, setGrade] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState<'EVALUATED' | 'RESUBMIT_REQUESTED'>('EVALUATED');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (submission) {
      setGrade(submission.grade ?? submission.task?.maxPoints ?? 100);
      setFeedback(submission.feedback ?? '');
      setStatus(submission.status === 'RESUBMIT_REQUESTED' ? 'RESUBMIT_REQUESTED' : 'EVALUATED');
      setError(null);
    }
  }, [submission]);

  if (!submission) return null;

  const maxPoints = submission.task?.maxPoints || 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      setError('Please provide qualitative feedback for the student.');
      return;
    }
    if (grade < 0 || grade > maxPoints) {
      setError(`Score must be between 0 and ${maxPoints}.`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await submissionsApi.evaluateSubmission(submission.id, {
        grade: Number(grade),
        feedback: feedback.trim(),
        status,
      });
      onEvaluated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Evaluate Deliverable"
      subtitle={`Student: ${submission.student?.fullName || 'Student'} • Task: ${submission.task?.title || 'Assignment'}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium">
            {error}
          </div>
        )}

        {/* Student submission recap */}
        <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 space-y-2 text-xs">
          <p className="font-semibold text-slate-700">Submitted Work:</p>
          <p className="text-slate-800 whitespace-pre-wrap">{submission.content}</p>
          {submission.attachmentUrl && (
            <div className="pt-2">
              <a
                href={submission.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Inspect Attached Deliverable <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Score & Decision Status */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={`Score (out of ${maxPoints})`}
            type="number"
            min={0}
            max={maxPoints}
            required
            value={grade}
            onChange={(e) => setGrade(Number(e.target.value))}
          />

          <Select
            label="Decision"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            options={[
              { value: 'EVALUATED', label: 'Accepted / Graded' },
              { value: 'RESUBMIT_REQUESTED', label: 'Resubmit Requested' },
            ]}
          />
        </div>

        {/* Feedback text */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Feedback & Grading Remarks *
          </label>
          <textarea
            rows={4}
            required
            placeholder="Provide constructive assessment, rubric details, and areas for improvement..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
            Record Evaluation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
