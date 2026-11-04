import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { submissionsApi } from '../../services/api';
import { TaskSubmission } from '../../types';
import { EvaluateModal } from '../../components/submissions/EvaluateModal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/common/EmptyState';
import {
  GraduationCap,
  ExternalLink,
  CheckCircle2,
  Clock,
  Award,
  AlertCircle,
} from 'lucide-react';
import { formatDate, formatDateTime, submissionStatusConfig } from '../../utils';

export const EvaluationsPage: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<TaskSubmission | null>(null);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      if (user?.role === 'STUDENT') {
        const res = await submissionsApi.getMySubmissions();
        setSubmissions(res.data.data.submissions);
      } else {
        const res = await submissionsApi.getPendingEvaluations();
        setSubmissions(res.data.data.pending);
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [user]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {user?.role === 'STUDENT' ? 'My Submissions Portfolio' : 'Faculty Grading & Evaluation Portal'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {user?.role === 'STUDENT'
              ? 'Track submitted assignments, received grades, and instructor feedback.'
              : 'Review submitted student deliverables, record scores, and post qualitative assessment.'}
          </p>
        </div>

        {user?.role !== 'STUDENT' && (
          <Badge variant="amber" size="md">
            {submissions.length} Pending Review
          </Badge>
        )}
      </div>

      {/* Submissions List */}
      {loading ? (
        <Spinner label="Loading submissions data..." size="lg" className="my-16" />
      ) : submissions.length === 0 ? (
        <EmptyState
          icon={<Award className="w-6 h-6" />}
          title={
            user?.role === 'STUDENT'
              ? 'No deliverables submitted yet'
              : 'All caught up! No pending evaluations'
          }
          description={
            user?.role === 'STUDENT'
              ? 'Navigate to the Tasks board, open an assigned task, and submit your solution.'
              : 'Students will appear here as soon as they submit deliverables for your course tasks.'
          }
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">
                    {user?.role === 'STUDENT' ? 'Task & Course' : 'Student'}
                  </th>
                  <th className="py-3 px-4">
                    {user?.role === 'STUDENT' ? 'Deliverable Notes' : 'Task Deliverable'}
                  </th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Score & Remarks</th>
                  {user?.role !== 'STUDENT' && <th className="py-3 px-4 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((sub) => {
                  const statusConf = submissionStatusConfig[sub.status];
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Column 1: Student or Course */}
                      <td className="py-3.5 px-4">
                        {user?.role === 'STUDENT' ? (
                          <div>
                            <span className="font-semibold text-slate-900 block text-sm">
                              {sub.task?.title}
                            </span>
                            <span className="text-[11px] font-mono text-indigo-600">
                              {sub.task?.project?.code} • {sub.task?.project?.title}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                              {sub.student?.fullName?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 block">
                                {sub.student?.fullName}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {sub.student?.email}
                              </span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Column 2: Deliverable Content */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {user?.role !== 'STUDENT' && (
                          <span className="font-semibold text-slate-800 block text-xs mb-1">
                            {sub.task?.title} ({sub.task?.project?.code})
                          </span>
                        )}
                        <p className="text-slate-600 line-clamp-2">{sub.content}</p>
                        {sub.attachmentUrl && (
                          <a
                            href={sub.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline mt-1"
                          >
                            Deliverable Link <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </td>

                      {/* Column 3: Submitted At */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatDateTime(sub.submittedAt)}
                      </td>

                      {/* Column 4: Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${statusConf.badge}`}
                        >
                          {statusConf.label}
                        </span>
                      </td>

                      {/* Column 5: Grade & Feedback */}
                      <td className="py-3.5 px-4 max-w-xs">
                        {sub.grade !== null ? (
                          <div>
                            <span className="font-bold text-emerald-700 text-xs block">
                              {sub.grade} / {sub.task?.maxPoints || 100} pts
                            </span>
                            {sub.feedback && (
                              <p className="text-slate-500 text-[11px] italic line-clamp-2">
                                "{sub.feedback}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not graded yet</span>
                        )}
                      </td>

                      {/* Column 6: Action (Faculty) */}
                      {user?.role !== 'STUDENT' && (
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            size="sm"
                            variant={sub.status === 'EVALUATED' ? 'outline' : 'primary'}
                            onClick={() => setSelectedSubmission(sub)}
                          >
                            {sub.status === 'EVALUATED' ? 'Edit Grade' : 'Grade'}
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Evaluate Modal */}
      <EvaluateModal
        submission={selectedSubmission}
        isOpen={!!selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        onEvaluated={fetchSubmissions}
      />
    </div>
  );
};

