import React, { useState, useEffect } from 'react';
import { Task, TaskComment, TaskSubmission } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Badge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';
import { tasksApi, submissionsApi, commentsApi } from '../../services/api';
import {
  priorityConfig,
  categoryConfig,
  statusConfig,
  formatDate,
  formatDateTime,
  getDueStatus,
} from '../../utils';
import {
  Calendar,
  CheckCircle,
  ExternalLink,
  MessageSquare,
  Send,
  Trash2,
  Award,
  Clock,
} from 'lucide-react';

interface TaskDetailModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
  onOpenEvaluateModal?: (submission: TaskSubmission) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  taskId,
  isOpen,
  onClose,
  onTaskUpdated,
  onOpenEvaluateModal,
}) => {
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // Student submission form state
  const [submissionContent, setSubmissionContent] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchTaskDetails = async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      const res = await tasksApi.getTaskById(taskId);
      setTask(res.data.data.task);

      // Comments
      const commRes = await commentsApi.getComments(taskId);
      setComments(commRes.data.data.comments);
    } catch (err) {
      console.error('Error fetching task:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskDetails();
    } else {
      setTask(null);
      setComments([]);
      setSubmissionContent('');
      setAttachmentUrl('');
      setSubmitError(null);
    }
  }, [isOpen, taskId]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !taskId) return;
    try {
      setCommentLoading(true);
      const res = await commentsApi.createComment(taskId, { content: newComment.trim() });
      setComments((prev) => [...prev, res.data.data.comment]);
      setNewComment('');
    } catch (err: any) {
      alert(err.message || 'Failed to post comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentsApi.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete comment');
    }
  };

  const handleSubmitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId || !submissionContent.trim()) return;
    try {
      setSubmitting(true);
      setSubmitError(null);
      await submissionsApi.submitTask(taskId, {
        content: submissionContent.trim(),
        attachmentUrl: attachmentUrl.trim() || undefined,
      });
      await fetchTaskDetails();
      onTaskUpdated();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit deliverable');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: any) => {
    if (!taskId) return;
    try {
      await tasksApi.updateTaskStatus(taskId, { status: newStatus });
      await fetchTaskDetails();
      onTaskUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  if (!task) return null;

  const dueInfo = getDueStatus(task.dueDate, task.status === 'COMPLETED');
  const mySubmission = task.submissions?.find((s) => s.studentId === user?.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task.title}
      subtitle={task.project ? `${task.project.code} • ${task.project.title}` : undefined}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Badges Bar & Status Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="indigo">{categoryConfig[task.category].label}</Badge>
            <Badge variant={task.priority === 'URGENT' ? 'rose' : task.priority === 'HIGH' ? 'amber' : 'slate'}>
              {priorityConfig[task.priority].label}
            </Badge>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border ${dueInfo.color}`}>
              <Calendar className="w-3.5 h-3.5" />
              {dueInfo.label}
            </span>
            <Badge variant="emerald">Max: {task.maxPoints} pts</Badge>
          </div>

          {/* Quick Status Select */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="text-xs font-semibold rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-800 shadow-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        {/* Task Description */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Description
          </h4>
          <p className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
            {task.description || 'No detailed instructions provided.'}
          </p>
        </div>

        {/* Assigned Students */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Assigned Students ({task.assignments?.length || 0})
          </h4>
          <div className="flex flex-wrap gap-2">
            {task.assignments && task.assignments.length > 0 ? (
              task.assignments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs text-xs"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                    {a.user?.fullName?.[0]?.toUpperCase()}
                  </div>
                  <span className="font-medium text-slate-800">{a.user?.fullName}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No students assigned yet.</p>
            )}
          </div>
        </div>

        {/* STUDENT WORK SUBMISSION SECTION */}
        {user?.role === 'STUDENT' && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-600" />
                My Deliverable Submission
              </h4>
              {mySubmission && (
                <Badge
                  variant={mySubmission.status === 'EVALUATED' ? 'emerald' : 'amber'}
                  size="sm"
                >
                  {mySubmission.status}
                </Badge>
              )}
            </div>

            {mySubmission ? (
              <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-100 text-xs">
                <div>
                  <span className="font-semibold text-slate-600 block mb-0.5">Submitted Notes:</span>
                  <p className="text-slate-800 whitespace-pre-wrap">{mySubmission.content}</p>
                </div>
                {mySubmission.attachmentUrl && (
                  <div>
                    <span className="font-semibold text-slate-600 block mb-0.5">Deliverable Link:</span>
                    <a
                      href={mySubmission.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium underline"
                    >
                      {mySubmission.attachmentUrl}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {mySubmission.status === 'EVALUATED' && (
                  <div className="mt-3 pt-3 border-t border-slate-200 bg-emerald-50/60 p-3 rounded-lg border border-emerald-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-emerald-900">Official Evaluation:</span>
                      <span className="font-bold text-sm text-emerald-700">
                        {mySubmission.grade} / {task.maxPoints} pts
                      </span>
                    </div>
                    {mySubmission.feedback && (
                      <p className="text-emerald-800 mt-1 italic">
                        "{mySubmission.feedback}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmitDeliverable} className="space-y-3">
                {submitError && (
                  <p className="text-xs text-rose-600 font-medium">{submitError}</p>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deliverable Summary / Solution Notes *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe your solution, methodology, or attach instructions..."
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deliverable URL (GitHub repo, Drive link, PDF URL)
                  </label>
                  <Input
                    type="url"
                    placeholder="https://github.com/..."
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                  />
                </div>
                <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
                  Submit Deliverable
                </Button>
              </form>
            )}
          </div>
        )}

        {/* FACULTY SUBMISSIONS REVIEW SECTION */}
        {(user?.role === 'FACULTY' || user?.role === 'ADMIN') && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between">
              <span>Student Submissions ({task.submissions?.length || 0})</span>
              <span className="text-[11px] text-slate-400 font-normal">
                Max Score: {task.maxPoints} pts
              </span>
            </h4>

            {task.submissions && task.submissions.length > 0 ? (
              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {task.submissions.map((sub) => (
                  <div key={sub.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {sub.student?.fullName}
                        </span>
                        <Badge
                          variant={sub.status === 'EVALUATED' ? 'emerald' : 'amber'}
                          size="sm"
                        >
                          {sub.status}
                        </Badge>
                      </div>
                      <p className="text-slate-600 whitespace-pre-wrap">{sub.content}</p>
                      {sub.attachmentUrl && (
                        <a
                          href={sub.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                        >
                          View Deliverable Link <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {sub.grade !== null && (
                        <p className="text-emerald-700 font-semibold mt-1">
                          Score: {sub.grade}/{task.maxPoints} pts • Feedback: "{sub.feedback}"
                        </p>
                      )}
                    </div>

                    {onOpenEvaluateModal && (
                      <Button
                        size="sm"
                        variant={sub.status === 'EVALUATED' ? 'outline' : 'primary'}
                        onClick={() => onOpenEvaluateModal(sub)}
                      >
                        {sub.status === 'EVALUATED' ? 'Edit Grade' : 'Grade'}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                No students have submitted deliverables yet.
              </p>
            )}
          </div>
        )}

        {/* COMMENTS THREAD */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            Discussion Thread ({comments.length})
          </h4>

          {/* Comment list */}
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1 mb-4">
            {comments.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No comments yet. Start the discussion!</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    {c.user.fullName[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900">{c.user.fullName}</span>
                        <span className="text-[10px] text-slate-400">• {formatDateTime(c.createdAt)}</span>
                      </div>
                      {(c.userId === user?.id || user?.role === 'ADMIN') && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="text-slate-400 hover:text-rose-600"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-slate-700 mt-1 whitespace-pre-wrap">{c.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment input form */}
          <form onSubmit={handlePostComment} className="flex gap-2">
            <Input
              placeholder="Ask a question or share an update..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="text-xs"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={commentLoading}
              icon={<Send className="w-3.5 h-3.5" />}
            >
              Send
            </Button>
          </form>
        </div>
      </div>
    </Modal>
  );
};

