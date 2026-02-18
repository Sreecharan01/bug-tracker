import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { THEME } from '../theme/designSystem';

export default function ProjectsPage() {
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id || '';
  const currentUserName = user?.username || user?.name || user?.email || '';
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: ''
  });

  // Load projects from localStorage on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('projects');
    if (savedProjects) {
      const parsedProjects = JSON.parse(savedProjects);
      const normalizedProjects = parsedProjects.map((project) => {
        if (Array.isArray(project.takenByUsers)) return project;

        const legacyTakenUsers = project.takenBy
          ? [{ id: project.takenById || null, username: project.takenBy, takenAt: project.takenAt || null }]
          : [];

        return {
          ...project,
          takenByUsers: legacyTakenUsers,
        };
      });

      setProjects(normalizedProjects);
      localStorage.setItem('projects', JSON.stringify(normalizedProjects));
    }
  }, []);

  const getTakenUsers = (project) => {
    if (Array.isArray(project.takenByUsers)) return project.takenByUsers;
    if (project.takenBy) {
      return [{ id: project.takenById || null, username: project.takenBy, takenAt: project.takenAt || null }];
    }
    return [];
  };

  const hasCurrentUserTaken = (project) => {
    const takenUsers = getTakenUsers(project);
    return takenUsers.some((member) =>
      (member.id && currentUserId && member.id === currentUserId) ||
      (member.username && currentUserName && member.username === currentUserName)
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newProject = {
      id: Date.now().toString(),
      ...formData,
      status: 'Not Started',
      createdBy: currentUserName || 'Anonymous',
      createdById: currentUserId || null,
      createdAt: new Date().toISOString(),
      takenByUsers: [],
      takenBy: null,
      takenById: null,
      takenAt: null
    };

    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    localStorage.setItem('projects', JSON.stringify(updatedProjects));

    // Reset form
    setFormData({ title: '', description: '', deadline: '' });
    setShowForm(false);
  };

  const handleDelete = (id) => {
    const project = projects.find((item) => item.id === id);
    const isCreator = Boolean(
      project && (
        (project.createdById && currentUserId && project.createdById === currentUserId) ||
        (project.createdBy && currentUserName && project.createdBy === currentUserName)
      )
    );
    if (!project || !isCreator) return;

    const updatedProjects = projects.filter(p => p.id !== id);
    setProjects(updatedProjects);
    localStorage.setItem('projects', JSON.stringify(updatedProjects));
  };

  const handleTakeProject = (id) => {
    if (!currentUserName) return;

    const updatedProjects = projects.map((project) => {
      if (project.id !== id) return project;

      const takenUsers = getTakenUsers(project);
      const alreadyTakenByCurrentUser = takenUsers.some((member) =>
        (member.id && currentUserId && member.id === currentUserId) ||
        (member.username && currentUserName && member.username === currentUserName)
      );

      if (alreadyTakenByCurrentUser) return project;

      return {
        ...project,
        takenByUsers: [
          ...takenUsers,
          { id: currentUserId || null, username: currentUserName, takenAt: new Date().toISOString() },
        ],
        takenBy: currentUserName,
        takenById: currentUserId || null,
        takenAt: new Date().toISOString(),
        status: project.status === 'Not Started' ? 'In Progress' : project.status,
      };
    });

    setProjects(updatedProjects);
    localStorage.setItem('projects', JSON.stringify(updatedProjects));
  };

  const filteredProjects = projects.filter((project) => {
    const takenUsers = getTakenUsers(project);
    if (filterStatus === 'all') return true;
    if (filterStatus === 'open') return takenUsers.length === 0;
    if (filterStatus === 'taken') return takenUsers.length > 0;
    return true;
  });

  const isCreatorOfProject = (project) => {
    if (!project) return false;
    if (project.createdById && currentUserId) return project.createdById === currentUserId;
    if (project.createdBy && currentUserName) return project.createdBy === currentUserName;
    return false;
  };

  const styles = {
    page: {
      maxWidth: 1400,
      margin: '0 auto',
      fontFamily: THEME.Typography.fontFamily,
      padding: THEME.spacing.xl,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: THEME.spacing.xl,
    },
    title: {
      margin: 0,
      fontSize: THEME.Typography.fontSize['2xl'],
      fontWeight: THEME.Typography.fontWeight.bold,
      color: THEME.colors.gray[900],
    },
    subtitle: {
      margin: `${THEME.spacing.sm}px 0 0`,
      color: THEME.colors.gray[500],
      fontSize: THEME.Typography.fontSize.base,
    },
    primaryButton: {
      background: THEME.colors.blue[500],
      color: THEME.colors.white,
      border: 'none',
      padding: `${THEME.spacing.sm}px ${THEME.spacing.lg}px`,
      borderRadius: THEME.borderRadius.md,
      cursor: 'pointer',
      fontWeight: THEME.Typography.fontWeight.semibold,
      fontSize: THEME.Typography.fontSize.sm,
      transition: `all ${THEME.transitions.fast}`,
    },
    formCard: {
      background: THEME.colors.white,
      border: `1px solid ${THEME.colors.gray[200]}`,
      borderRadius: THEME.borderRadius.lg,
      padding: THEME.spacing.xl,
      marginBottom: THEME.spacing.lg,
      boxShadow: THEME.shadows.sm,
    },
    label: {
      display: 'block',
      marginBottom: THEME.spacing.xs,
      fontWeight: THEME.Typography.fontWeight.medium,
      color: THEME.colors.gray[700],
      fontSize: THEME.Typography.fontSize.sm,
    },
    input: {
      width: '100%',
      background: THEME.colors.white,
      border: `1px solid ${THEME.colors.gray[300]}`,
      borderRadius: THEME.borderRadius.md,
      padding: `${THEME.spacing.sm}px ${THEME.spacing.md}px`,
      color: THEME.colors.gray[900],
      fontSize: THEME.Typography.fontSize.sm,
      outline: 'none',
      fontFamily: THEME.Typography.fontFamily,
    },
    filters: {
      display: 'flex',
      gap: THEME.spacing.sm,
      marginBottom: THEME.spacing.lg,
      flexWrap: 'wrap',
    },
    filterButton: {
      background: THEME.colors.white,
      color: THEME.colors.gray[700],
      border: `1px solid ${THEME.colors.gray[300]}`,
      borderRadius: THEME.borderRadius.md,
      padding: `${THEME.spacing.xs}px ${THEME.spacing.md}px`,
      cursor: 'pointer',
      fontSize: THEME.Typography.fontSize.sm,
      fontWeight: THEME.Typography.fontWeight.medium,
    },
    projectCard: {
      background: THEME.colors.white,
      border: `1px solid ${THEME.colors.gray[200]}`,
      borderRadius: THEME.borderRadius.lg,
      padding: THEME.spacing.lg,
      boxShadow: THEME.shadows.sm,
    },
    projectTitle: {
      margin: `0 0 ${THEME.spacing.sm}px 0`,
      fontSize: THEME.Typography.fontSize.lg,
      fontWeight: THEME.Typography.fontWeight.semibold,
      color: THEME.colors.gray[900],
    },
    projectDescription: {
      margin: `0 0 ${THEME.spacing.md}px 0`,
      color: THEME.colors.gray[600],
      fontSize: THEME.Typography.fontSize.sm,
      lineHeight: THEME.Typography.lineHeight.normal,
    },
    meta: {
      display: 'flex',
      gap: THEME.spacing.md,
      flexWrap: 'wrap',
      color: THEME.colors.gray[500],
      fontSize: THEME.Typography.fontSize.xs,
      marginBottom: THEME.spacing.md,
    },
    rowActions: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: THEME.spacing.md,
    },
    takeButton: {
      background: THEME.colors.blue[500],
      color: THEME.colors.white,
      border: 'none',
      borderRadius: THEME.borderRadius.md,
      padding: `${THEME.spacing.xs}px ${THEME.spacing.md}px`,
      cursor: 'pointer',
      fontSize: THEME.Typography.fontSize.sm,
      fontWeight: THEME.Typography.fontWeight.medium,
    },
    takenBadge: {
      background: THEME.colors.blue[50],
      color: THEME.colors.blue[700],
      border: `1px solid ${THEME.colors.blue[100]}`,
      borderRadius: THEME.borderRadius.md,
      padding: `${THEME.spacing.xs}px ${THEME.spacing.md}px`,
      fontSize: THEME.Typography.fontSize.sm,
      fontWeight: THEME.Typography.fontWeight.medium,
    },
    deleteButton: {
      background: 'transparent',
      color: THEME.colors.gray[500],
      border: `1px solid ${THEME.colors.gray[300]}`,
      borderRadius: THEME.borderRadius.md,
      padding: `${THEME.spacing.xs}px ${THEME.spacing.md}px`,
      cursor: 'pointer',
      fontSize: THEME.Typography.fontSize.sm,
    },
    empty: {
      background: THEME.colors.white,
      border: `1px solid ${THEME.colors.gray[200]}`,
      borderRadius: THEME.borderRadius.lg,
      padding: THEME.spacing['2xl'],
      textAlign: 'center',
      color: THEME.colors.gray[500],
      fontSize: THEME.Typography.fontSize.base,
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
          Projects
          </h1>
          <p style={styles.subtitle}>Create once and let any user take ownership.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={styles.primaryButton}
        >
          {showForm ? 'Cancel' : 'Create Project'}
        </button>
      </div>

      <div style={styles.filters}>
        <button
          type="button"
          onClick={() => setFilterStatus('all')}
          style={{
            ...styles.filterButton,
            background: filterStatus === 'all' ? THEME.colors.blue[500] : THEME.colors.white,
            color: filterStatus === 'all' ? THEME.colors.white : THEME.colors.gray[700],
            borderColor: filterStatus === 'all' ? THEME.colors.blue[500] : THEME.colors.gray[300],
          }}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('open')}
          style={{
            ...styles.filterButton,
            background: filterStatus === 'open' ? THEME.colors.blue[500] : THEME.colors.white,
            color: filterStatus === 'open' ? THEME.colors.white : THEME.colors.gray[700],
            borderColor: filterStatus === 'open' ? THEME.colors.blue[500] : THEME.colors.gray[300],
          }}
        >
          Open
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('taken')}
          style={{
            ...styles.filterButton,
            background: filterStatus === 'taken' ? THEME.colors.blue[500] : THEME.colors.white,
            color: filterStatus === 'taken' ? THEME.colors.white : THEME.colors.gray[700],
            borderColor: filterStatus === 'taken' ? THEME.colors.blue[500] : THEME.colors.gray[300],
          }}
        >
          Taken
        </button>
      </div>

      {showForm && (
        <div style={styles.formCard}>
          <h2 style={{ margin: `0 0 ${THEME.spacing.md}px 0`, fontSize: THEME.Typography.fontSize.xl, color: THEME.colors.gray[900] }}>
            New Project
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: THEME.spacing.md }}>
              <label style={styles.label}>
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                style={styles.input}
              />
            </div>

            <div style={{ marginBottom: THEME.spacing.md }}>
              <label style={styles.label}>
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                style={{
                  ...styles.input,
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: THEME.spacing.md }}>
              <label style={styles.label}>
                Deadline
              </label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
                style={{ ...styles.input, width: 'auto' }}
              />
            </div>

            <button
              type="submit"
              style={styles.primaryButton}
            >
              Create Project
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gap: THEME.spacing.md }}>
        {filteredProjects.length === 0 ? (
          <div style={styles.empty}>
            No projects in this view.
          </div>
        ) : (
          filteredProjects.map(project => {
            const takenUsers = getTakenUsers(project);
            const currentUserTaken = hasCurrentUserTaken(project);

            return (
            <div
              key={project.id}
              style={styles.projectCard}
            >
              <h3 style={styles.projectTitle}>{project.title}</h3>
              <p style={styles.projectDescription}>{project.description}</p>
              <div style={styles.meta}>
                <span>Status: {project.status}</span>
                <span>Created by: {project.createdBy}</span>
                {project.deadline && <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>}
                {takenUsers.length > 0 && (
                  <span>Taken by: {takenUsers.map((member) => member.username).join(', ')}</span>
                )}
              </div>
              <div style={styles.rowActions}>
                <div>
                  <button
                    type="button"
                    onClick={() => handleTakeProject(project.id)}
                    style={{
                      ...styles.takeButton,
                      background: currentUserTaken ? THEME.colors.gray[300] : styles.takeButton.background,
                      cursor: currentUserTaken ? 'default' : styles.takeButton.cursor,
                    }}
                    disabled={currentUserTaken}
                  >
                    {currentUserTaken ? 'Taken by you' : 'Take Project'}
                  </button>
                  {takenUsers.length > 0 && (
                    <span style={{ ...styles.takenBadge, marginLeft: THEME.spacing.sm }}>
                      {takenUsers.length} user{takenUsers.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {isCreatorOfProject(project) && (
                  <button
                    onClick={() => handleDelete(project.id)}
                    style={styles.deleteButton}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })
        )}
      </div>
    </div>
  );
}
