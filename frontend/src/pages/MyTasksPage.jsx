import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bugAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { THEME } from '../theme/designSystem';

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed', 'reopened', 'rejected'];

export default function MyTasksPage() {
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id || '';
  const currentUserName = user?.username || user?.name || user?.email || '';
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [projectTasks, setProjectTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [selectedProjectFiles, setSelectedProjectFiles] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});

  const saveProjectsToStorage = (nextProjects) => {
    try {
      localStorage.setItem('projects', JSON.stringify(nextProjects));
      return { ok: true };
    } catch (error) {
      if (error?.name === 'QuotaExceededError') {
        return { ok: false, quota: true };
      }
      throw error;
    }
  };

  const getTakenUsers = (project) => {
    if (Array.isArray(project.takenByUsers)) return project.takenByUsers;
    if (project.takenBy) {
      return [{ id: project.takenById || null, username: project.takenBy, takenAt: project.takenAt || null }];
    }
    return [];
  };

  const isTakenByCurrentUser = (project) => {
    const takenUsers = getTakenUsers(project);
    return takenUsers.some((member) =>
      (member.id && currentUserId && member.id === currentUserId) ||
      (member.username && currentUserName && member.username === currentUserName)
    );
  };

  const isCreatorOfProject = (project) => {
    if (!project) return false;
    if (project.createdById && currentUserId) return project.createdById === currentUserId;
    if (project.createdBy && currentUserName) return project.createdBy === currentUserName;
    return false;
  };

  const canViewSubmissions = (project) => {
    return isCreatorOfProject(project) || user?.role === 'admin';
  };

  const getSubmissions = (project) => {
    if (Array.isArray(project.submissions)) return project.submissions;
    return [];
  };

  const isPastDeadline = (deadline) => {
    if (!deadline) return false;
    const due = new Date(deadline);
    due.setHours(23, 59, 59, 999);
    return Date.now() > due.getTime();
  };

  const refreshProjectTasks = useCallback((projectsSource) => {
    const mine = projectsSource.filter((project) => {
      const createdByMe = (project.createdById && currentUserId && project.createdById === currentUserId) ||
        (project.createdBy && currentUserName && project.createdBy === currentUserName);
      const takenUsers = Array.isArray(project.takenByUsers)
        ? project.takenByUsers
        : project.takenBy
          ? [{ id: project.takenById || null, username: project.takenBy, takenAt: project.takenAt || null }]
          : [];
      const takenByMe = takenUsers.some((member) =>
        (member.id && currentUserId && member.id === currentUserId) ||
        (member.username && currentUserName && member.username === currentUserName)
      );
      return createdByMe || takenByMe;
    });

    const uniqueMine = mine.filter((project, index, arr) => arr.findIndex((item) => item.id === project.id) === index);
    setProjectTasks(uniqueMine);
  }, [currentUserId, currentUserName]);

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const fetchTasks = useCallback(async () => {
    setLoading(true);

    const savedProjects = localStorage.getItem('projects');
    const allProjects = savedProjects ? JSON.parse(savedProjects) : [];
    refreshProjectTasks(allProjects);

    try {
      if (currentUserId) {
        const { data } = await bugAPI.getAll({ assignedTo: currentUserId, limit: 200, sortBy: 'dueDate', order: 'asc' });
        setTasks(data.data || []);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error(err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, refreshProjectTasks]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const updateStatus = async (bugId, status) => {
    setUpdatingId(bugId);
    try {
      await bugAPI.update(bugId, { status });
      setTasks((prev) => prev.map((task) => (task._id === bugId ? { ...task, status } : task)));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId('');
    }
  };

  const handleCancelTakenProject = (projectId) => {
    const savedProjects = localStorage.getItem('projects');
    const allProjects = savedProjects ? JSON.parse(savedProjects) : [];

    const updatedProjects = allProjects.map((project) => {
      if (project.id !== projectId) return project;

      const takenUsers = getTakenUsers(project);
      const remainingUsers = takenUsers.filter((member) => !(
        (member.id && currentUserId && member.id === currentUserId) ||
        (member.username && currentUserName && member.username === currentUserName)
      ));

      const nextTakenBy = remainingUsers.length > 0 ? remainingUsers[remainingUsers.length - 1].username : null;
      const nextTakenById = remainingUsers.length > 0 ? remainingUsers[remainingUsers.length - 1].id || null : null;
      const nextTakenAt = remainingUsers.length > 0 ? remainingUsers[remainingUsers.length - 1].takenAt || null : null;

      return {
        ...project,
        takenByUsers: remainingUsers,
        takenBy: nextTakenBy,
        takenById: nextTakenById,
        takenAt: nextTakenAt,
        status: remainingUsers.length === 0 && project.status === 'In Progress' ? 'Not Started' : project.status,
      };
    });

    saveProjectsToStorage(updatedProjects);
    refreshProjectTasks(updatedProjects);
  };

  const handleProjectFileUpload = async (projectId) => {
    const selectedFile = selectedProjectFiles[projectId];
    if (!selectedFile) {
      setUploadErrors((prev) => ({ ...prev, [projectId]: 'Please choose a file first.' }));
      return;
    }

    const savedProjects = localStorage.getItem('projects');
    const allProjects = savedProjects ? JSON.parse(savedProjects) : [];
    const target = allProjects.find((project) => project.id === projectId);

    if (!target) return;
    if (isPastDeadline(target.deadline)) {
      setUploadErrors((prev) => ({ ...prev, [projectId]: 'Deadline passed. File upload is not allowed.' }));
      return;
    }

    const fileDataUrl = await readFileAsDataUrl(selectedFile);

    const createSubmission = (includeFileData) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      uploaderId: currentUserId || null,
      uploader: currentUserName || 'Unknown',
      fileName: selectedFile.name,
      fileType: selectedFile.type || 'application/octet-stream',
      fileSize: selectedFile.size,
      ...(includeFileData ? { fileDataUrl } : {}),
      uploadedAt: new Date().toISOString(),
    });

    const updatedProjects = allProjects.map((project) => {
      if (project.id !== projectId) return project;

      const existingSubmissions = Array.isArray(project.submissions) ? project.submissions : [];
      return {
        ...project,
        status: 'Completed',
        submissions: [
          ...existingSubmissions,
          createSubmission(true),
        ],
      };
    });

    const writeResult = saveProjectsToStorage(updatedProjects);

    if (!writeResult.ok && writeResult.quota) {
      const metadataOnlyProjects = allProjects.map((project) => {
        if (project.id !== projectId) return project;

        const existingSubmissions = Array.isArray(project.submissions) ? project.submissions : [];
        return {
          ...project,
          status: 'Completed',
          submissions: [
            ...existingSubmissions,
            createSubmission(false),
          ],
        };
      });

      const metadataWriteResult = saveProjectsToStorage(metadataOnlyProjects);
      if (!metadataWriteResult.ok) {
        setUploadErrors((prev) => ({
          ...prev,
          [projectId]: 'Storage full. Remove old uploaded files and try again.',
        }));
        return;
      }

      refreshProjectTasks(metadataOnlyProjects);
      setSelectedProjectFiles((prev) => ({ ...prev, [projectId]: null }));
      setUploadErrors((prev) => ({
        ...prev,
        [projectId]: 'File metadata saved, but file content was too large for browser storage.',
      }));
      return;
    }

    refreshProjectTasks(updatedProjects);
    setSelectedProjectFiles((prev) => ({ ...prev, [projectId]: null }));
    setUploadErrors((prev) => ({ ...prev, [projectId]: '' }));
  };

  const openCount = tasks.filter((task) => ['open', 'in_progress', 'reopened'].includes(task.status)).length;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>My Tasks</h1>
          <p style={s.sub}>{tasks.length} assigned bugs • {openCount} active • {projectTasks.length} my projects</p>
        </div>
      </div>

      {loading ? (
        <div style={s.loading}>Loading assigned bugs...</div>
      ) : tasks.length === 0 && projectTasks.length === 0 ? (
        <div style={s.empty}>No tasks right now.</div>
      ) : (
        <div style={s.sections}>
          {tasks.length > 0 && (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {['Bug', 'Project', 'Due Date', 'Priority', 'Status Update'].map((head) => (
                      <th key={head} style={s.th}>{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task._id} style={s.row}>
                      <td style={s.td}>
                        <button type="button" onClick={() => navigate(`/bugs/${task._id}`)} style={s.linkBtn}>
                          <span style={s.bugId}>{task.bugId}</span>
                          <span style={s.bugTitle}>{task.title}</span>
                        </button>
                      </td>
                      <td style={s.td}>{task.project || '—'}</td>
                      <td style={s.td}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</td>
                      <td style={s.td}>
                        <span style={s.priorityBadge(task.priority)}>{task.priority}</span>
                      </td>
                      <td style={s.td}>
                        <select
                          value={task.status}
                          style={s.select}
                          disabled={updatingId === task._id}
                          onChange={(e) => updateStatus(task._id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>{status.replace('_', ' ')}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {projectTasks.length > 0 && (
            <div style={s.projectWrap}>
              <h2 style={s.projectTitle}>My Projects</h2>
              <div style={s.projectGrid}>
                {projectTasks.map((project) => (
                  <div key={project.id} style={s.projectCard}>
                    <h3 style={s.projectName}>{project.title}</h3>
                    <p style={s.projectDesc}>{project.description}</p>
                    <div style={s.projectMeta}>
                      <span>Status: {project.status}</span>
                      <span>Created by: {project.createdBy}</span>
                      {Array.isArray(project.takenByUsers) && project.takenByUsers.length > 0 && (
                        <span>Taken by: {project.takenByUsers.map((member) => member.username).join(', ')}</span>
                      )}
                      {!Array.isArray(project.takenByUsers) && project.takenBy && <span>Taken by: {project.takenBy}</span>}
                      {project.deadline && <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>}
                    </div>
                    {canViewSubmissions(project) && (
                      <div style={s.submissionBlock}>
                        <p style={s.submissionTitle}>Uploaded Files</p>
                        {getSubmissions(project).length === 0 ? (
                          <span style={s.submissionEmpty}>No files uploaded yet.</span>
                        ) : (
                          getSubmissions(project).map((submission) => (
                            <div key={submission.id} style={s.submissionItem}>
                              {submission.fileDataUrl ? (
                                <a href={submission.fileDataUrl} download={submission.fileName} style={s.submissionLink}>
                                  {submission.fileName}
                                </a>
                              ) : (
                                <span>{submission.fileName} (metadata only)</span>
                              )}
                              <span>by {submission.uploader}</span>
                              <span>{new Date(submission.uploadedAt).toLocaleString()}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                    {isTakenByCurrentUser(project) && (
                      <div style={s.projectActionRow}>
                        <input
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setSelectedProjectFiles((prev) => ({ ...prev, [project.id]: file }));
                            setUploadErrors((prev) => ({ ...prev, [project.id]: '' }));
                          }}
                          style={s.fileInput}
                          disabled={isPastDeadline(project.deadline)}
                        />
                        <button
                          type="button"
                          onClick={() => handleProjectFileUpload(project.id)}
                          style={{
                            ...s.uploadBtn,
                            opacity: isPastDeadline(project.deadline) || !selectedProjectFiles[project.id] ? 0.6 : 1,
                            cursor: isPastDeadline(project.deadline) || !selectedProjectFiles[project.id] ? 'not-allowed' : 'pointer',
                          }}
                          disabled={isPastDeadline(project.deadline) || !selectedProjectFiles[project.id]}
                        >
                          Upload File
                        </button>
                        {isPastDeadline(project.deadline) && (
                          <span style={s.deadlineWarn}>Deadline passed</span>
                        )}
                        {!!uploadErrors[project.id] && (
                          <span style={s.deadlineWarn}>{uploadErrors[project.id]}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCancelTakenProject(project.id)}
                          style={s.removeBtn}
                        >
                          Remove / Cancel Taken
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  page: { maxWidth: 1100, margin: '0 auto', fontFamily: THEME.Typography.fontFamily },
  header: { marginBottom: THEME.spacing.xl },
  title: { margin: 0, fontSize: THEME.Typography.fontSize['2xl'], color: THEME.colors.gray[900], fontWeight: THEME.Typography.fontWeight.bold },
  sub: { margin: `${THEME.spacing.sm}px 0 0`, color: THEME.colors.gray[500] },
  loading: { padding: THEME.spacing['2xl'], textAlign: 'center', color: THEME.colors.gray[600] },
  empty: { background: THEME.colors.white, border: `1px solid ${THEME.colors.gray[200]}`, borderRadius: THEME.borderRadius.lg, textAlign: 'center', color: THEME.colors.gray[500], padding: THEME.spacing['2xl'] },
  sections: { display: 'grid', gap: THEME.spacing.xl },
  tableWrap: { background: THEME.colors.white, border: `1px solid ${THEME.colors.gray[200]}`, borderRadius: THEME.borderRadius.lg, overflow: 'auto', boxShadow: THEME.shadows.sm },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: THEME.spacing.md, color: THEME.colors.gray[600], fontSize: THEME.Typography.fontSize.xs, textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: `1px solid ${THEME.colors.gray[200]}` },
  row: { borderBottom: `1px solid ${THEME.colors.gray[100]}` },
  td: { padding: THEME.spacing.md, color: THEME.colors.gray[700], fontSize: THEME.Typography.fontSize.sm, verticalAlign: 'middle' },
  linkBtn: { display: 'flex', flexDirection: 'column', gap: 2, border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', padding: 0 },
  bugId: { color: THEME.colors.blue[600], fontSize: THEME.Typography.fontSize.xs, fontWeight: THEME.Typography.fontWeight.bold, fontFamily: 'monospace' },
  bugTitle: { color: THEME.colors.gray[900], fontWeight: THEME.Typography.fontWeight.medium },
  priorityBadge: (priority) => ({
    display: 'inline-block',
    background: priority === 'critical' ? '#FEE2E2' : priority === 'high' ? '#FEF3C7' : priority === 'medium' ? '#FEF08A' : '#DCFCE7',
    color: priority === 'critical' ? '#991B1B' : priority === 'high' ? '#92400E' : priority === 'medium' ? '#713F12' : '#15803D',
    borderRadius: THEME.borderRadius.full,
    padding: `${THEME.spacing.xs}px ${THEME.spacing.sm}px`,
    fontSize: THEME.Typography.fontSize.xs,
    textTransform: 'capitalize',
    fontWeight: THEME.Typography.fontWeight.semibold,
  }),
  select: { background: THEME.colors.white, border: `1px solid ${THEME.colors.gray[300]}`, borderRadius: THEME.borderRadius.md, padding: `${THEME.spacing.xs}px ${THEME.spacing.sm}px`, color: THEME.colors.gray[900], fontSize: THEME.Typography.fontSize.sm },
  projectWrap: { background: THEME.colors.white, border: `1px solid ${THEME.colors.gray[200]}`, borderRadius: THEME.borderRadius.lg, padding: THEME.spacing.lg, boxShadow: THEME.shadows.sm },
  projectTitle: { margin: `0 0 ${THEME.spacing.md}px 0`, fontSize: THEME.Typography.fontSize.xl, color: THEME.colors.gray[900], fontWeight: THEME.Typography.fontWeight.semibold },
  projectGrid: { display: 'grid', gap: THEME.spacing.md },
  projectCard: { border: `1px solid ${THEME.colors.gray[200]}`, borderRadius: THEME.borderRadius.md, padding: THEME.spacing.md, background: THEME.colors.gray[50] },
  projectName: { margin: `0 0 ${THEME.spacing.xs}px 0`, color: THEME.colors.gray[900], fontSize: THEME.Typography.fontSize.base, fontWeight: THEME.Typography.fontWeight.semibold },
  projectDesc: { margin: `0 0 ${THEME.spacing.sm}px 0`, color: THEME.colors.gray[600], fontSize: THEME.Typography.fontSize.sm },
  projectMeta: { display: 'flex', gap: THEME.spacing.md, flexWrap: 'wrap', color: THEME.colors.gray[500], fontSize: THEME.Typography.fontSize.xs },
  submissionBlock: { marginTop: THEME.spacing.sm, borderTop: `1px solid ${THEME.colors.gray[200]}`, paddingTop: THEME.spacing.sm },
  submissionTitle: { margin: `0 0 ${THEME.spacing.xs}px 0`, color: THEME.colors.gray[700], fontSize: THEME.Typography.fontSize.sm, fontWeight: THEME.Typography.fontWeight.medium },
  submissionEmpty: { color: THEME.colors.gray[500], fontSize: THEME.Typography.fontSize.xs },
  submissionItem: { display: 'flex', gap: THEME.spacing.sm, flexWrap: 'wrap', alignItems: 'center', marginBottom: THEME.spacing.xs, color: THEME.colors.gray[600], fontSize: THEME.Typography.fontSize.xs },
  submissionLink: { color: THEME.colors.blue[600], textDecoration: 'none', fontWeight: THEME.Typography.fontWeight.medium },
  projectActionRow: { marginTop: THEME.spacing.sm, display: 'flex', gap: THEME.spacing.sm, flexWrap: 'wrap', alignItems: 'center' },
  fileInput: { fontSize: THEME.Typography.fontSize.sm },
  uploadBtn: {
    background: THEME.colors.blue[500],
    color: THEME.colors.white,
    border: 'none',
    borderRadius: THEME.borderRadius.md,
    padding: `${THEME.spacing.xs}px ${THEME.spacing.md}px`,
    cursor: 'pointer',
    fontSize: THEME.Typography.fontSize.sm,
    fontWeight: THEME.Typography.fontWeight.medium,
  },
  deadlineWarn: { color: THEME.colors.error, fontSize: THEME.Typography.fontSize.xs, fontWeight: THEME.Typography.fontWeight.medium },
  removeBtn: {
    background: THEME.colors.white,
    color: THEME.colors.error,
    border: `1px solid ${THEME.colors.error}`,
    borderRadius: THEME.borderRadius.md,
    padding: `${THEME.spacing.xs}px ${THEME.spacing.md}px`,
    cursor: 'pointer',
    fontSize: THEME.Typography.fontSize.sm,
    fontWeight: THEME.Typography.fontWeight.medium,
  },
};
